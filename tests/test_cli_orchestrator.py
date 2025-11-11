import json
from pathlib import Path

import numpy as np

from app.orchestrator_cli import (
    CliOrchestrator,
    SequenceRecord,
    parse_args,
    main as orchestrator_main,
)


class _MockEmbedder:
    def generate_batch(self, sequences):
        seq_list = list(sequences)
        return np.zeros((len(seq_list), 16), dtype=np.float32)


class _MockExecutor:
    def __init__(self, model_name: str = "RandomForest") -> None:
        self.model_name = model_name
        self._calls = 0

    def predict_with_embeddings(self, sequences, embeddings=None):
        self._calls += 1
        results = []
        for record in sequences:
            results.append(
                {
                    "sequence_id": record.sequence_id,
                    "label": "Virus",
                    "confidence": 0.5,
                    "metadata": {"executor": self.model_name},
                }
            )
        return results


def test_cli_orchestrator_run(tmp_path):
    embedder = _MockEmbedder()

    def factory(model_name: str):
        return _MockExecutor(model_name)

    orchestrator = CliOrchestrator(embedder=embedder, classifier_factory=factory)
    records = [
        SequenceRecord("seq1", "ATCGATCGAT"),
        SequenceRecord("seq2", "GGGCCCATAA"),
    ]
    result = orchestrator.run(
        records,
        model_name="RandomForest",
        save_embeddings=tmp_path / "embeddings",
    )

    assert len(result["predictions"]) == 2
    assert result["summary"]["total_sequences"] == 2
    assert Path(result["embeddings_path"]).exists()


def test_parse_args_sequence():
    args = parse_args(["--sequence", "ATGC", "--model", "SVM"])
    assert args.sequence == "ATGC"
    assert args.model == "SVM"


def test_cli_main_writes_output(monkeypatch, tmp_path):
    output_path = tmp_path / "result.json"

    # Patch orchestrator creation to use mocks to avoid heavy loading
    mock_orchestrator = CliOrchestrator(embedder=_MockEmbedder(), classifier_factory=lambda _: _MockExecutor())

    def fake_ctor():
        return mock_orchestrator

    monkeypatch.setattr("app.orchestrator_cli.CliOrchestrator", lambda: mock_orchestrator)

    exit_code = orchestrator_main(
        ["--sequence", "ATGCTAGCAT", "--output", str(output_path), "--model", "RandomForest"]
    )

    assert exit_code == 0
    data = json.loads(output_path.read_text())
    assert data["summary"]["total_sequences"] == 1

