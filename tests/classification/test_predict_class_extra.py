from __future__ import annotations

from types import SimpleNamespace

import numpy as np
import pytest

import binary_classifiers.predict_class as predict_module
from binary_classifiers.predict_class import PredictClass


class _FakeEvo2Embedder:
    def __init__(self, model_size: str = "7b") -> None:
        self.model_size = model_size

    def is_available(self) -> bool:
        return True

    def get_embedding(self, sequence: str) -> np.ndarray:
        return np.asarray([len(sequence), 1.0], dtype=float)

    def get_embeddings_batch(self, sequences: list[str]) -> list[np.ndarray]:
        return [np.asarray([len(sequence), 1.0], dtype=float) for sequence in sequences]


class _FakeProbabilisticModel:
    classes_ = [0, 1]

    def predict(self, features) -> np.ndarray:
        return np.asarray([1 for _ in features])

    def predict_proba(self, features) -> np.ndarray:
        return np.asarray([[0.2, 0.8] for _ in features], dtype=float)


class _NoProbaModel:
    def predict(self, features) -> np.ndarray:
        return np.asarray([0 for _ in features])


def test_predict_class_uses_mocked_evo2_path(monkeypatch) -> None:
    import binary_classifiers.evo2_embedder as evo2_embedder_module

    monkeypatch.setattr(evo2_embedder_module, "Evo2Embedder", _FakeEvo2Embedder)
    monkeypatch.setattr(predict_module.Path, "exists", lambda self: True)
    monkeypatch.setattr(
        predict_module.joblib,
        "load",
        lambda path: _FakeProbabilisticModel(),
    )

    predictor = PredictClass(model_name="Evo2")

    assert predictor.model_name == "Evo2"
    assert predictor.predict("ACGT") == "Virus"
    assert predictor.predict_with_confidence("ACGT") == ("Virus", 0.8)
    assert predictor.batch_predict(["A", "AA"]) == ["Virus", "Virus"]
    assert predictor.batch_predict_probabilities(["A", "AA"]) == [
        {"Host": 0.2, "Virus": 0.8},
        {"Host": 0.2, "Virus": 0.8},
    ]
    assert predictor.batch_predict_with_confidence(["A", "AA"]) == [
        ("Virus", 0.8),
        ("Virus", 0.8),
    ]


def test_predict_class_private_guards_raise_for_missing_runtime() -> None:
    predictor = object.__new__(PredictClass)
    predictor.model_name = "Evo2"
    predictor.model = None
    predictor.vectorizer = None
    predictor.kmer_tranformer = None
    predictor.evo2_embedder = None

    with pytest.raises(RuntimeError, match="not loaded"):
        predictor._require_model()

    with pytest.raises(RuntimeError, match="embedder is not available"):
        predictor._preprocess_with_evo2("ACGT")

    with pytest.raises(RuntimeError, match="embedder is not available"):
        predictor._preprocess_batch(["ACGT"])

    predictor.model_name = "RandomForest"
    with pytest.raises(
        RuntimeError, match="does not have a k-mer preprocessing pipeline"
    ):
        predictor._preprocess("ACGT")


def test_predict_class_probability_helpers_cover_error_and_swap_paths() -> None:
    predictor = object.__new__(PredictClass)
    predictor.model_name = "RandomForest"
    predictor.model = _NoProbaModel()

    with pytest.raises(ValueError, match="does not expose predict_proba"):
        predictor._probability_mapping_for_features([[1.0, 2.0]])

    with pytest.raises(ValueError, match="does not expose predict_proba"):
        predictor._batch_probability_mappings_for_features([[1.0, 2.0]])

    swapped = predictor._map_probabilities_to_labels(
        classes=[0, 1],
        probabilities=[0.1, 0.9],
        predicted_label="Host",
    )
    assert swapped == {"Host": 0.9, "Virus": 0.1}

    with pytest.raises(ValueError, match="does not align"):
        predictor._map_probabilities_to_labels(classes=[0], probabilities=[0.2, 0.8])


def test_predict_class_import_error_falls_back_to_random_forest(monkeypatch) -> None:
    original_import = __import__

    def _fake_import(name, globals=None, locals=None, fromlist=(), level=0):
        if "evo2_embedder" in name:
            raise ImportError("missing evo2 embedder")
        return original_import(name, globals, locals, fromlist, level)

    def _fake_load_kmer_pipeline(self, model_name: str) -> None:
        self.model = SimpleNamespace()
        self.vectorizer = SimpleNamespace()
        self.kmer_tranformer = SimpleNamespace()
        self.loaded_model_name = model_name

    monkeypatch.setattr("builtins.__import__", _fake_import)
    monkeypatch.setattr(PredictClass, "_load_kmer_pipeline", _fake_load_kmer_pipeline)

    predictor = PredictClass(model_name="Evo2")

    assert predictor.model_name == "RandomForest"
    assert predictor.loaded_model_name == "RandomForest"
