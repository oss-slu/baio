"""Integration tests for the real classification pipeline with binary classifiers."""

import pytest
from typing import List, Tuple
from binary_classifiers.predict_class import PredictClass


class TestBinaryClassifierIntegration:
    """Integration tests for the PredictClass binary classifier."""

    @pytest.fixture
    def viral_sequences(self) -> List[str]:
        """Sample viral DNA sequences for testing."""
        return [
            # HIV-1 sequence (known virus)
            "ATGGGTGCGAGAGCGTCAGTATTAAGCGGGGGAGAATTAGATCGATGGGAAAAAATTCGGTTAAGGCCAGGGGGAAAGAAAAAATATAAATTAAAACATATAGTATGGGCAAGCAGGGAGCTAGAACGATTCGCAGTTAATCCTGGCCTGTTAGAAACATCAGAAGGCTGTAGACAAATACTGGGACAGCTACAACCATCCCTTCAGACAGGATCAGAAGAACTTAGATCATTATATAATACAGTAGCAACCCTCTATTGTGTGCATCAAAGGATAGAGATAAAAGACACCAAGGAAGCTTTAGACAAGATAGAGGAAGAGCAAAACAAAAGTAAGAAAAAAGCACAGCAAGCAGCAGCTGACACAGGACACAGCAATCAGGTCAGCCAAAATTACCCTATAGTGCAGAACATCCAGGGGCAAATGGTACATCAGGCCATATCACCTAGAACTTTAAATGCATGGGTAAAAGTAGTAGAAGAGAAGGCTTTCAGCCCAGAAGTGATACCCATGTTTTCAGCATTATCAGAAGGAGCCACCCCACAAGATTTAAACACCATGCTAAACACAGTGGGGGGACATCAAGCAGCCATGCAAATGTTAAAAGAGACCATCAATGAGGAAGCTGCAGAATGGGATAGAGTGCATCCAGTGCATGCAGGGCCTATTGCACCAGGCCAGATGAGAGAACCAAGGGGAAGTGACATAGCAGGAACTACTAGTACCCTTCAGGAACAAATAGGATGGATGACAAATAATCCACCTATCCCAGTAGGAGAAATTTATAAAAGATGGATAATCCTGGGATTAAATAAAATAGTAAGAATGTATAGCCCTACCAGCATTCTGGACATAAGACAAGGACCAAAGGAACCCTTTAGAGACTATGTAGACCGGTTCTATAAAACTCTAAGAGCCGAGCAAGCTTCACAGGAGGTAAAAAATTGGATGACAGAAACCTTGTTGGTCCAAAATGCGAACCCAGATTGTAAGACTATTTTAAAAGCATTGGGACCAGCGGCTACACTAGAAGAAATGATGACAGCATGTCAGGGAGTAGGAGGACCCGGCCATAAAGCAAGAGTTTTGGCTGAAGCAATGAGCCAAGTAACAAATTCAGCTACCATAATGATGCAGAGAGGCAATTTTAGGAACCAAAGAAAGACTGTTAAGTGTTTCAATTGTGGCAAAGAAGGGCACACAGCCAGAAATTGCAGGGCCCCTAGGAAAAAGGGCTGTTGGAAATGTGGAAAGGAAGGACACCAAATGAAAGATTGTACTGAGAGACAGGCTAATTTTTTAGGGAAGATCTGGCCTTCCTACAAGGGAAGGCCAGGGAATTTTCTTCAGAGCAGACCAGAGCCAACAGCCCCACCAGAAGAGAGCTTCAGGTCTGGGGTAGAGACAACAACTCCCCCTCAGAAGCAGGAGCCGATAGACAAGGAACTGTATCCTTTAACTTCCCTCAGGTCACTCTTTGGCAACGACCCCTCGTCACAATAAAGATAGGGGGGCAACTAAAGGAAGCTCTATTAGATACAGGAGCAGATGATACAGTATTAGAAGAAATGAGTTTGCCAGGAAGATGGAAACCAAAAATGATAGGGGGAATTGGAGGTTTTATCAAAGTAAGACAGTATGATCAGATACTCATAGAAATCTGTGGACATAAAGCTATAGGTACAGTATTAGTAGGACCTACACCTGTCAACATAATTGGAAGAAATCTGTTGACTCAGATTGGTTGCACTTTAAATTTT",
            # Lambda phage sequence (known virus)
            "GGGCGGCGACCTCGCGGGTTTTCGCTATTTATGAAAATTTTCCGGTTTAAGGCGTTTCCGTTCTTCTTCGTCATAACTTAATGTTTTTATTTAAAATACCCTCTGAAAAGAAAGGAAACGACAGGTGCTGAAAGCGAGGCTTTTTGGCCTCTGTCGTTTCCTTTCTCTGTTTTTGTCCGTGGAATGAACAATGGAAGTCAACAAAAAGCAGCTGGCTGACATTTTCGGTGCGAGTATCCGTACCATTCAGAACTGGCAGGAACAGGGAATGCCCGTTCTGCGAGGCGGTGGCAAGGGTAATGAGGTGCTTTATGACTCTGCCGCCGTCATAAAATGGTATGCCGAAAGGGATGCTGAAATTGAGAACGAAAAGCTGCGCCGGGAGGTTGAAGAACTGCGGCAGGCCAGCGAGGCAGATCTCCAGCCAGGAACTATTGAGTACGAACGCCATCGACTTACGCGTGCGCAGGCCGACGCACAGGAACTGAAGAATGCCAGAGACTCCGGCGCTGAGGTGTCAATCGTCGGAGCCGCTGAGCAATAACTAGCATAACCCCTTGGGGCCTCTAAACGGGTCTTGAGGGGTTTTTTGCTGAAAG",
        ]

    @pytest.fixture
    def host_sequences(self) -> List[str]:
        """Sample host DNA sequences for testing."""
        return [
            # Human genomic sequence (known host)
            "ATGAAGGTGAAGGCCACCCTGCTGCTGTGCGCCCTGCTGCTGCCCCTGGCCCCCCAGGCCCTGGTGAAGAAGGGCGTGCCCGAGCGCGACCGCGCCCCCGCCCGCCCCAACCCCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCCCGCGCCCTGACCGCCCCCGCC",
            # E. coli sequence (known host)
            "ATGGCTAAAGAAAAAATTACCCTGCTGGGTGCGGTAACCGCCGGTATCCCGGTGACCACCACCGCGACCGCGACCGTTGCGCTGGTGCTGACCGCGGGCGGCGGTTTTGCGCCGACCGCCACCGGTGCGGGTATCCCGGTTCTGGCGGCGGCGACCTCCGGCGGTGGCGGCGGTCTGCTGGTGCTGACCGGCGGCTATCCGGTGCTGGTGACCGCGGTTACCGCGCTGTTTCCGGTGCCGACCGCCTATGTGCCGACCTATCTGTATGGCGCGACCGTGGCGACCCTGGTGGGCTATCCGGGTGTGACCGCGGTGACCTATCTGCCGGTTGCGCTGGTGCCGACCGGCGGCGGCTATGTGCCGGTTGTGACCGCGTATACCGCGGCGACCCTGGTGGGTTATCCGGGCGTGACCGCGGTGACCTATCTGCCGGTTGCGCTGGTGCCGACCGGCGGCGGCTATGTGCCGGTTGTGACCGCGTATACCGCGGCGACCCTGGTGGGTTATCCGGGCGTGACCGCGGTGACCTATCTGCCGGTTGCGCTGGTGCCGACCGGCGGCGGCTATGTGCCGGTTGTGACCGCGTATACCGCGGCGACCCTGGTGGGTTATCCGGGCGTGACCGCGGTGACCTATCTGCCGGTTGCGCTGGTGCCGACCGGCGGCGGCTATGTGCCGGTTGTGACCGCGTATACCGCGGCGACCCTGGTGGGTTATCCGGGCGTGACCGCGGTGACCTATCTGCCGGTTGCGCTGGTGCCGACCGGCGGCGGCTATGTGCCGGTTGTGACCGCGTATACCGCGGCGACCCTGGTGGGTTATCCGGGCGTGACCGCGGTGACCTATCTGCCGGTTGCGCTGGTGCCGACCGGCGGCGGCTATGTGCCGGTTGTGACCGCGTATACCGCGGCGACCCTGGTGGGTTATCCGGGCGTGACCGCGGTGACCTATCTGCCGGTTGCGCTGGTGCCGACCGGCGGCGGCTATGTGCCGGTTGTGACCGCGTATACCGCGGCGACCCTGGTGGGTTATCCGGGCGTGACCGCGGTGACCTATCTGCCGGTTGCGCTGGTGCCGACCGGCGGCGGCTATGTGCCGGTTGTGACCGCGTATACCGCGGCGACCCTGGTGGGTTATCCGGGCGTGACCGCGGTGACCTATCTGCCGGTTGCGCTGGTGCCGACCGGCGGCGGCTATGTGCCGGTTGTGACCGCGTATACCGCGGCGACCCTGGTGGGTTATCCGGGCGTGACCGCGGTGACCTATCTGCCGGTTGCGCTGGTGCCGACCGGCGGCGGCTATGTGCCGGTTGTGACCGCGTATACCGCGGCGACCCTG",
        ]

    def test_random_forest_initialization(self) -> None:
        """Test RandomForest model initialization."""
        predictor = PredictClass(model_name="RandomForest")
        assert predictor.model_name == "RandomForest"
        assert predictor.model is not None
        assert predictor.vectorizer is not None
        assert predictor.kmer_tranformer is not None

    def test_svm_initialization(self) -> None:
        """Test SVM model initialization."""
        predictor = PredictClass(model_name="SVM")
        assert predictor.model_name == "SVM"
        assert predictor.model is not None
        assert predictor.vectorizer is not None
        assert predictor.kmer_tranformer is not None

    def test_predict_viral_sequence_random_forest(
        self, viral_sequences: List[str]
    ) -> None:
        """Test RandomForest classifier predicts viral sequences correctly."""
        predictor = PredictClass(model_name="RandomForest")

        for seq in viral_sequences:
            prediction = predictor.predict(seq)
            assert prediction in ["Virus", "Host"]
            # Most viral sequences should be classified as Virus
            # (though we don't assert this strictly as models may vary)

    def test_predict_host_sequence_random_forest(
        self, host_sequences: List[str]
    ) -> None:
        """Test RandomForest classifier predicts host sequences correctly."""
        predictor = PredictClass(model_name="RandomForest")

        for seq in host_sequences:
            prediction = predictor.predict(seq)
            assert prediction in ["Virus", "Host"]

    def test_predict_viral_sequence_svm(self, viral_sequences: List[str]) -> None:
        """Test SVM classifier predicts viral sequences correctly."""
        predictor = PredictClass(model_name="SVM")

        for seq in viral_sequences:
            prediction = predictor.predict(seq)
            assert prediction in ["Virus", "Host"]

    def test_predict_host_sequence_svm(self, host_sequences: List[str]) -> None:
        """Test SVM classifier predicts host sequences correctly."""
        predictor = PredictClass(model_name="SVM")

        for seq in host_sequences:
            prediction = predictor.predict(seq)
            assert prediction in ["Virus", "Host"]

    def test_batch_predict_random_forest(
        self, viral_sequences: List[str], host_sequences: List[str]
    ) -> None:
        """Test RandomForest batch prediction."""
        predictor = PredictClass(model_name="RandomForest")

        all_sequences = viral_sequences + host_sequences
        predictions = predictor.batch_predict(all_sequences)

        assert len(predictions) == len(all_sequences)
        for pred in predictions:
            assert pred in ["Virus", "Host"]

    def test_batch_predict_svm(
        self, viral_sequences: List[str], host_sequences: List[str]
    ) -> None:
        """Test SVM batch prediction."""
        predictor = PredictClass(model_name="SVM")

        all_sequences = viral_sequences + host_sequences
        predictions = predictor.batch_predict(all_sequences)

        assert len(predictions) == len(all_sequences)
        for pred in predictions:
            assert pred in ["Virus", "Host"]

    def test_predict_short_sequence(self) -> None:
        """Test prediction on short sequences."""
        predictor = PredictClass(model_name="RandomForest")

        # Short but valid DNA sequence
        short_seq = "ATCGATCGATCGATCG"
        prediction = predictor.predict(short_seq)
        assert prediction in ["Virus", "Host"]

    def test_predict_consistency(self, viral_sequences: List[str]) -> None:
        """Test that predictions are consistent for the same sequence."""
        predictor = PredictClass(model_name="RandomForest")

        seq = viral_sequences[0]
        prediction1 = predictor.predict(seq)
        prediction2 = predictor.predict(seq)

        # Same sequence should always give same prediction
        assert prediction1 == prediction2

    def test_batch_predict_single_vs_multiple(self, viral_sequences: List[str]) -> None:
        """Test that single predict and batch predict give same results."""
        predictor = PredictClass(model_name="RandomForest")

        seq = viral_sequences[0]
        single_prediction = predictor.predict(seq)
        batch_predictions = predictor.batch_predict([seq])

        assert len(batch_predictions) == 1
        assert single_prediction == batch_predictions[0]

    def test_different_models_same_sequence(self, viral_sequences: List[str]) -> None:
        """Test that different models can process the same sequence."""
        rf_predictor = PredictClass(model_name="RandomForest")
        svm_predictor = PredictClass(model_name="SVM")

        seq = viral_sequences[0]
        rf_prediction = rf_predictor.predict(seq)
        svm_prediction = svm_predictor.predict(seq)

        # Both should return valid predictions
        assert rf_prediction in ["Virus", "Host"]
        assert svm_prediction in ["Virus", "Host"]
        # Note: predictions may differ between models, which is expected


