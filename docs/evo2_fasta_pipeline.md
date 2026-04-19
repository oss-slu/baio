# Project Baio — Evo 2 FASTA Classification Pipeline

**Last updated:** 2026-04-18
**Author:** Mainuddin Sarker (Tech Lead, SLU OSS)
**Branch:** `feat/database`

---

## Table of Contents

1. [Project Context](#1-project-context)
2. [Architecture Overview](#2-architecture-overview)
3. [Classification Logic](#3-classification-logic)
4. [Script: classify_fasta_local.py (M1 Mac)](#4-script-classify_fasta_localpy-m1-mac)
5. [Script: classify_fasta_cluster.py (Libra CUDA)](#5-script-classify_fasta_clusterpy-libra-cuda)
6. [Script: libra_submit.sh (Slurm)](#6-script-libra_submitsh-slurm)
7. [How to Run](#7-how-to-run)
8. [Output Format](#8-output-format)
9. [Threshold Calibration](#9-threshold-calibration)
10. [Extension Points](#10-extension-points)
11. [Existing Codebase Integration Map](#11-existing-codebase-integration-map)
12. [Prompt for Claude to Extend This Work](#12-prompt-for-claude-to-extend-this-work)

---

## 1. Project Context

**Project Baio** is an open-source bioinformatics pipeline developed at Saint Louis University.
Goal: classify DNA sequences from FASTA files using the **Evo 2** foundation model (Arc Institute).

| Term | Meaning |
|---|---|
| **Classified** | Sequence matches known biological grammar (host or viral DNA) |
| **Unclassified** | Novel sequence — candidate "dark matter" DNA or non-biological noise |

### Hardware targets

| Environment | Device | Model | Notes |
|---|---|---|---|
| Local MacBook M1 | Apple Silicon MPS | `evo2_7b` "Light" mode | float32, batch=1 |
| Libra HPC (SLU) | NVIDIA CUDA GPU | `evo2_7b` or `evo2_40b` | bfloat16, batch=8+ |
| Libra with H100 | CUDA, ≥80 GB VRAM | `evo2_40b` auto-selected | Higher accuracy |

### Key constraints
- **No** `flash-attn` or `transformer-engine` on M1 (Apple Silicon restriction)
- Uses Arc Institute's native `evo2` Python package, NOT the HuggingFace version
  - HuggingFace version (`nvidia/evo2-7b`) = CUDA-only, already in `binary_classifiers/evo2_embedder.py`
  - Arc Institute version = cross-platform, supports MPS

---

## 2. Architecture Overview

```
FASTA file
    │
    ▼
Biopython SeqIO.parse()
    │  yields (seq_id, sequence_str)
    ▼
Evo 2 forward pass
    │
    ├── Log-likelihood score  ──►  threshold comparison  ──►  "Classified" / "Unclassified"
    │
    └── Forward hook on blocks.28.mlp.l3  ──►  mean-pool  ──►  embedding vector
                                                                        │
                                                                        ▼
                                                              results.embeddings.npy
                                                           (for UMAP / HDBSCAN later)
    ▼
results/output.csv
```

### Files created

```
scripts/
├── classify_fasta_local.py      ← M1 Mac version (MPS)
├── classify_fasta_cluster.py    ← Libra cluster version (CUDA)
└── libra_submit.sh              ← Slurm job submission script
```

### Related existing files (do NOT duplicate logic from these)

```
binary_classifiers/
├── evo2_embedder.py             ← HuggingFace / CUDA-only Evo 2 embedder
├── predict_class.py             ← Host/Virus classifier (RF, SVM, Evo2)
└── transformers/kmers_transformer.py

metaseq/
├── dataio.py                    ← load_fasta(), load_fastq(), filter_sequences()
└── inference.py                 ← ClassifierInference wrapper

backend/app/services/
└── classification.py            ← API-facing classification service
```

---

## 3. Classification Logic

### Why log-likelihood?

Evo 2 is a **causal language model** trained on 9.3 trillion nucleotides.
It learns the statistical grammar of DNA: codon usage, motifs, regulatory signals.

For each token position `t`, the model predicts `P(x_t | x_1 … x_{t-1})`.

The **mean per-token log-likelihood** is:

```
LL(sequence) = (1 / L) * Σ log P(x_t | x_<t)
```

| LL value | Interpretation |
|---|---|
| Close to 0 (e.g., -1.0) | Model is very confident — strong biological grammar |
| Around -2.5 (threshold) | Boundary between known and novel |
| Very negative (e.g., -5.0) | Model is surprised — likely novel / noise / dark matter |

### Threshold

Default: `--threshold -2.5`

This is a **starting point**. You must calibrate it on a labeled validation set.
See [Section 9: Threshold Calibration](#9-threshold-calibration).

### Intermediate layer embeddings

Layer `blocks.28.mlp.l3` is the output of the 3rd linear layer in the MLP of
transformer block 28 (0-indexed). At 7b scale this is roughly 70% through the
network — deep enough to capture semantic features, shallow enough to avoid
output-layer bias.

The embedding is **mean-pooled** across the sequence length dimension:
`embedding = hidden_states.mean(dim=sequence_length)` → shape `(hidden_dim,)`

These vectors are saved as `.npy` for downstream work (UMAP, HDBSCAN clustering).

---

## 4. Script: classify_fasta_local.py (M1 Mac)

**Full path:** `scripts/classify_fasta_local.py`

### What it does
1. Detects Apple Silicon MPS device (falls back to CPU)
2. Loads `evo2_7b` in **float32** (MPS has limited float16 support)
3. Iterates FASTA records with Biopython
4. For each sequence: runs a forward pass, computes mean log-likelihood
5. Labels each sequence Classified / Unclassified based on threshold
6. Optionally registers a forward hook on `blocks.28.mlp.l3` to extract embeddings
7. Writes results to CSV; embeddings to `.npy`

### Key design decisions
- **batch_size=1**: MPS does not benefit from large batches the way CUDA does.
  Batching on MPS can actually be slower due to tensor synchronisation overhead.
- **float32**: MPS float16 support is incomplete in PyTorch < 2.4. float32 is safe.
- **forward hook pattern**: We attach a `register_forward_hook` to the target
  sub-module rather than modifying the model, so we don't need to fork evo2's
  model code.

### CLI reference

```
python scripts/classify_fasta_local.py \
    --fasta           data/covid_reads5.fasta   # Input FASTA file
    --output          results/local.csv          # Output CSV
    --model           evo2_7b                    # Model size (only 7b on M1)
    --threshold       -2.5                       # LL threshold
    --max-length      8192                       # Max tokens (longer seqs truncated)
    --save-embeddings                            # Also extract embeddings
    --embed-layer     blocks.28.mlp.l3           # Target intermediate layer
```

### Full annotated source

```python
"""
classify_fasta_local.py — Project Baio
DNA sequence classification using Evo 2 on Apple Silicon (M1/M2/M3).

Device: Apple Silicon MPS via native PyTorch (no CUDA, no flash-attn).
Model:  evo2_7b in "Light" mode (int8 quantised, fits in ~16 GB unified memory).
"""

from __future__ import annotations
import argparse, csv, sys, time
from pathlib import Path

import numpy as np
import torch
from Bio import SeqIO


def get_device() -> torch.device:
    # Prefer MPS (Apple Silicon GPU), fall back to CPU
    if torch.backends.mps.is_available():
        print("[device] Apple Silicon MPS backend selected.")
        return torch.device("mps")
    print("[device] MPS not available — falling back to CPU (slow).")
    return torch.device("cpu")


def load_model(model_name: str, device: torch.device):
    from evo2 import Evo2                          # Arc Institute package
    model = Evo2(model_name)
    # Override device — evo2 defaults to CUDA
    model.model = model.model.to(dtype=torch.float32, device=device)
    model.model.eval()
    return model


def compute_log_likelihood(model, tokenizer, sequence, device, max_length=8192):
    seq = sequence.upper().replace(" ", "").replace("\n", "")[:max_length]
    input_ids = torch.tensor(
        tokenizer.tokenize(seq), dtype=torch.long
    ).unsqueeze(0).to(device)                      # shape: (1, L)

    with torch.no_grad():
        logits, _ = model(input_ids, return_embeddings=False)
        # logits: (1, L, vocab_size)

    # Shift: token t is predicted from context x_<t
    shift_logits = logits[0, :-1, :]               # (L-1, V)
    shift_labels = input_ids[0, 1:]                # (L-1,)
    log_probs = torch.nn.functional.log_softmax(shift_logits, dim=-1)
    token_ll = log_probs[torch.arange(len(shift_labels)), shift_labels]
    return float(token_ll.mean().cpu())             # scalar


def extract_embedding(model, tokenizer, sequence, device,
                      layer_name="blocks.28.mlp.l3", max_length=8192):
    seq = sequence.upper()[:max_length]
    input_ids = torch.tensor(
        tokenizer.tokenize(seq), dtype=torch.long
    ).unsqueeze(0).to(device)

    # Resolve sub-module by dotted path
    target = model.model
    for part in layer_name.split("."):
        target = getattr(target, part, None)
        if target is None:
            return None

    captured = []
    def _hook(module, inp, out):
        captured.append(out.detach().cpu().float())

    handle = target.register_forward_hook(_hook)
    try:
        with torch.no_grad():
            model(input_ids, return_embeddings=False)
    finally:
        handle.remove()

    if not captured:
        return None
    hidden = captured[0]                           # (1, L, D) or (1, D)
    if hidden.dim() == 3:
        hidden = hidden.mean(dim=1)                # mean-pool over sequence
    return hidden.squeeze(0).numpy()               # shape: (D,)
```

---

## 5. Script: classify_fasta_cluster.py (Libra CUDA)

**Full path:** `scripts/classify_fasta_cluster.py`

### What it does
1. Detects CUDA device; reads GPU VRAM to auto-select model size
2. Loads `evo2_7b` (< 80 GB) or `evo2_40b` (≥ 80 GB, i.e., H100)
3. Uses **bfloat16** on Ampere/Hopper, float16 otherwise
4. Processes sequences in **batches** with padding + masking
5. Optionally shards model across multiple GPUs (`--multi-gpu`)
6. Same CSV + `.npy` output as local script

### Key design decisions
- **Batched log-likelihood**: sequences within a batch are padded to the same
  length. Padding tokens are excluded from the per-sequence LL average by
  slicing `logits[i, 0:seq_len-1]` per sample.
- **bfloat16 preferred over float16**: on H100/A100, bfloat16 has better
  numerical stability for language model inference.
- **Auto model selection**: avoids manual changes when moving between GPU types.
  Override with `--model evo2_7b` or `--model evo2_40b` if needed.

### CLI reference

```
python scripts/classify_fasta_cluster.py \
    --fasta           /scratch/$USER/seqs.fasta
    --output          /scratch/$USER/results/output.csv
    --model           evo2_7b         # omit to auto-detect from VRAM
    --device          cuda:0
    --multi-gpu                        # shard across all visible GPUs
    --batch-size      8
    --threshold       -2.5
    --max-length      8192
    --save-embeddings
    --embed-layer     blocks.28.mlp.l3
```

### Batch log-likelihood (key difference from local script)

```python
def compute_log_likelihood_batch(model, tokenizer, sequences, device, max_length=8192):
    # Tokenise and pad all sequences to same length
    token_lists = [tokenizer.tokenize(s.upper()[:max_length]) for s in sequences]
    pad_id = getattr(tokenizer, "pad_token_id", 0) or 0
    max_len = max(len(t) for t in token_lists)
    padded  = [t + [pad_id] * (max_len - len(t)) for t in token_lists]
    lengths = [len(t) for t in token_lists]

    input_ids = torch.tensor(padded, dtype=torch.long).to(device)   # (B, L)
    with torch.no_grad():
        logits, _ = model(input_ids, return_embeddings=False)

    results = []
    for i, seq_len in enumerate(lengths):
        # Only score real tokens, ignore padding
        sl = slice(0, seq_len - 1)
        shift_logits = logits[i, sl, :].float()
        shift_labels = input_ids[i, 1:seq_len]
        log_probs = torch.nn.functional.log_softmax(shift_logits, dim=-1)
        token_ll = log_probs[torch.arange(len(shift_labels)), shift_labels]
        results.append(float(token_ll.mean().cpu()))
    return results
```

---

## 6. Script: libra_submit.sh (Slurm)

**Full path:** `scripts/libra_submit.sh`

### Resource requests

| Directive | Value | When to change |
|---|---|---|
| `--partition gpu` | GPU partition | Check Libra's partition names: `sinfo` |
| `--gres gpu:1` | 1 GPU | Change to `gpu:h100:1` for H100 → 40b model |
| `--mem 64G` | Host RAM | Increase to 128G for 40b model |
| `--time 04:00:00` | 4 hours | Increase for > 50k sequences |
| `--cpus-per-task 8` | CPU cores | For tokenisation + I/O workers |

### Before submitting

1. Edit `YOUR_EMAIL@slu.edu` → your SLU email
2. Edit `PROJECT_DIR` → absolute path to your baio checkout on Libra
3. Edit `FASTA_IN` → absolute path to your input FASTA on scratch
4. Edit `CONDA_ENV` → your conda environment name
5. Check that `logs/` directory exists: `mkdir -p logs`

### Submitting

```bash
# From the baio project root on Libra:
sbatch scripts/libra_submit.sh

# Monitor
squeue -u $USER
tail -f logs/baio_classify_<JOBID>.out

# Cancel if needed
scancel <JOBID>
```

### Full Slurm script

```bash
#!/bin/bash
#SBATCH --job-name=baio_classify
#SBATCH --partition=gpu
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=8
#SBATCH --mem=64G
#SBATCH --gres=gpu:1
#SBATCH --time=04:00:00
#SBATCH --output=logs/%x_%j.out
#SBATCH --error=logs/%x_%j.err
#SBATCH --mail-type=END,FAIL
#SBATCH --mail-user=YOUR_EMAIL@slu.edu

set -euo pipefail

PROJECT_DIR="$HOME/baio"
FASTA_IN="/scratch/$USER/data/sequences.fasta"
RESULTS_DIR="/scratch/$USER/results"
CONDA_ENV="baio"

module purge
module load cuda/12.2
module load python/3.12

source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate "$CONDA_ENV"

nvidia-smi --query-gpu=name,memory.total --format=csv,noheader

mkdir -p "$RESULTS_DIR" logs

python "$PROJECT_DIR/scripts/classify_fasta_cluster.py" \
    --fasta        "$FASTA_IN" \
    --output       "$RESULTS_DIR/classified_$(date +%Y%m%d_%H%M%S).csv" \
    --batch-size   8 \
    --threshold    -2.5 \
    --max-length   8192 \
    --save-embeddings
```

---

## 7. How to Run

### Install dependencies (once)

```bash
# Both environments
pip install evo2 biopython numpy pandas torch

# Cluster only (optional, for speed)
pip install accelerate
pip install flash-attn --no-build-isolation   # Ampere/Hopper only
```

### Local M1 Mac — quick test

```bash
cd /path/to/baio
python scripts/classify_fasta_local.py \
    --fasta data/covid_reads5.fasta \
    --output results/test_local.csv \
    --threshold -2.5 \
    --save-embeddings
```

### Libra cluster — interactive test first

```bash
# 1. Get an interactive GPU node
srun --partition=gpu --gres=gpu:1 --mem=32G --time=01:00:00 --pty bash

# 2. Activate environment and run
conda activate baio
python ~/baio/scripts/classify_fasta_cluster.py \
    --fasta ~/baio/data/covid_reads5.fasta \
    --output /scratch/$USER/test_output.csv \
    --batch-size 4 \
    --threshold -2.5

# 3. Once confirmed working, submit as a batch job
exit
sbatch ~/baio/scripts/libra_submit.sh
```

---

## 8. Output Format

### results/output.csv

| Column | Type | Description |
|---|---|---|
| `seq_id` | string | FASTA record ID (e.g., `>NC_045512.2` → `NC_045512.2`) |
| `length` | int | Sequence length in base pairs |
| `log_likelihood` | float | Mean per-token log P(x_t \| x_<t) |
| `label` | string | `"Classified"` or `"Unclassified"` |
| `elapsed_s` | float | Processing time in seconds (local script only) |

### results/output.embeddings.npy

- Shape: `(N, hidden_dim)` where N = number of sequences with valid embeddings
- dtype: float32
- Companion file `output.embeddings_ids.npy` contains the corresponding seq_ids

### Loading in Python

```python
import numpy as np
import pandas as pd

df = pd.read_csv("results/output.csv")
embeddings = np.load("results/output.embeddings.npy")
ids = np.load("results/output.embeddings_ids.npy", allow_pickle=True)

# Quick summary
print(df["label"].value_counts())
print(f"Embedding matrix: {embeddings.shape}")
```

---

## 9. Threshold Calibration

The default threshold of `-2.5` is a reasonable starting point but **must be calibrated** on your specific dataset.

### Method 1: Labeled validation set

```python
import pandas as pd
import numpy as np
from sklearn.metrics import roc_curve, roc_auc_score

# Assume you have ground truth labels for a validation FASTA
# Run the pipeline on it, then:
df = pd.read_csv("results/validation_output.csv")
df["true_label"] = ...   # your ground truth: 1=Classified, 0=Unclassified

fpr, tpr, thresholds = roc_curve(df["true_label"], df["log_likelihood"])
# Pick threshold at max Youden index (TPR - FPR)
best_idx = np.argmax(tpr - fpr)
best_threshold = thresholds[best_idx]
print(f"Recommended threshold: {best_threshold:.4f}")
```

### Method 2: Distribution inspection

```python
import matplotlib.pyplot as plt

df = pd.read_csv("results/output.csv")
df["log_likelihood"].hist(bins=50)
plt.axvline(-2.5, color="red", linestyle="--", label="default threshold")
plt.xlabel("Log-likelihood")
plt.title("Distribution of per-sequence log-likelihoods")
plt.legend()
plt.savefig("results/ll_distribution.png")
```

---

## 10. Extension Points

### A. Add host/virus classification on top of LL scoring

Use the existing `binary_classifiers/predict_class.py` after the LL filter:

```python
from binary_classifiers.predict_class import PredictClass
predictor = PredictClass(model_name="RandomForest")

for row in classified_sequences:
    label = predictor.predict(row["sequence"])  # "Host" or "Virus"
    row["organism_label"] = label
```

### B. UMAP + HDBSCAN clustering of unclassified sequences

```python
import numpy as np
import umap
import hdbscan

embeddings = np.load("results/output.embeddings.npy")
ids = np.load("results/output.embeddings_ids.npy", allow_pickle=True)

reducer = umap.UMAP(n_components=2, random_state=42)
reduced = reducer.fit_transform(embeddings)

clusterer = hdbscan.HDBSCAN(min_cluster_size=5)
cluster_labels = clusterer.fit_predict(reduced)

# Plot
import matplotlib.pyplot as plt
plt.scatter(reduced[:, 0], reduced[:, 1], c=cluster_labels, cmap="tab20", s=5)
plt.savefig("results/umap_clusters.png")
```

### C. Integrate into the FastAPI backend

Add a new endpoint in `backend/app/routers/classify.py`:

```python
@router.post("/classifications/batch-fasta")
async def classify_fasta_file(file: UploadFile, threshold: float = -2.5):
    # Save upload, run classify_fasta_cluster, return CSV
    ...
```

### D. Change the intermediate layer

For a shallower representation (more syntactic, less semantic):

```bash
--embed-layer blocks.14.mlp.l3
```

For a deeper representation:

```bash
--embed-layer blocks.35.mlp.l3
```

To list all available layer names:

```python
from evo2 import Evo2
model = Evo2("evo2_7b")
for name, module in model.model.named_modules():
    print(name)
```

### E. Sliding window for very long sequences

If sequences exceed 8192 bp:

```python
def sliding_window_ll(model, tokenizer, sequence, device,
                      window=8192, stride=4096):
    scores = []
    for start in range(0, len(sequence), stride):
        chunk = sequence[start : start + window]
        if len(chunk) < 64:
            break
        scores.append(compute_log_likelihood(model, tokenizer, chunk, device))
    return sum(scores) / len(scores) if scores else float("nan")
```

---

## 11. Existing Codebase Integration Map

```
binary_classifiers/evo2_embedder.py
    └── Uses HuggingFace transformers + CUDA only
    └── DO NOT use for M1 — use classify_fasta_local.py instead
    └── Can be used for Host/Virus classification (separate task from LL scoring)

metaseq/dataio.py :: load_fasta()
    └── Alternative to Biopython for FASTA loading
    └── Returns List[Tuple[str, str]] — same format as SeqIO.parse()

backend/app/services/classification.py :: classify_sequence()
    └── Calls PredictClass internally
    └── Add a new service function here if integrating LL scoring into the API

binary_classifiers/predict_class.py :: PredictClass
    └── Host/Virus classifier (not Classified/Unclassified)
    └── Use AFTER LL screening to sub-classify the "Classified" bucket
```

---

## 12. Prompt for Claude to Extend This Work

Copy and paste the following prompt into a new Claude conversation to continue
development without losing context:

---

```
Project: Baio — DNA Classification Pipeline (SLU OSS)
GitHub branch: feat/database

CONTEXT
=======
I have a FastAPI + React bioinformatics platform that classifies DNA sequences
from FASTA files. I've built a pipeline using the Arc Institute's Evo 2
foundation model (evo2_7b / evo2_40b).

Key files already written:
- scripts/classify_fasta_local.py   — M1 Mac version using Apple Silicon MPS
- scripts/classify_fasta_cluster.py — CUDA version for Libra HPC cluster
- scripts/libra_submit.sh           — Slurm submission script
- binary_classifiers/evo2_embedder.py — existing HuggingFace/CUDA Evo2 embedder
- binary_classifiers/predict_class.py — Host/Virus classifier (RF, SVM, Evo2)
- metaseq/dataio.py                 — FASTA/FASTQ loaders
- backend/app/routers/classify.py   — FastAPI classification endpoints

CLASSIFICATION LOGIC
====================
- Compute mean per-token log-likelihood: LL = mean log P(x_t | x_<t)
- LL >= threshold (-2.5 default) → "Classified" (known biological grammar)
- LL <  threshold               → "Unclassified" (dark matter / noise)
- Intermediate layer embeddings extracted from blocks.28.mlp.l3 via forward hook
- Saved as (N, hidden_dim) .npy for UMAP / HDBSCAN downstream

DEVICE STRATEGY
===============
- M1 Mac: device="mps", dtype=float32, batch_size=1, model=evo2_7b
- Libra:  device="cuda", dtype=bfloat16, batch_size=8, auto model (7b or 40b)
- No flash-attn / transformer-engine on M1

OUTPUT
======
CSV columns: seq_id, length, log_likelihood, label, elapsed_s
Embeddings:  results/output.embeddings.npy  shape=(N, hidden_dim)

TASK FOR CLAUDE
===============
[Describe what you want to do next, e.g.:]
- Add UMAP + HDBSCAN clustering of the Unclassified sequences
- Integrate the LL scoring into the FastAPI backend endpoint
- Add sliding window support for sequences > 8192 bp
- Build a calibration script to find the optimal threshold on a labeled set
- Visualise the log-likelihood distribution and output a threshold recommendation
```

---

*End of document.*
