"""Tests for data parsing utilities."""

import pytest
from app.data.parsers import parse_fasta_text, parse_fastq_content, parse_uploaded_file
from app.data.validators import validate_input, validate_sequence, validate_fasta_format


class TestFASTAParsing:
    """Test FASTA format parsing functions."""
    
    def test_parse_fasta_text_single_sequence(self):
        """Test parsing a single FASTA sequence."""
        fasta_text = ">seq1\nATCGATCGATCG"
        result = parse_fasta_text(fasta_text)
        
        assert len(result) == 1
        assert result[0][0] == "seq1"
        assert result[0][1] == "ATCGATCGATCG"
    
    def test_parse_fasta_text_multiple_sequences(self):
        """Test parsing multiple FASTA sequences."""
        fasta_text = """>seq1
ATCGATCGATCG
>seq2
GCTAGCTAGCTA"""
        result = parse_fasta_text(fasta_text)
        
        assert len(result) == 2
        assert result[0] == ("seq1", "ATCGATCGATCG")
        assert result[1] == ("seq2", "GCTAGCTAGCTA")
    
    def test_parse_fasta_text_multiline_sequence(self):
        """Test parsing FASTA with multiline sequences."""
        fasta_text = """>seq1
ATCGATCG
ATCGATCG
>seq2
GCTAGCTA
GCTAGCTA"""
        result = parse_fasta_text(fasta_text)
        
        assert len(result) == 2
        assert result[0][1] == "ATCGATCGATCGATCG"
        assert result[1][1] == "GCTAGCTAGCTAGCTA"
    
    def test_parse_fasta_text_empty_input(self):
        """Test parsing empty FASTA input."""
        result = parse_fasta_text("")
        assert len(result) == 0
    
    def test_parse_fasta_text_no_sequences(self):
        """Test parsing FASTA with headers but no sequences."""
        fasta_text = ">seq1\n>seq2"
        result = parse_fasta_text(fasta_text)
        
        assert len(result) == 2
        assert result[0][1] == ""
        assert result[1][1] == ""


class TestFASTQParsing:
    """Test FASTQ format parsing functions."""
    
    def test_parse_fastq_content_single_read(self):
        """Test parsing a single FASTQ read."""
        fastq_text = """@seq1
ATCGATCGATCG
+
IIIIIIIIIIII"""
        result = parse_fastq_content(fastq_text)
        
        assert len(result) == 1
        assert result[0][0] == "seq1"
        assert result[0][1] == "ATCGATCGATCG"
    
    def test_parse_fastq_content_multiple_reads(self):
        """Test parsing multiple FASTQ reads."""
        fastq_text = """@seq1
ATCGATCGATCG
+
IIIIIIIIIIII
@seq2
GCTAGCTAGCTA
+
JJJJJJJJJJJJ"""
        result = parse_fastq_content(fastq_text)
        
        assert len(result) == 2
        assert result[0] == ("seq1", "ATCGATCGATCG")
        assert result[1] == ("seq2", "GCTAGCTAGCTA")
    
    def test_parse_fastq_content_incomplete_read(self):
        """Test parsing incomplete FASTQ read."""
        fastq_text = """@seq1
ATCGATCGATCG
+"""
        result = parse_fastq_content(fastq_text)
        
        assert len(result) == 0


class TestValidation:
    """Test input validation functions."""
    
    def test_validate_input_valid(self):
        """Test valid input validation."""
        is_valid, error = validate_input("This is a valid input")
        assert is_valid is True
        assert error is None
    
    def test_validate_input_empty(self):
        """Test empty input validation."""
        is_valid, error = validate_input("")
        assert is_valid is False
        assert "enter a message" in error.lower()
    
    def test_validate_input_whitespace_only(self):
        """Test whitespace-only input validation."""
        is_valid, error = validate_input("   ")
        assert is_valid is False
        assert "enter a message" in error.lower()
    
    def test_validate_input_too_long(self):
        """Test overly long input validation."""
        long_input = "x" * 2001
        is_valid, error = validate_input(long_input)
        assert is_valid is False
        assert "too long" in error.lower()
    
    def test_validate_sequence_valid_dna(self):
        """Test valid DNA sequence validation."""
        is_valid, error = validate_sequence("ATCGATCGATCG")
        assert is_valid is True
        assert error is None
    
    def test_validate_sequence_with_n(self):
        """Test DNA sequence with N bases."""
        is_valid, error = validate_sequence("ATCGATNGATCG")
        assert is_valid is True
        assert error is None
    
    def test_validate_sequence_invalid_characters(self):
        """Test DNA sequence with invalid characters."""
        is_valid, error = validate_sequence("ATCGATXGATCG")
        assert is_valid is False
        assert "invalid characters" in error.lower()
    
    def test_validate_sequence_too_short(self):
        """Test DNA sequence that's too short."""
        is_valid, error = validate_sequence("ATCG")
        assert is_valid is False
        assert "too short" in error.lower()
    
    def test_validate_sequence_empty(self):
        """Test empty DNA sequence."""
        is_valid, error = validate_sequence("")
        assert is_valid is False
        assert "empty" in error.lower()
    
    def test_validate_fasta_format_valid(self):
        """Test valid FASTA format validation."""
        fasta_text = ">seq1\nATCGATCGATCG"
        is_valid, error = validate_fasta_format(fasta_text)
        assert is_valid is True
        assert error is None
    
    def test_validate_fasta_format_no_header(self):
        """Test FASTA format without header."""
        fasta_text = "ATCGATCGATCG"
        is_valid, error = validate_fasta_format(fasta_text)
        assert is_valid is False
        assert "header" in error.lower()
    
    def test_validate_fasta_format_no_sequence(self):
        """Test FASTA format with header but no sequence."""
        fasta_text = ">seq1"
        is_valid, error = validate_fasta_format(fasta_text)
        assert is_valid is False
        assert "no sequence" in error.lower()
    
    def test_validate_fasta_format_empty(self):
        """Test empty FASTA format."""
        is_valid, error = validate_fasta_format("")
        assert is_valid is False
        assert "no input" in error.lower()


if __name__ == "__main__":
    pytest.main([__file__])