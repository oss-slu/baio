from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Literal, Protocol, Sequence

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

from metaseq.dataio import load_sequences

from .predict_class import LABEL_MAP

LABEL_TO_INT = {label: class_id for class_id, label in LABEL_MAP.items()}


@dataclass(frozen=True)
class LabeledSequence:
    sequence_id: str
    sequence: str
    label: int


class EvaluationPredictor(Protocol):
    def batch_predict(self, sequences: List[str]) -> List[Literal["Virus", "Host"]]: ...

    def batch_predict_probabilities(
        self, sequences: List[str]
    ) -> List[Dict[Literal["Host", "Virus"], float]]: ...


def load_labeled_sequences(virus_file: str, host_file: str) -> List[LabeledSequence]:
    labeled_sequences: List[LabeledSequence] = []

    for sequence_id, sequence in load_sequences(host_file):
        labeled_sequences.append(
            LabeledSequence(sequence_id=sequence_id, sequence=sequence, label=0)
        )

    for sequence_id, sequence in load_sequences(virus_file):
        labeled_sequences.append(
            LabeledSequence(sequence_id=sequence_id, sequence=sequence, label=1)
        )

    return labeled_sequences


def evaluate_predictor(
    predictor: EvaluationPredictor,
    labeled_sequences: Sequence[LabeledSequence],
) -> Dict[str, Any]:
    if not labeled_sequences:
        raise ValueError("At least one labeled sequence is required for evaluation")

    sequences = [item.sequence for item in labeled_sequences]
    true_labels = [item.label for item in labeled_sequences]
    predicted_labels = predictor.batch_predict(sequences)
    predicted_label_ids = [LABEL_TO_INT[label] for label in predicted_labels]
    probability_maps = predictor.batch_predict_probabilities(sequences)
    virus_probabilities = [probabilities["Virus"] for probabilities in probability_maps]
    confidences = [max(probabilities.values()) for probabilities in probability_maps]

    metrics: Dict[str, Any] = {
        "total_sequences": len(labeled_sequences),
        "host_sequences": sum(1 for label in true_labels if label == 0),
        "virus_sequences": sum(1 for label in true_labels if label == 1),
        "accuracy": round(float(accuracy_score(true_labels, predicted_label_ids)), 4),
        "precision": round(
            float(precision_score(true_labels, predicted_label_ids, zero_division=0)), 4
        ),
        "recall": round(
            float(recall_score(true_labels, predicted_label_ids, zero_division=0)), 4
        ),
        "f1": round(
            float(f1_score(true_labels, predicted_label_ids, zero_division=0)), 4
        ),
        "average_confidence": round(sum(confidences) / len(confidences), 4),
        "confusion_matrix": confusion_matrix(
            true_labels, predicted_label_ids, labels=[0, 1]
        ).tolist(),
        "classification_report": classification_report(
            true_labels,
            predicted_label_ids,
            labels=[0, 1],
            target_names=["Host", "Virus"],
            output_dict=True,
            zero_division=0,
        ),
        "errors": [
            {
                "sequence_id": item.sequence_id,
                "expected": LABEL_MAP[item.label],
                "predicted": predicted_label,
                "confidence": round(confidence, 4),
                "virus_probability": round(virus_probability, 4),
                "length": len(item.sequence),
            }
            for item, predicted_label, confidence, virus_probability in zip(
                labeled_sequences,
                predicted_labels,
                confidences,
                virus_probabilities,
            )
            if predicted_label != LABEL_MAP[item.label]
        ],
    }

    if len(set(true_labels)) > 1:
        metrics["roc_auc"] = round(
            float(roc_auc_score(true_labels, virus_probabilities)), 4
        )
    else:
        metrics["roc_auc"] = None

    return metrics