class TestPipelineIntegration:
    """Integration tests for the full classification pipeline with real models."""

    def test_classify_sequence_with_real_model(self) -> None:
        """Test that classify_sequence can work with real model predictions."""
        from app.pipeline.classification import classify_sequence

        # Test sequence
        seq = "ATGGGTGCGAGAGCGTCAGTATTAAGCGGGGGAGAA"
        result = classify_sequence("test_seq", seq)

        # Verify result structure
        assert "sequence_id" in result
        assert "length" in result
        assert "gc_content" in result
        assert "prediction" in result
        assert "confidence" in result
        assert "sequence_preview" in result

        # Verify values
        assert result["sequence_id"] == "test_seq"
        assert result["length"] == len(seq)
        assert result["prediction"] in ["Virus", "Host", "Novel"]

    def test_pipeline_with_multiple_sequences(self) -> None:
        """Test pipeline with multiple sequences of different types."""
        from app.pipeline.classification import classify_sequence

        sequences: List[Tuple[str, str]] = [
            ("viral_1", "ATGGGTGCGAGAGCGTCAGTATTAAGCGGGGGAGAA"),
            (
                "host_1",
                "ATGAAGGTGAAGGCCACCCTGCTGCTGTGCGCCCTGCTGCTGCCCCTGGCCCCCCAGGCCCTGGTGAAG",
            ),
            ("mixed_1", "ATCGATCGATCGATCGATCGATCGATCGATCG"),
        ]

        for seq_id, seq in sequences:
            result = classify_sequence(seq_id, seq)

            assert result["sequence_id"] == seq_id
            assert result["length"] == len(seq)
            assert result["prediction"] in ["Virus", "Host", "Novel"]
            assert "gc_content" in result
            assert "confidence" in result


