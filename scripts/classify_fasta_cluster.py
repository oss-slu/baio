"""
classify_fasta_cluster.py — Project Baio
DNA sequence classification using Evo 2 on the Libra HPC cluster (CUDA).

Device: NVIDIA GPU(s) via CUDA.  Automatically selects evo2_40b when an H100
is detected (≥ 80 GB VRAM), otherwise falls back to evo2_7b.

Classification logic
--------------------
Same log-likelihood scoring as the local script:
  · mean per-token log P(x_t | x_<t) over the full sequence
  · above --threshold  →  "Classified"   (known biological grammar)
  · below --threshold  →  "Unclassified" (dark-matter DNA / noise)

Intermediate-layer embeddings (blocks.28.mlp.l3) are optionally written to a
.npy file for downstream UMAP / clustering analysis.

Multi-GPU note
--------------
When more than one GPU is available, set device_map="auto" so the model is
sharded across all visible GPUs.  On single-GPU nodes pass --device cuda:0.

Usage
-----
    python scripts/classify_fasta_cluster.py \
        --fasta /scratch/$USER/data/sequences.fasta \
        --output /scratch/$USER/results/output.csv \
        --batch-size 8 \
        --threshold -2.5

Requirements
------------
    pip install evo2 biopython numpy pandas torch
    # No flash-attn or transformer-engine needed for the evo2 package itself,
    # but they can be installed for extra speed on Ampere/Hopper GPUs:
    #   pip install flash-attn --no-build-isolation
"""

from __future__ import annotations

import argparse
import csv
import sys
import time
from pathlib import Path

import numpy as np
import torch
from Bio import SeqIO

# ---------------------------------------------------------------------------
# Device / model selection
# ---------------------------------------------------------------------------


def get_device(device_str: str) -> torch.device:
    if not torch.cuda.is_available():
        print("[device] WARNING: CUDA not available — falling back to CPU (very slow).")
        return torch.device("cpu")
    device = torch.device(device_str)
    name = torch.cuda.get_device_name(device)
    mem_gb = torch.cuda.get_device_properties(device).total_memory / 1024**3
    print(f"[device] {name}  ({mem_gb:.1f} GB VRAM)  →  {device}")
    return device


def select_model_size(device: torch.device, override: str | None) -> str:
    if override:
        return override
    if not torch.cuda.is_available():
        return "evo2_7b"
    mem_gb = torch.cuda.get_device_properties(device).total_memory / 1024**3
    if mem_gb >= 79:
        print("[model] H100/A100 detected — selecting evo2_40b.")
        return "evo2_40b"
    print("[model] GPU < 80 GB — selecting evo2_7b.")
    return "evo2_7b"


def load_model(model_name: str, device: torch.device, multi_gpu: bool):
    try:
        from evo2 import Evo2  # type: ignore[import]
    except ImportError:
        sys.exit(
            "ERROR: evo2 package not found.\n"
            "Install with:  pip install evo2\n"
            "See: https://github.com/ArcInstitute/evo2"
        )

    print(f"[model] Loading {model_name} …")
    model = Evo2(model_name)

    if multi_gpu and torch.cuda.device_count() > 1:
        from accelerate import dispatch_model, infer_auto_device_map  # type: ignore[import]

        device_map = infer_auto_device_map(model.model)
        model.model = dispatch_model(model.model, device_map=device_map)
        print(f"[model] Sharded across {torch.cuda.device_count()} GPUs.")
    else:
        dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
        model.model = model.model.to(dtype=dtype, device=device)

    model.model.eval()
    print(f"[model] {model_name} ready.")
    return model


# ---------------------------------------------------------------------------
# Scoring and embedding
# ---------------------------------------------------------------------------


