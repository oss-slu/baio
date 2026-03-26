# Transformer-Based DNA Sequence Classification Guide

**Project:** BAIO — Bioinformatics AI for Open-set detection
**Institution:** Saint Louis University
**Scope:** Fine-tuning a pretrained genomic transformer model for virus/host classification

---

## 1. Background

BAIO currently classifies DNA sequences using a pipeline of:

```
DNA Sequence → K-mer (6-mer) Tokenization → TF-IDF / CountVectorizer → RandomForest / SVM
```

### Current Model Performance

| Metric | Value |
|---|---|
| Cross-Validation Accuracy | 0.9575 |
| Test Accuracy | 0.71 |
| ROC AUC | 0.9012 |

The significant gap between CV accuracy (0.96) and test accuracy (0.71) indicates overfitting, and the confusion matrix reveals poor recall on the virus class — 112 virus sequences are misclassified as host. A transformer model pretrained on genomic data is expected to substantially close this gap.

---

## 2. Training Data

The existing labeled dataset used for training:

| File | Label | Class |
|---|---|---|
| `data/covid_reads5.fasta` | 1 | Virus |
| `data/human_reads5.fasta` | 0 | Host |

No new data collection is required. The transformer training script loads these files directly using the existing `metaseq.dataio.load_fasta` utility.

---

## 3. Recommended Model: DNABERT-2

**DNABERT-2** (`zhihan1996/DNABERT-2-117M`) is a BERT-style transformer pretrained on multi-species genomic DNA. It is the recommended starting point for BAIO because:

- ~117M parameters — smallest practical genomic transformer
- Pretrained on diverse DNA from bacteria, viruses, and eukaryotes
- Accepts raw DNA sequences — no k-mer preprocessing step needed
- Can run on CPU (slow) or GPU (recommended)
- Available via Hugging Face `transformers`

### Alternative Models

| Model | Parameters | Notes |
|---|---|---|
| DNABERT-2 | 117M | Best starting point, CPU-feasible |
| Nucleotide Transformer (InstaDeep) | 500M | Higher accuracy, GPU required |
| Hyena-DNA | 1.6M–6.5M | Optimized for long sequences |
| Evo2-40B (NVIDIA) | 40B | API-only, already integrated in BAIO |

---

## 4. Dependencies

Install the following additional packages:

```bash
pip install transformers datasets torch accelerate
```

Or add to `requirements.txt`:

```
transformers>=4.40.0
datasets>=2.19.0
torch>=2.1.0
accelerate>=0.29.0
```

---

## 5. Training Script

Create `train_transformer.py` at the project root:

```python
#!/usr/bin/env python3
"""
Fine-tune DNABERT-2 for virus/host binary classification.

Usage:
    python train_transformer.py
    python train_transformer.py --epochs 10 --batch-size 8 --output weights/dnabert2_finetuned
"""

import argparse
import torch
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    Trainer,
    TrainingArguments,
)
from metaseq.dataio import load_fasta

MODEL_CHECKPOINT = "zhihan1996/DNABERT-2-117M"
LABEL_MAP = {0: "Host", 1: "Virus"}


def load_training_data(data_dir: str = "data"):
    """Load virus and host sequences from FASTA files."""
    virus_seqs = [seq for _, seq in load_fasta(f"{data_dir}/covid_reads5.fasta")]
    host_seqs  = [seq for _, seq in load_fasta(f"{data_dir}/human_reads5.fasta")]

    sequences = virus_seqs + host_seqs
    labels    = [1] * len(virus_seqs) + [0] * len(host_seqs)

    print(f"Virus sequences : {len(virus_seqs)}")
    print(f"Host sequences  : {len(host_seqs)}")
    print(f"Total           : {len(sequences)}")
    return sequences, labels


def tokenize_dataset(sequences, labels, tokenizer, max_length=512):
    """Tokenize sequences and return a train/test split Dataset."""
    ds = Dataset.from_dict({"sequence": sequences, "label": labels})
    ds = ds.train_test_split(test_size=0.2, seed=42)

    def tokenize(batch):
        return tokenizer(
            batch["sequence"],
            truncation=True,
            padding="max_length",
            max_length=max_length,
        )

    ds = ds.map(tokenize, batched=True, remove_columns=["sequence"])
    return ds


def compute_metrics(eval_pred):
    """Compute accuracy, precision, recall, F1 for evaluation."""
    from sklearn.metrics import accuracy_score, precision_recall_fscore_support
    import numpy as np

    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)
    acc = accuracy_score(labels, predictions)
    precision, recall, f1, _ = precision_recall_fscore_support(
        labels, predictions, average="binary"
    )
    return {"accuracy": acc, "precision": precision, "recall": recall, "f1": f1}


def main():
    parser = argparse.ArgumentParser(description="Fine-tune DNABERT-2 for BAIO classification")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--max-length", type=int, default=512)
    parser.add_argument("--output", type=str, default="weights/dnabert2_finetuned")
    parser.add_argument("--data-dir", type=str, default="data")
    args = parser.parse_args()

    # 1. Load data
    print("\nLoading training data...")
    sequences, labels = load_training_data(args.data_dir)

    # 2. Tokenize
    print("\nTokenizing sequences...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_CHECKPOINT, trust_remote_code=True)
    ds = tokenize_dataset(sequences, labels, tokenizer, args.max_length)

    # 3. Load model
    print(f"\nLoading {MODEL_CHECKPOINT}...")
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_CHECKPOINT,
        num_labels=2,
        trust_remote_code=True,
    )

    # 4. Training configuration
    training_args = TrainingArguments(
        output_dir=args.output,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size * 2,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        greater_is_better=True,
        logging_dir=f"{args.output}/logs",
        logging_steps=10,
        fp16=torch.cuda.is_available(),
        report_to="none",
    )

    # 5. Train
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=ds["train"],
        eval_dataset=ds["test"],
        compute_metrics=compute_metrics,
    )

    print("\nStarting training...")
    trainer.train()

    # 6. Save
    print(f"\nSaving model to {args.output}...")
    model.save_pretrained(args.output)
    tokenizer.save_pretrained(args.output)
    print("Done.")


if __name__ == "__main__":
    main()
```

