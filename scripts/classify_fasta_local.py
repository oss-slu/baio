"""
classify_fasta_local.py — Project Baio
DNA sequence classification using Evo 2 on Apple Silicon (M1/M2/M3).

Device: Apple Silicon MPS via native PyTorch (no CUDA, no flash-attn).
Model:  evo2_7b in "Light" mode (int8 quantised, fits in ~16 GB unified memory).

Classification logic
--------------------
For each sequence we compute a per-token *log-likelihood* (log P(x_t | x_<t))
averaged over the full sequence.  Sequences whose score exceeds --threshold are
labelled "Classified" (they obey known biological grammar); those below are
labelled "Unclassified" (candidate dark-matter DNA / noise).

Additionally, intermediate-layer embeddings (blocks.28.mlp.l3 by default) are
mean-pooled and written to a .npy file for downstream clustering / UMAP.

Usage
-----
    python scripts/classify_fasta_local.py \
        --fasta path/to/sequences.fasta \
        --output results/local_output.csv \
        --model evo2_7b \
        --threshold -2.5 \
        --batch-size 1

Requirements (install once)
---------------------------
    pip install evo2 biopython numpy pandas torch
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
# Device setup — MPS for Apple Silicon, CPU as fallback
# ---------------------------------------------------------------------------


def get_device() -> torch.device:
    if torch.backends.mps.is_available():
        print("[device] Apple Silicon MPS backend selected.")
        return torch.device("mps")
    print("[device] MPS not available — falling back to CPU (slow).")
    return torch.device("cpu")


# ---------------------------------------------------------------------------
# Model loading
# ---------------------------------------------------------------------------


def load_model(model_name: str, device: torch.device):
    """Load Evo 2 model using the Arc Institute evo2 package."""
    try:
        from evo2 import Evo2  # type: ignore[import]
    except ImportError:
        sys.exit(
            "ERROR: evo2 package not found.\n"
            "Install with:  pip install evo2\n"
            "See: https://github.com/ArcInstitute/evo2"
        )

    print(f"[model] Loading {model_name} …  (first run downloads weights ~15 GB)")
    # trust_remote_code is implicit inside the evo2 package
    model = Evo2(model_name)

    # Move to MPS — evo2 defaults to CUDA; override for Apple Silicon
    model.model = model.model.to(dtype=torch.float32, device=device)
    model.model.eval()
    print(f"[model] {model_name} ready on {device}.")
    return model


# ---------------------------------------------------------------------------
# Per-sequence scoring
# ---------------------------------------------------------------------------


def compute_log_likelihood(
    model,
    tokenizer,
    sequence: str,
    device: torch.device,
    max_length: int = 8192,
) -> float:
    """
    Compute mean per-token log-likelihood for a DNA sequence.

    Returns the average log P(x_t | x_<t) across all tokens.
    Higher (less negative) → sequence follows known biological grammar.
    Lower (more negative) → novel / unusual / noise.
    """
    seq = sequence.upper().replace(" ", "").replace("\n", "")[:max_length]

    input_ids = (
        torch.tensor(tokenizer.tokenize(seq), dtype=torch.long).unsqueeze(0).to(device)
    )  # shape: (1, L)

    with torch.no_grad():
        logits, _ = model(input_ids, return_embeddings=False)
        # logits shape: (1, L, vocab_size)

    # Shift: predict token t from context x_<t
    shift_logits = logits[0, :-1, :]  # (L-1, V)
    shift_labels = input_ids[0, 1:]  # (L-1,)

    log_probs = torch.nn.functional.log_softmax(shift_logits, dim=-1)
    token_log_probs = log_probs[torch.arange(len(shift_labels)), shift_labels]
    return float(token_log_probs.mean().cpu())


def extract_embedding(
    model,
    tokenizer,
    sequence: str,
    device: torch.device,
    layer_name: str = "blocks.28.mlp.l3",
    max_length: int = 8192,
) -> np.ndarray | None:
    """
    Extract a mean-pooled embedding from an intermediate layer.

    Uses a forward hook on *layer_name*.  The resulting vector has shape
    (hidden_dim,) and can be used for clustering / UMAP visualisation.
    """
    seq = sequence.upper().replace(" ", "").replace("\n", "")[:max_length]
    input_ids = (
        torch.tensor(tokenizer.tokenize(seq), dtype=torch.long).unsqueeze(0).to(device)
    )

    captured: list[torch.Tensor] = []

    # Resolve the target sub-module by dotted path
    target_module = model.model
    for part in layer_name.split("."):
        target_module = getattr(target_module, part, None)
        if target_module is None:
            print(f"[embed] Layer '{layer_name}' not found — skipping embedding.")
            return None

    def _hook(module, input, output):  # noqa: ARG001
        captured.append(output.detach().cpu())

    handle = target_module.register_forward_hook(_hook)
    try:
        with torch.no_grad():
            model(input_ids, return_embeddings=False)
    finally:
        handle.remove()

    if not captured:
        return None

    # Mean-pool over sequence length dimension
    hidden = captured[0]  # (1, L, D)  or  (1, D)
    if hidden.dim() == 3:
        hidden = hidden.mean(dim=1)  # (1, D)
    return hidden.squeeze(0).float().numpy()


# ---------------------------------------------------------------------------
# FASTA iteration (Biopython)
# ---------------------------------------------------------------------------


def iter_fasta(fasta_path: Path):
    """Yield (record_id, sequence_str) for every record in the FASTA file."""
    for record in SeqIO.parse(str(fasta_path), "fasta"):
        yield str(record.id), str(record.seq)


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------


def classify(args: argparse.Namespace) -> None:
    device = get_device()
    model = load_model(args.model, device)
    tokenizer = model.tokenizer

    fasta_path = Path(args.fasta)
    if not fasta_path.exists():
        sys.exit(f"ERROR: FASTA file not found: {fasta_path}")

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    embeddings_path = (
        output_path.with_suffix(".embeddings.npy") if args.save_embeddings else None
    )

    results: list[dict] = []
    all_embeddings: list[np.ndarray] = []
    seq_ids: list[str] = []

    print(f"\n[run] Processing {fasta_path.name}  (threshold = {args.threshold})\n")

    for i, (seq_id, sequence) in enumerate(iter_fasta(fasta_path)):
        if not sequence:
            continue

        t0 = time.time()
        ll = compute_log_likelihood(
            model, tokenizer, sequence, device, max_length=args.max_length
        )
        label = "Classified" if ll >= args.threshold else "Unclassified"
        elapsed = time.time() - t0

        result = {
            "seq_id": seq_id,
            "length": len(sequence),
            "log_likelihood": round(ll, 6),
            "label": label,
            "elapsed_s": round(elapsed, 2),
        }
        results.append(result)

        status_icon = "✓" if label == "Classified" else "?"
        print(
            f"  [{i+1:>4}] {status_icon} {seq_id[:40]:<40}  "
            f"ll={ll:+.3f}  {label}  ({len(sequence)} bp, {elapsed:.1f}s)"
        )

        if args.save_embeddings:
            emb = extract_embedding(
                model,
                tokenizer,
                sequence,
                device,
                layer_name=args.embed_layer,
                max_length=args.max_length,
            )
            if emb is not None:
                all_embeddings.append(emb)
                seq_ids.append(seq_id)

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
    print(f"       Results → {output_path}")

    if args.save_embeddings and all_embeddings:
        emb_array = np.stack(all_embeddings)
        np.save(embeddings_path, emb_array)
        np.save(str(embeddings_path).replace(".npy", "_ids.npy"), np.array(seq_ids))
        print(f"       Embeddings → {embeddings_path}  shape={emb_array.shape}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Classify DNA sequences (FASTA) with Evo 2 on Apple Silicon",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    p.add_argument("--fasta", required=True, help="Input FASTA file")
    p.add_argument("--output", default="results/output.csv", help="Output CSV path")
    p.add_argument("--model", default="evo2_7b", help="Evo 2 model size")
    p.add_argument(
        "--threshold",
        type=float,
        default=-2.5,
        help="Log-likelihood threshold. Sequences above → Classified.",
    )
    p.add_argument(
        "--max-length", type=int, default=8192, help="Max tokens per sequence"
    )
    p.add_argument(
        "--save-embeddings",
        action="store_true",
        help="Also extract and save intermediate-layer embeddings",
    )
    p.add_argument(
        "--embed-layer",
        default="blocks.28.mlp.l3",
        help="Dotted path to the intermediate layer for embedding extraction",
    )
    return p


if __name__ == "__main__":
    classify(build_parser().parse_args())
