"""Tests for classification pipeline."""

import pytest
from unittest.mock import patch
from app.pipeline.classification import classify_sequence, get_classification_summary


class TestSequenceClassification:
    """Test individual sequence classification functions."""

    def test_classify_sequence_basic(self):
        """Test basic sequence classification."""
        result = classify_sequence("test_seq", "ATCGATCGATCGATCG")

        # Check required fields are present
        assert "sequence_id" in result
        assert "length" in result
        assert "gc_content" in result
        assert "prediction" in result
        assert "confidence" in result
        assert "sequence_preview" in result

        # Check values
        assert result["sequence_id"] == "test_seq"
        assert result["length"] == 16
        assert result["prediction"] in ["Virus", "Host", "Novel"]

        # Check confidence is a valid probability
        confidence = float(result["confidence"])
        assert 0.0 <= confidence <= 1.0

    def test_classify_sequence_low_gc(self):
        """Test classification of low GC content sequence."""
        # Low GC content sequence (25% GC)
        low_gc_seq = "ATATATATATATATAT"
        result = classify_sequence("low_gc", low_gc_seq)

        gc_content = float(result["gc_content"])
        assert gc_content == 0.0  # No G or C bases

        assert result["prediction"] in ["Virus", "Host", "Novel"]

    def test_classify_sequence_short_preview(self):
        """Test sequence preview for short sequences."""
        short_seq = "ATCGATCG"
        result = classify_sequence("short", short_seq)

        assert result["sequence_preview"] == short_seq

    def test_classify_sequence_long_preview(self):
        """Test sequence preview for long sequences."""
        long_seq = "A" * 100
        result = classify_sequence("long", long_seq)

        preview = result["sequence_preview"]
        assert len(preview) == 53  # 50 chars + "..."
        assert preview.endswith("...")

    @patch("streamlit.session_state")
    def test_classify_sequence_with_ood_enabled(self, mock_session_state):
        """Test classification with OOD detection enabled."""
        mock_session_state.get.return_value = {"enable_ood": True}

        result = classify_sequence("test_ood", "ATCGATCGATCG")

        # Should have OOD-specific fields
        assert "mahalanobis_distance" in result
        assert "energy_score" in result
        assert "ood_score" in result

        # Check OOD score is valid
        ood_score = float(result["ood_score"])
        assert 0.0 <= ood_score <= 1.0


class TestClassificationSummary:
    """Test classification summary generation."""

    def test_get_classification_summary_basic(self):
        """Test basic summary generation."""
        results = {
            "total_sequences": 10,
            "virus_count": 4,
            "host_count": 5,
            "novel_count": 1,
            "source": "test_file.fasta",
            "processing_time": 2.5,
            "timestamp": "2025-10-20T10:30:00",
        }

        summary = get_classification_summary(results)

        # Check key information is included
        assert "10" in summary  # total sequences
        assert "4" in summary and "40.0%" in summary  # virus count and percentage
        assert "5" in summary and "50.0%" in summary  # host count and percentage
        assert "1" in summary and "10.0%" in summary  # novel count and percentage
        assert "test_file.fasta" in summary
        assert "2.5s" in summary
        assert "2025-10-20T10:30:00" in summary

    def test_get_classification_summary_zero_sequences(self):
        """Test summary with zero sequences."""
        results = {
            "total_sequences": 0,
            "virus_count": 0,
            "host_count": 0,
            "novel_count": 0,
            "source": "empty_file.fasta",
            "processing_time": 0.1,
            "timestamp": "2025-10-20T10:30:00",
        }

        summary = get_classification_summary(results)

        # Should handle division by zero gracefully
        assert "0.0%" in summary
        assert "0" in summary

    def test_get_classification_summary_missing_processing_time(self):
        """Test summary with missing processing time."""
        results = {
            "total_sequences": 5,
            "virus_count": 2,
            "host_count": 3,
            "novel_count": 0,
            "source": "test.fasta",
            "timestamp": "2025-10-20T10:30:00",
            # processing_time is missing
        }

        summary = get_classification_summary(results)

        # Should handle missing processing time gracefully
        assert "0.0s" in summary


class TestClassificationIntegration:
    """Integration tests for the full classification pipeline."""


if __name__ == "__main__":
    pytest.main([__file__])
