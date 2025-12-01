"""FASTA and FASTQ file parsing utilities."""

from typing import List, Tuple, Any
import logging

logger = logging.getLogger(__name__)


def parse_fasta_text(text: str) -> List[Tuple[str, str]]:
    """
    Parse FASTA format text input.

    Args:
        text: FASTA formatted text

    Returns:
        List of (sequence_id, sequence) tuples
    """
    sequences: List[Tuple[str, str]] = []
    current_id: str = ""
    current_seq = ""

    lines = text.strip().split("\n")
    for line in lines:
        line = line.strip()
        if line.startswith(">"):
            if current_id:
                sequences.append((current_id, current_seq))
            current_id = line[1:]  # Remove '>'
            current_seq = ""
        elif line:
            current_seq += line.upper()

    # Add last sequence
    if current_id:
        sequences.append((current_id, current_seq))

    return sequences


def parse_fastq_content(content: str) -> List[Tuple[str, str]]:
    """
    Parse FASTQ format content.

    Args:
        content: FASTQ formatted text

    Returns:
        List of (sequence_id, sequence) tuples
    """
    sequences = []
    lines = content.strip().split("\n")

    for i in range(0, len(lines), 4):
        if i + 3 < len(lines):
            seq_id = lines[i][1:]  # Remove '@'
            sequence = lines[i + 1].upper()
            sequences.append((seq_id, sequence))

    return sequences


def parse_uploaded_file(uploaded_file: Any) -> List[Tuple[str, str]]:
    """
    Parse uploaded FASTA/FASTQ file.

    Args:
        uploaded_file: Streamlit uploaded file object

    Returns:
        List of (sequence_id, sequence) tuples
    """
    try:
        # Read file content
        content = uploaded_file.read().decode("utf-8")

        if uploaded_file.name.endswith((".fastq", ".fq")):
            return parse_fastq_content(content)
        else:
            return parse_fasta_text(content)
    except Exception as e:
        logger.error("Error parsing file %s: %s", getattr(uploaded_file, "name", ""), e)
        return []
