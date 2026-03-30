# from backend.app.schemas.routers import ModelConfig, SequenceInput
# from backend.app.services.classification import classify_sequence, run_classification


# class _FixedPredictor:
#     def __init__(self, label: str, confidence: float) -> None:
#         self.label = label
#         self.confidence = confidence

#     def predict_with_confidence(self, _: str) -> tuple[str, float]:
#         return self.label, self.confidence


# def test_model_config_uses_stricter_default_confidence_threshold() -> None:
#     config = ModelConfig()

#     assert config.confidence_threshold == 0.6


# def test_classify_sequence_uses_model_prediction(monkeypatch) -> None:
#     monkeypatch.setattr(
#         "api.main.get_predictor",
#         lambda _: _FixedPredictor(label="Virus", confidence=0.92),
#     )

#     result = classify_sequence(
#         seq_id="seq_1",
#         sequence="ATCGATCGATCG",
#         config=ModelConfig(enable_ood=False),
#     )

#     assert result.prediction == "Virus"
#     assert result.confidence == 0.92
#     assert result.mahalanobis_distance is None
#     assert result.energy_score is None
#     assert result.ood_score is None


# def test_classify_sequence_marks_low_confidence_as_uncertain(monkeypatch) -> None:
#     monkeypatch.setattr(
#         "api.main.get_predictor",
#         lambda _: _FixedPredictor(label="Host", confidence=0.55),
#     )

#     result = classify_sequence(
#         seq_id="seq_2",
#         sequence="GGGGCCCCAAAA",
#         config=ModelConfig(
#             enable_ood=True, confidence_threshold=0.8, ood_threshold=0.3
#         ),
#     )

#     assert result.prediction == "Uncertain"
#     assert result.uncertain is True
#     assert result.confidence == 0.55
#     assert result.ood_score == 0.45
#     assert result.mahalanobis_distance is not None
#     assert result.energy_score is not None


# def test_classify_sequence_marks_high_ood_as_novel(monkeypatch) -> None:
#     monkeypatch.setattr(
#         "api.main.get_predictor",
#         lambda _: _FixedPredictor(label="Host", confidence=0.65),
#     )

#     result = classify_sequence(
#         seq_id="seq_3",
#         sequence="GGGGCCCCAAAA",
#         config=ModelConfig(
#             enable_ood=True, confidence_threshold=0.6, ood_threshold=0.3
#         ),
#     )

#     assert result.prediction == "Novel"
#     assert result.uncertain is False
#     assert result.ood_score == 0.35


# def test_classify_sequence_marks_invalid_input(monkeypatch) -> None:
#     monkeypatch.setattr(
#         "api.main.get_predictor",
#         lambda _: _FixedPredictor(label="Virus", confidence=0.99),
#     )

#     result = classify_sequence(
#         seq_id="bad_seq",
#         sequence="XYZ123",
#         config=ModelConfig(enable_ood=False),
#     )

#     assert result.prediction == "Invalid"
#     assert result.confidence == 0.0
#     assert result.uncertain is True
#     assert result.ood_score == 1.0
#     assert "Invalid input data" in (result.explanation or "")


# class _RoutingPredictor:
#     def predict_with_confidence(self, sequence: str) -> tuple[str, float]:
#         if sequence.startswith("A"):
#             return "Virus", 0.95
#         return "Host", 0.96


# def test_run_classification_counts_actual_labels(monkeypatch) -> None:
#     monkeypatch.setattr("api.main.get_predictor", lambda _: _RoutingPredictor())

#     response = run_classification(
#         sequences=[
#             SequenceInput(id="v1", sequence="ATCGATCGATCG"),
#             SequenceInput(id="h1", sequence="GCGCATATGCGC"),
#         ],
#         config=ModelConfig(enable_ood=False),
#         source="unit_test",
#     )

#     assert response.total_sequences == 2
#     assert response.virus_count == 1
#     assert response.host_count == 1
#     assert response.novel_count == 0
