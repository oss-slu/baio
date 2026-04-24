"""Tests for classification Pydantic schemas.

See backend/app/schemas/classification.py. Boundary tests on Field constraints.
"""

import pytest
from pydantic import ValidationError

from backend.app.schemas.classification import (
    ClassificationRequest,
    ModelConfig,
    SequenceInput,
)


class TestModelConfig:
    def test_defaults_accepted(self) -> None:
        cfg = ModelConfig()
        assert cfg.confidence_threshold == 0.6
        assert cfg.batch_size == 64
        assert cfg.enable_ood is False
        assert cfg.ood_threshold == 0.99

    def test_confidence_threshold_out_of_range_rejected(self) -> None:
        with pytest.raises(ValidationError):
            ModelConfig(confidence_threshold=1.5)
        with pytest.raises(ValidationError):
            ModelConfig(confidence_threshold=-0.1)

    def test_batch_size_out_of_range_rejected(self) -> None:
        with pytest.raises(ValidationError):
            ModelConfig(batch_size=0)
        with pytest.raises(ValidationError):
            ModelConfig(batch_size=1025)

    def test_ood_threshold_out_of_range_rejected(self) -> None:
        with pytest.raises(ValidationError):
            ModelConfig(ood_threshold=1.5)


class TestSequenceInput:
    def test_valid(self) -> None:
        si = SequenceInput(id="seq1", sequence="ATGCATGC")
        assert si.id == "seq1"
        assert si.sequence == "ATGCATGC"

    def test_empty_id_rejected(self) -> None:
        with pytest.raises(ValidationError):
            SequenceInput(id="", sequence="ATGC")

    def test_empty_sequence_rejected(self) -> None:
        with pytest.raises(ValidationError):
            SequenceInput(id="seq1", sequence="")

    def test_whitespace_only_id_rejected(self) -> None:
        # strip_whitespace + min_length=1 means "   " becomes "" and fails
        with pytest.raises(ValidationError):
            SequenceInput(id="   ", sequence="ATGC")


class TestClassificationRequest:
    def test_minimal_request(self) -> None:
        req = ClassificationRequest(sequences=[SequenceInput(id="s1", sequence="ATGC")])
        assert len(req.sequences) == 1
        assert req.config is None
        assert req.source is None

    def test_with_config_and_source(self) -> None:
        req = ClassificationRequest(
            sequences=[SequenceInput(id="s1", sequence="ATGC")],
            config=ModelConfig(confidence_threshold=0.8),
            source="upload.fasta",
        )
        assert req.config.confidence_threshold == 0.8
        assert req.source == "upload.fasta"