def compute_log_likelihood(
    model,
    tokenizer,
    sequence: str,
    device: torch.device,
    max_length: int = 8192,
) -> float:
    """Mean per-token log P(x_t | x_<t) for a single sequence."""
    seq = sequence.upper().replace(" ", "").replace("\n", "")[:max_length]
    input_ids = (
        torch.tensor(tokenizer.tokenize(seq), dtype=torch.long).unsqueeze(0).to(device)
    )

    with torch.no_grad():
        logits, _ = model(input_ids, return_embeddings=False)

    shift_logits = logits[0, :-1, :].float()
    shift_labels = input_ids[0, 1:]
    log_probs = torch.nn.functional.log_softmax(shift_logits, dim=-1)
    token_ll = log_probs[torch.arange(len(shift_labels)), shift_labels]
    return float(token_ll.mean().cpu())


def compute_log_likelihood_batch(
    model,
    tokenizer,
    sequences: list[str],
    device: torch.device,
    max_length: int = 8192,
) -> list[float]:
    """
    Batch log-likelihood computation.

    Sequences are padded to the same length within the batch; padding tokens
    are excluded from the per-token average.
    """
    cleaned = [
        s.upper().replace(" ", "").replace("\n", "")[:max_length] for s in sequences
    ]
    token_lists = [tokenizer.tokenize(s) for s in cleaned]
    pad_id = getattr(tokenizer, "pad_token_id", 0) or 0
    max_len = max(len(t) for t in token_lists)

    padded = [t + [pad_id] * (max_len - len(t)) for t in token_lists]
    lengths = [len(t) for t in token_lists]

    input_ids = torch.tensor(padded, dtype=torch.long).to(device)  # (B, L)

    with torch.no_grad():
        logits, _ = model(input_ids, return_embeddings=False)

    results: list[float] = []
    for i, (seq_len, token_list) in enumerate(zip(lengths, token_lists)):
        if seq_len < 2:
            results.append(float("nan"))
            continue
        sl = slice(0, seq_len - 1)
        shift_logits = logits[i, sl, :].float()
        shift_labels = input_ids[i, 1:seq_len]
        log_probs = torch.nn.functional.log_softmax(shift_logits, dim=-1)
        token_ll = log_probs[torch.arange(len(shift_labels)), shift_labels]
        results.append(float(token_ll.mean().cpu()))

    return results


def extract_embedding(
    model,
    tokenizer,
    sequence: str,
    device: torch.device,
    layer_name: str = "blocks.28.mlp.l3",
    max_length: int = 8192,
) -> np.ndarray | None:
    """Extract mean-pooled embedding from an intermediate layer via forward hook."""
    seq = sequence.upper().replace(" ", "").replace("\n", "")[:max_length]
    input_ids = (
        torch.tensor(tokenizer.tokenize(seq), dtype=torch.long).unsqueeze(0).to(device)
    )

    target = model.model
    for part in layer_name.split("."):
        target = getattr(target, part, None)
        if target is None:
            print(f"[embed] Layer '{layer_name}' not found — skipping.")
            return None

    captured: list[torch.Tensor] = []

    def _hook(module, inp, out):  # noqa: ARG001
        captured.append(out.detach().cpu().float())

    handle = target.register_forward_hook(_hook)
    try:
        with torch.no_grad():
            model(input_ids, return_embeddings=False)
    finally:
        handle.remove()

    if not captured:
        return None

    hidden = captured[0]  # (1, L, D) or (1, D)
    if hidden.dim() == 3:
        hidden = hidden.mean(dim=1)
    return hidden.squeeze(0).numpy()


# ---------------------------------------------------------------------------
# FASTA iteration (Biopython)
# ---------------------------------------------------------------------------


def iter_fasta(fasta_path: Path):
    for record in SeqIO.parse(str(fasta_path), "fasta"):
        yield str(record.id), str(record.seq)


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------


