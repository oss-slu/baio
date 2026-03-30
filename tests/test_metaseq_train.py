from __future__ import annotations

import json

import pytest
import yaml

from metaseq import train


def test_ensure_dir_creates_parent_directory(tmp_path) -> None:
    output_path = tmp_path / "artifacts" / "model.joblib"

    train._ensure_dir(str(output_path))

    assert output_path.parent.exists()


def test_load_dataset_from_csv(tmp_path) -> None:
    csv_path = tmp_path / "dataset.csv"
    csv_path.write_text("sequence,label\nAAAA,1\nCCCC,0\n", encoding="utf-8")

    X, y = train.load_dataset(csv_path=str(csv_path))

    assert X == ["AAAA", "CCCC"]
    assert y == [1, 0]


def test_load_dataset_rejects_csv_without_required_columns(tmp_path) -> None:
    csv_path = tmp_path / "dataset.csv"
    csv_path.write_text("sequence,wrong\nAAAA,1\n", encoding="utf-8")

    with pytest.raises(ValueError, match="CSV must contain 'sequence' and 'label'"):
        train.load_dataset(csv_path=str(csv_path))


def test_load_dataset_from_sequence_file_and_label_map(monkeypatch, tmp_path) -> None:
    label_map_path = tmp_path / "labels.json"
    label_map_path.write_text(json.dumps({"virus_1": 1}), encoding="utf-8")

    monkeypatch.setattr(
        train,
        "load_sequences",
        lambda _: [("host_1", "AAAA"), ("virus_1", "TTTT")],
    )

    X, y = train.load_dataset(
        seq_file="ignored.fasta",
        label_map_json=str(label_map_path),
    )

    assert X == ["AAAA", "TTTT"]
    assert y == [0, 1]


def test_load_dataset_requires_a_supported_input_source() -> None:
    with pytest.raises(
        ValueError,
        match="Provide either csv_path or \\(seq_file and label_map_json\\)",
    ):
        train.load_dataset()


class _StubPipeline:
    def __init__(self) -> None:
        self.fit_args: tuple[list[str], list[int]] | None = None

    def fit(self, X: list[str], y: list[int]) -> None:
        self.fit_args = (X, y)

    def predict(self, X: list[str]) -> list[int]:
        return [1 for _ in X]


def test_train_from_config_runs_pipeline_and_saves_model(monkeypatch, tmp_path) -> None:
    config_path = tmp_path / "train.yml"
    model_path = tmp_path / "models" / "classifier.joblib"
    config_path.write_text(
        yaml.safe_dump(
            {
                "data": {"csv": "unused.csv"},
                "model": {"name": "rf", "params": {"k": 4}},
                "train": {"test_size": 0.5, "random_state": 7, "stratify": True},
                "output": {"model_path": str(model_path)},
            }
        ),
        encoding="utf-8",
    )

    monkeypatch.setattr(
        train,
        "load_dataset",
        lambda **_: (["AAAA", "CCCC", "GGGG", "TTTT"], [0, 1, 0, 1]),
    )
    monkeypatch.setattr(
        train,
        "train_test_split",
        lambda X, y, test_size, random_state, stratify: (
            X[:2],
            X[2:],
            y[:2],
            y[2:],
        ),
    )

    pipeline = _StubPipeline()
    monkeypatch.setattr(train, "build_pipeline", lambda name, params: pipeline)
    monkeypatch.setattr(
        train,
        "classification_report",
        lambda y_true, y_pred, output_dict: {
            "accuracy": 0.5,
            "support": len(y_true),
        },
    )

    saved: dict[str, object] = {}

    def _save_model(pipe: object, path: str) -> None:
        saved["pipe"] = pipe
        saved["path"] = path

    monkeypatch.setattr(train, "save_model", _save_model)

    stats = train.train_from_config(str(config_path))

    assert pipeline.fit_args == (["AAAA", "CCCC"], [0, 1])
    assert saved == {"pipe": pipeline, "path": str(model_path)}
    assert stats["model_path"] == str(model_path)
    assert stats["model_name"] == "rf"
    assert stats["n_train"] == 2
    assert stats["n_val"] == 2
    assert stats["report"]["accuracy"] == 0.5