---

## 6. Inference Integration

Add `metaseq/transformer_inference.py` to integrate the fine-tuned model with the existing API:

```python
"""
Transformer-based inference for BAIO DNA classification.
Drop-in alongside ClassifierInference from metaseq/inference.py.
"""

from __future__ import annotations
from typing import List
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification


class TransformerInference:
    def __init__(self, model_path: str, max_length: int = 512) -> None:
        self.tokenizer = AutoTokenizer.from_pretrained(model_path, trust_remote_code=True)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_path)
        self.model.eval()
        self.max_length = max_length
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(self.device)

    def predict_proba(self, sequences: List[str]) -> List[List[float]]:
        inputs = self.tokenizer(
            sequences,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=self.max_length,
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        with torch.no_grad():
            logits = self.model(**inputs).logits
        return torch.softmax(logits, dim=-1).cpu().tolist()

    def predict(self, sequences: List[str]) -> List[int]:
        proba = self.predict_proba(sequences)
        return [int(p[1] > 0.5) for p in proba]
```

---

## 7. Running Training

### Basic run (defaults: 5 epochs, batch size 16)
```bash
python train_transformer.py
```

### Custom configuration
```bash
python train_transformer.py \
  --epochs 10 \
  --batch-size 8 \
  --max-length 256 \
  --output weights/dnabert2_finetuned
```

### On GPU (recommended)
Training on CPU is possible but slow (~1–2 hours per epoch). On a single GPU (e.g., RTX 3080), 5 epochs typically completes in 30–60 minutes.

---

## 8. Expected Performance

| Model | Test Accuracy | Virus Recall | Notes |
|---|---|---|---|
| RandomForest (current) | 0.71 | ~0.44 | Overfitting, poor viral recall |
| DNABERT-2 fine-tuned | ~0.88–0.95 | ~0.85–0.92 | Expected improvement |
| Nucleotide Transformer | ~0.90–0.96 | ~0.90–0.95 | Larger model, higher accuracy |

---

## 9. Model Output Location

After training, the fine-tuned model is saved to:

```
weights/dnabert2_finetuned/
├── config.json
├── model.safetensors
├── tokenizer_config.json
├── tokenizer.json
└── special_tokens_map.json
```

Load it for inference:

```python
from metaseq.transformer_inference import TransformerInference

clf = TransformerInference("weights/dnabert2_finetuned")
predictions = clf.predict(["CAAGTGCTTTTGTGGAAACTGTGAAAG...", "CCAAACTTCGGGCGGCGGCTGAGG..."])
# [1, 0]  →  [Virus, Host]
```

---

## 10. References

- [DNABERT-2 Paper](https://arxiv.org/abs/2306.15006) — Zhou et al., 2023
- [Nucleotide Transformer](https://www.biorxiv.org/content/10.1101/2023.01.11.523679) — Dalla-Torre et al., 2023
- [Hugging Face Transformers](https://huggingface.co/docs/transformers)
- [Evo2 (NVIDIA)](https://health.api.nvidia.com) — already integrated in `metaseq/evo2_client.py`