def classify(args: argparse.Namespace) -> None:
    device = get_device(args.device)
    model_name = select_model_size(device, args.model)
    model = load_model(model_name, device, multi_gpu=args.multi_gpu)
    tokenizer = model.tokenizer

    fasta_path = Path(args.fasta)
    if not fasta_path.exists():
        sys.exit(f"ERROR: FASTA file not found: {fasta_path}")

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    embeddings_path = (
        output_path.with_suffix(".embeddings.npy") if args.save_embeddings else None
    )

    # Collect all sequences first (enables accurate batching progress)
    print(f"[io] Reading {fasta_path} …")
    all_seqs: list[tuple[str, str]] = [
        (sid, seq) for sid, seq in iter_fasta(fasta_path) if seq
    ]
    print(f"[io] {len(all_seqs)} sequences loaded.")

    results: list[dict] = []
    all_embeddings: list[np.ndarray] = []
    embed_ids: list[str] = []

    print(f"\n[run] batch_size={args.batch_size}  threshold={args.threshold}\n")

    total_batches = (len(all_seqs) + args.batch_size - 1) // args.batch_size

    for b_idx in range(0, len(all_seqs), args.batch_size):
        batch = all_seqs[b_idx : b_idx + args.batch_size]
        batch_ids = [item[0] for item in batch]
        batch_seqs = [item[1] for item in batch]

        t0 = time.time()
        ll_scores = compute_log_likelihood_batch(
            model, tokenizer, batch_seqs, device, max_length=args.max_length
        )
        elapsed = time.time() - t0
        batch_num = b_idx // args.batch_size + 1
        print(
            f"  batch {batch_num}/{total_batches}  ({len(batch)} seqs, {elapsed:.1f}s)"
        )

        for seq_id, seq, ll in zip(batch_ids, batch_seqs, ll_scores):
            label = "Classified" if ll >= args.threshold else "Unclassified"
            results.append(
                {
                    "seq_id": seq_id,
                    "length": len(seq),
                    "log_likelihood": round(ll, 6) if ll == ll else None,
                    "label": label,
                }
            )

        if args.save_embeddings:
            for seq_id, seq in zip(batch_ids, batch_seqs):
                emb = extract_embedding(
                    model,
                    tokenizer,
                    seq,
                    device,
                    layer_name=args.embed_layer,
                    max_length=args.max_length,
                )
                if emb is not None:
                    all_embeddings.append(emb)
                    embed_ids.append(seq_id)

    # Write CSV
    with open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(results[0].keys()))
        writer.writeheader()
        writer.writerows(results)

    classified = sum(1 for r in results if r["label"] == "Classified")
    unclassified = len(results) - classified

    print(f"\n[done] {len(results)} sequences processed.")
    print(f"       Classified:   {classified}")
    print(f"       Unclassified: {unclassified}")
    print(f"       Results  → {output_path}")

    if args.save_embeddings and all_embeddings:
        emb_array = np.stack(all_embeddings)
        np.save(embeddings_path, emb_array)
        np.save(str(embeddings_path).replace(".npy", "_ids.npy"), np.array(embed_ids))
        print(f"       Embeddings → {embeddings_path}  shape={emb_array.shape}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Classify DNA sequences (FASTA) with Evo 2 on CUDA (Libra cluster)",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    p.add_argument(
        "--fasta",
        required=True,
        help="Input FASTA file (absolute path recommended on cluster)",
    )
    p.add_argument("--output", default="results/output.csv", help="Output CSV path")
    p.add_argument(
        "--model",
        default=None,
        help="Force model size: evo2_7b or evo2_40b. "
        "Auto-detected from GPU VRAM if omitted.",
    )
    p.add_argument("--device", default="cuda:0", help="CUDA device string, e.g. cuda:0")
    p.add_argument(
        "--multi-gpu",
        action="store_true",
        help="Shard model across all visible GPUs (requires accelerate)",
    )
    p.add_argument(
        "--batch-size", type=int, default=8, help="Number of sequences per forward pass"
    )
    p.add_argument(
        "--threshold",
        type=float,
        default=-2.5,
        help="Log-likelihood threshold. Sequences above → Classified.",
    )
    p.add_argument(
        "--max-length",
        type=int,
        default=8192,
        help="Max tokens per sequence (longer seqs are truncated)",
    )
    p.add_argument(
        "--save-embeddings",
        action="store_true",
        help="Extract and save intermediate-layer embeddings to .npy",
    )
    p.add_argument(
        "--embed-layer",
        default="blocks.28.mlp.l3",
        help="Dotted path to intermediate layer for embedding extraction",
    )
    return p


if __name__ == "__main__":
    classify(build_parser().parse_args())
