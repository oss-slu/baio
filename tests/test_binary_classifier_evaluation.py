from __future__ import annotations

from binary_classifiers.evaluation import (
    LabeledSequence,
    evaluate_predictor,
    load_labeled_sequences,
)
from binary_classifiers.predict_class import PredictClass


class _StubPredictor:
    def batch_predict(self, sequences: list[str]) -> list[str]:
        assert len(sequences) == 4
        return ["Host", "Virus", "Host", "Host"]

    def batch_predict_probabilities(
        self, sequences: list[str]
    ) -> list[dict[str, float]]:
        assert len(sequences) == 4
        return [
            {"Host": 0.9, "Virus": 0.1},
            {"Host": 0.2, "Virus": 0.8},
            {"Host": 0.65, "Virus": 0.35},
            {"Host": 0.75, "Virus": 0.25},
        ]


def test_load_labeled_sequences_assigns_expected_labels(tmp_path) -> None:
    host_path = tmp_path / "host.fasta"
    virus_path = tmp_path / "virus.fasta"

    host_path.write_text(">h1\nAAAA\n>h2\nCCCC\n", encoding="utf-8")
    virus_path.write_text(">v1\nTTTT\n>v2\nGGGG\n", encoding="utf-8")

    labeled_sequences = load_labeled_sequences(
        virus_file=str(virus_path),
        host_file=str(host_path),
    )

    assert [item.label for item in labeled_sequences] == [0, 0, 1, 1]
    assert [item.sequence_id for item in labeled_sequences] == ["h1", "h2", "v1", "v2"]


def test_evaluate_predictor_returns_metrics_and_errors() -> None:
    labeled_sequences = [
        LabeledSequence(sequence_id="host_1", sequence="AAAA", label=0),
        LabeledSequence(sequence_id="virus_1", sequence="TTTT", label=1),
        LabeledSequence(sequence_id="virus_2", sequence="GGGG", label=1),
        LabeledSequence(sequence_id="host_2", sequence="CCCC", label=0),
    ]

    report = evaluate_predictor(_StubPredictor(), labeled_sequences)

    assert report["total_sequences"] == 4
    assert report["accuracy"] == 0.75
    assert report["precision"] == 1.0
    assert report["recall"] == 0.5
    assert report["f1"] == 0.6667
    assert report["roc_auc"] == 1.0
    assert report["confusion_matrix"] == [[2, 0], [1, 1]]
    assert len(report["errors"]) == 1
    assert report["errors"][0]["sequence_id"] == "virus_2"
    assert report["errors"][0]["expected"] == "Virus"
    assert report["errors"][0]["predicted"] == "Host"


def test_predict_class_probability_mapping_exposes_both_labels() -> None:
    predictor = PredictClass(model_name="RandomForest")

    probabilities = predictor.predict_probabilities("ATCGATCGATCGATCG")

    assert set(probabilities.keys()) == {"Host", "Virus"}
    assert abs(sum(probabilities.values()) - 1.0) < 1e-6


def test_svm_probability_mapping_aligns_with_prediction() -> None:
    predictor = PredictClass(model_name="SVM")

    host_probabilities = predictor.predict_probabilities(
        "ATGAAGGTGAAGGCCACCCTGCTGCTGTGC"
    )
    virus_probabilities = predictor.predict_probabilities(
        "CAAGTGCTTTTGTGGAAACTGTGAAAGGTT"
    )

    assert max(host_probabilities, key=host_probabilities.get) == predictor.predict(
        "ATGAAGGTGAAGGCCACCCTGCTGCTGTGC"
    )
    assert max(virus_probabilities, key=virus_probabilities.get) == predictor.predict(
        "CAAGTGCTTTTGTGGAAACTGTGAAAGGTT"
    )