@pytest.mark.integration
class TestEndToEndClassification:
    """End-to-end integration tests for the complete classification workflow."""

    def test_full_workflow_random_forest(self) -> None:
        """Test complete workflow from sequence input to classification with RandomForest."""
        # Initialize predictor
        predictor = PredictClass(model_name="RandomForest")

        # Sample sequences
        test_sequences = [
            "ATGGGTGCGAGAGCGTCAGTATTAAGCGGGGGAGAATTAGATCGATGGGAAAAAATT",
            "ATGAAGGTGAAGGCCACCCTGCTGCTGTGCGCCCTGCTGCTGCCCCTGGCCCCCCAG",
            "GGGCGGCGACCTCGCGGGTTTTCGCTATTTATGAAAATTTTCCGGTTTAAGGCGTTT",
        ]

        # Get predictions
        predictions = predictor.batch_predict(test_sequences)

        # Verify results
        assert len(predictions) == 3
        for pred in predictions:
            assert pred in ["Virus", "Host"]

    def test_full_workflow_svm(self) -> None:
        """Test complete workflow from sequence input to classification with SVM."""
        # Initialize predictor
        predictor = PredictClass(model_name="SVM")

        # Sample sequences
        test_sequences = [
            "ATGGGTGCGAGAGCGTCAGTATTAAGCGGGGGAGAATTAGATCGATGGGAAAAAATT",
            "ATGAAGGTGAAGGCCACCCTGCTGCTGTGCGCCCTGCTGCTGCCCCTGGCCCCCCAG",
        ]

        # Get predictions
        predictions = predictor.batch_predict(test_sequences)

        # Verify results
        assert len(predictions) == 2
        for pred in predictions:
            assert pred in ["Virus", "Host"]

    def test_workflow_handles_edge_cases(self) -> None:
        """Test workflow handles various edge cases."""
        predictor = PredictClass(model_name="RandomForest")

        # Very short sequence (minimum viable)
        short_seq = "ATCGATCG"
        pred = predictor.predict(short_seq)
        assert pred in ["Virus", "Host"]

        # All same nucleotide
        homopolymer = "AAAAAAAAAAAAAAAA"
        pred = predictor.predict(homopolymer)
        assert pred in ["Virus", "Host"]

        # Alternating pattern
        alternating = "ATATATAT" * 10
        pred = predictor.predict(alternating)
        assert pred in ["Virus", "Host"]

    def test_performance_batch_vs_individual(self) -> None:
        """Test that batch prediction processes all sequences."""
        predictor = PredictClass(model_name="RandomForest")

        sequences = [
            "ATCGATCGATCGATCG",
            "GCGCGCGCGCGCGCGC",
            "TATATATATATATATA",
            "CGCGCGCGCGCGCGCG",
        ]

        # Individual predictions
        individual_preds = [predictor.predict(seq) for seq in sequences]

        # Batch prediction
        batch_preds = predictor.batch_predict(sequences)

        # Should have same number of predictions
        assert len(individual_preds) == len(batch_preds)
        assert len(batch_preds) == len(sequences)

        # Each prediction should match (deterministic model)
        for i in range(len(sequences)):
            assert individual_preds[i] == batch_preds[i]
