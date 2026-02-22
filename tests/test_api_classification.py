from api.main import ModelConfig, SequenceInput, classify_sequence, run_classification


class _FixedPredictor:
    def __init__(self, label: str, confidence: float) -> None:
        self.label = label
        self.confidence = confidence

    def predict_with_confidence(self, _: str) -> tuple[str, float]:
        return self.label, self.confidence


def test_classify_sequence_uses_model_prediction(monkeypatch) -> None:
    monkeypatch.setattr(
        "api.main.get_predictor",
        lambda _: _FixedPredictor(label="Virus", confidence=0.92),
    )

    result = classify_sequence(
        seq_id="seq_1",
        sequence="ATCGATCGATCG",
        config=ModelConfig(enable_ood=False),
    )

    assert result.prediction == "Virus"
    assert result.confidence == 0.92
    assert result.mahalanobis_distance is None
    assert result.energy_score is None
    assert result.ood_score is None


def test_classify_sequence_marks_low_confidence_as_novel(monkeypatch) -> None:
    monkeypatch.setattr(
        "api.main.get_predictor",
        lambda _: _FixedPredictor(label="Host", confidence=0.55),
    )

    result = classify_sequence(
        seq_id="seq_2",
        sequence="GGGGCCCCAAAA",
        config=ModelConfig(
            enable_ood=True, confidence_threshold=0.8, ood_threshold=0.3
        ),
    )

    assert result.prediction == "Novel"
    assert result.confidence == 0.55
    assert result.ood_score == 0.45
    assert result.mahalanobis_distance is not None
    assert result.energy_score is not None


class _RoutingPredictor:
    def predict_with_confidence(self, sequence: str) -> tuple[str, float]:
        if sequence.startswith("A"):
            return "Virus", 0.95
        return "Host", 0.96


def test_run_classification_counts_actual_labels(monkeypatch) -> None:
    monkeypatch.setattr("api.main.get_predictor", lambda _: _RoutingPredictor())

    response = run_classification(
        sequences=[
            SequenceInput(id="v1", sequence="ATCGATCG"),
            SequenceInput(id="h1", sequence="GCGCGCGC"),
        ],
        config=ModelConfig(enable_ood=False),
        source="unit_test",
    )

    assert response.total_sequences == 2
    assert response.virus_count == 1
    assert response.host_count == 1
    assert response.novel_count == 0
