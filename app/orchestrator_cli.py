"""Command-line orchestrator for BAIO DNA classification pipeline.

This module wires together:
  * Sequence parsing and validation
  * Evo2 embedding generation
  * Existing binary classifiers (RandomForest / SVM)
and produces structured JSON summaries for downstream use.

The CLI is intended for lightweight experimentation outside the Streamlit UI.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterable, List, Optional, Sequence, Tuple, TypedDict

try:  # pragma: no cover - dependency check
    import numpy as np  # type: ignore[import]
except ImportError as exc:  # pragma: no cover
    raise ImportError(
        "NumPy is required for the CLI orchestrator. Please install numpy before running."
    ) from exc

from data_processing import parsers as dp_parsers
from data_processing import validators as dp_validators

from metaseq.evo2_embed import Evo2EmbeddingGenerator, Evo2EmbeddingConfig

from binary_classifiers.predict_class import PredictClass


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------


@dataclass
class SequenceRecord:
    """Container for a single sequence passed through the pipeline."""

    sequence_id: str
    sequence: str


class PredictionDict(TypedDict):
    sequence_id: str
    label: str
    confidence: float
    metadata: dict


class OrchestratorResult(TypedDict):
    predictions: List[PredictionDict]
    summary: dict
    embeddings_path: Optional[str]


# ---------------------------------------------------------------------------
# Helper factories
# ---------------------------------------------------------------------------


def _load_sequences_from_file(path: Path) -> List[SequenceRecord]:
    if not path.exists():
        raise FileNotFoundError(f"Input file does not exist: {path}")

    text = path.read_text()
    suffix = path.suffix.lower()
    if suffix in {".fastq", ".fq"}:
        tuples = dp_parsers.parse_fastq_content(text)
    else:
        tuples = dp_parsers.parse_fasta_text(text)

    sequences: List[Tuple[str, str]] = tuples
    if not sequences:
        raise ValueError(f"No sequences parsed from file: {path}")

    return [SequenceRecord(seq_id, seq) for seq_id, seq in sequences]


def _validate_sequences(records: Sequence[SequenceRecord]) -> None:
    if not records:
        raise ValueError("No sequences provided.")

    seen_ids = set()
    for record in records:
        if record.sequence_id in seen_ids:
            raise ValueError(f"Duplicate sequence id detected: {record.sequence_id}")
        seen_ids.add(record.sequence_id)

        ok, error = dp_validators.validate_sequence(record.sequence)
        if not ok:
            raise ValueError(f"Sequence '{record.sequence_id}' invalid: {error or 'unknown error'}")


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------


DEFAULT_LABEL_MAP = {
    "0": "Virus",
    "1": "Bacteria",
    "virus": "Virus",
    "bacteria": "Bacteria",
    "host": "Bacteria",  # Treat host as bacteria for backwards compatibility
}


class BinaryClassifierExecutor:
    """Thin wrapper around the legacy binary classifiers with label mapping."""

    def __init__(
        self,
        model_name: str,
        label_map: Optional[dict[str, str]] = None,
    ) -> None:
        self.predictor = PredictClass(model_name=model_name)
        self.model_name = model_name
        self.label_map = {k: v for k, v in (label_map or DEFAULT_LABEL_MAP).items()}

    def _map_label(self, raw_label: str) -> Tuple[str, dict]:
        label_key = raw_label.strip()
        mapped = self.label_map.get(label_key)
        if mapped is None:
            mapped = self.label_map.get(label_key.lower(), "Novel")
        metadata = {"raw_label": raw_label}
        return mapped, metadata

    def predict_sequences(self, sequences: Iterable[SequenceRecord]) -> List[PredictionDict]:
        seq_strings = [record.sequence for record in sequences]
        labels = self.predictor.batch_predict(seq_strings)

        predictions: List[PredictionDict] = []
        for record, label in zip(sequences, labels, strict=True):
            mapped_label, metadata = self._map_label(label)
            predictions.append(
                {
                    "sequence_id": record.sequence_id,
                    "label": mapped_label,
                    "confidence": -1.0,
                    "metadata": metadata,
                }
            )
        return predictions

    def predict_with_embeddings(
        self,
        sequences: Iterable[SequenceRecord],
        embeddings: Optional[np.ndarray] = None,
    ) -> List[PredictionDict]:
        return self.predict_sequences(sequences)


class CliOrchestrator:
    """Coordinate parsing, embedding, and binary classification."""

    def __init__(
        self,
        embedder: Optional[Evo2EmbeddingGenerator] = None,
        classifier_factory: Callable[[str], BinaryClassifierExecutor] = lambda name: BinaryClassifierExecutor(
            name
        ),
    ) -> None:
        self.embedder = embedder or Evo2EmbeddingGenerator(Evo2EmbeddingConfig())
        self.classifier_factory = classifier_factory

    def run(
        self,
        sequences: List[SequenceRecord],
        *,
        model_name: str = "RandomForest",
        save_embeddings: Optional[Path] = None,
    ) -> OrchestratorResult:
        """Execute the pipeline for the provided sequences."""
        _validate_sequences(sequences)

        sequence_strings = [record.sequence for record in sequences]
        vectors = self.embedder.generate_batch(sequence_strings)

        embeddings_path = None
        if save_embeddings:
            save_embeddings.parent.mkdir(parents=True, exist_ok=True)
            npy_path = save_embeddings.with_suffix(".npy")
            np.save(npy_path, vectors)
            embeddings_path = str(npy_path)

        executor = self.classifier_factory(model_name)
        predictions = executor.predict_with_embeddings(sequences, vectors)

        summary = _summarise_predictions(predictions, embedding_shape=list(vectors.shape))

        return {
            "predictions": predictions,
            "summary": summary,
            "embeddings_path": embeddings_path,
        }


def _summarise_predictions(
    predictions: Sequence[PredictionDict],
    embedding_shape: Optional[List[int]] = None,
) -> dict:
    counts: dict[str, int] = {}
    for pred in predictions:
        counts[pred["label"]] = counts.get(pred["label"], 0) + 1

    total = sum(counts.values())
    summary = {
        "total_sequences": total,
        "class_counts": counts,
    }

    if embedding_shape is not None:
        summary["embedding_shape"] = embedding_shape

    return summary


# ---------------------------------------------------------------------------
# CLI entrypoint
# ---------------------------------------------------------------------------


def parse_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="BAIO CLI orchestrator (Evo2 embeddings + binary classifier)",
    )
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument(
        "--sequence",
        type=str,
        help="Single DNA sequence to analyse.",
    )
    input_group.add_argument(
        "--fasta",
        type=Path,
        help="Path to FASTA file containing sequences.",
    )

    parser.add_argument(
        "--model",
        choices=["RandomForest", "SVM"],
        default="RandomForest",
        help="Binary classifier to use.",
    )
    parser.add_argument(
        "--save-embeddings",
        type=Path,
        help="Optional path prefix to save embeddings (.npy appended automatically).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Optional path to write JSON results.",
    )

    return parser.parse_args(argv)


def _sequence_records_from_args(args: argparse.Namespace) -> List[SequenceRecord]:
    if args.sequence:
        sequence = "".join(args.sequence.split()).upper()
        return [SequenceRecord("sequence_1", sequence)]
    assert args.fasta is not None
    return _load_sequences_from_file(args.fasta)


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = parse_args(argv)
    records = _sequence_records_from_args(args)

    orchestrator = CliOrchestrator()
    result = orchestrator.run(
        records,
        model_name=args.model,
        save_embeddings=args.save_embeddings,
    )

    json_payload = json.dumps(result, indent=2)

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json_payload)
        print(f"[BAIO CLI] Results written to {args.output}")
        _print_summary(result)
    else:
        print(json_payload)

    return 0


def _print_summary(result: OrchestratorResult) -> None:
    summary = result.get("summary", {})
    total = summary.get("total_sequences", 0)
    counts = summary.get("class_counts", {})

    print(f"[BAIO CLI] Processed {total} sequences.")
    for label, count in counts.items():
        print(f"  - {label}: {count}")


if __name__ == "__main__":
    sys.exit(main())

