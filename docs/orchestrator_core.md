# Orchestrator Core Component (CLI Prototype)

This document summarizes the initial CLI-based orchestrator that wires EVO2
embeddings with the legacy binary classifiers. The Streamlit GUI still runs on
mock logic; the CLI serves as the first concrete implementation of the agentic
pipeline.

---

## Objectives

1. **Normalize input** (single sequence or FASTA) with reusable parsers.
2. **Generate Evo2 embeddings** with graceful fallbacks (local model, remote API,
   or deterministic mock).
3. **Invoke existing classifiers** (RandomForest / SVM) via a thin executor.
4. **Aggregate results** into JSON and optional `.npy` embedding dumps.
5. **Expose a CLI** for quick experimentation while the GUI evolves.

---

## Module Overview

| File | Purpose |
| --- | --- |
| `metaseq/evo2_embed.py` | Embedding generator with local/remote/mock backends |
| `app/orchestrator_cli.py` | CLI orchestrator pipeline |
| `binary_classifiers/predict_class.py` | Legacy RandomForest/SVM wrapper (import path fixed) |
| `tests/test_cli_orchestrator.py` | Smoke tests for orchestrator logic |

### Evo2 Embedding Generator (`metaseq/evo2_embed.py`)

- Reads configuration from environment variables (model, device, pooling, retries).
- Supports three backends:
  1. **Local Hugging Face model** (`EVO2_MODEL_NAME`).
  2. **Remote API** via `Evo2Client` (enable with `EVO2_USE_REMOTE=1`).
  3. **Deterministic mock mode** (automatic if dependencies are missing or `EVO2_EMBED_MOCK=1`).
- Provides single and batched embedding generation (`generate_embedding`, `generate_batch`).
- Validates sequences (A/C/G/T/N only, length <= `EVO2_MAX_LENGTH`).

### CLI Orchestrator (`app/orchestrator_cli.py`)

1. **Parsing & Validation**
   - Accepts `--sequence` (single string) or `--fasta` (file path).
   - Uses `data_processing.pars ers` to support FASTA/FASTQ text content.
   - Performs duplicate ID detection and per-sequence validation (length, alphabet).
2. **Embeddings**
   - Invokes the embedding generator for every sequence.
   - Optionally persists embeddings as `.npy` when `--save-embeddings` is provided.
3. **Classification**
   - Wraps `PredictClass` via `BinaryClassifierExecutor`.
   - Maintains compatibility with k-mer feature pipeline.
   - Maps raw model outputs (`0`/`1`, `host`, etc.) to **Virus / Bacteria / Novel**.
   - Stub method `predict_with_embeddings` retains API surface for future embedding-only models.
4. **Reporting**
   - Collects predictions, counts labels, and attaches embedding shape metadata.
   - Returns structured dictionary for serialization.
   - Prints human-readable summary and/or writes JSON to disk.

### Tests (`tests/test_cli_orchestrator.py`)

- `test_cli_orchestrator_run`: verifies orchestration with mock embedder/executor and `.npy` persistence.
- `test_parse_args_sequence`: ensures argument parsing works for single-sequence mode.
- `test_cli_main_writes_output`: runs full CLI path via `main` with mocked dependencies and output to JSON.

---

## CLI Usage Examples

```bash
# Single sequence with default RandomForest classifier
python -m app.orchestrator_cli --sequence ATGCGTACCGTA

# FASTA input, persist embeddings, export JSON, choose classifier
python -m app.orchestrator_cli \
  --fasta examples/sample.fasta \
  --model SVM \
  --save-embeddings runs/embeddings/sample_run \
  --output runs/reports/sample_run.json
```

### CLI Flags

| Flag | Description |
| --- | --- |
| `--sequence` | Inline DNA sequence (mutually exclusive with `--fasta`) |
| `--fasta` | Path to FASTA/FASTQ file |
| `--model {RandomForest,SVM}` | Select binary classifier (default RandomForest) |
| `--save-embeddings PATH` | Persist embeddings to `PATH.npy` |
| `--output PATH` | Write JSON report to the target path |

---

## Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `EVO2_MODEL_NAME` | `None` | Hugging Face model ID for local embeddings |
| `EVO2_POOLING` | `mean` | Pooling strategy (`mean` or `cls`) |
| `EVO2_MAX_LENGTH` | `4096` | Max sequence length accepted |
| `EVO2_MAX_RETRIES` | `3` | Max retries for remote API |
| `EVO2_BACKOFF_SECONDS` | `2.0` | Retry backoff |
| `EVO2_USE_REMOTE` | `0` | Use remote Evo2 API (`1` enables) |
| `EVO2_EMBED_MOCK` | `0` | Force mock embeddings (`1` enables) |
| `NVCF_RUN_KEY` | `None` | API key for remote Evo2 endpoint |

---

## Current Limitations

- **Classifier remains k-mer based.** Embeddings are recorded but not yet used for inference.
- **Mock mode default.** Without a valid model or API key, embeddings fall back to deterministic hashes.
- **GUI unmodified.** Streamlit app still uses the original mock pipeline; CLI is standalone.
- **NumPy requirement.** CLI depends on NumPy 2.x; environment must satisfy this.

---

## Next Steps

1. **Integrate CLI orchestrator with Streamlit pipeline** while preserving existing UX.
2. **Train embedding-based classifier heads** and update `BinaryClassifierExecutor`.
3. **Add OOD scoring and clustering agents** to the CLI path.
4. **Persist structured run artifacts** (summary databases, vector stores) for RAG.
5. **Harmonize validation logic** between `app/data` and `data_processing` modules.

---

## Change Log

| PR/Commit | Highlights |
| --- | --- |
| _current_ | Added `metaseq/evo2_embed.py`, CLI orchestrator, tests, and CLI documentation. |

