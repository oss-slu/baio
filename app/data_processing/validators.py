"""Input validation utilities."""

from typing import Tuple, Optional


def validate_input(user_input: str) -> Tuple[bool, Optional[str]]:
    """
    Validate user input.

    Args:
        user_input: User input string to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not user_input or user_input.strip() == "":
        return False, "Please enter a message."

    if len(user_input) > 2000:
        return False, "Message is too long. Please keep it under 2000 characters."

    return True, None


def validate_sequence(sequence: str) -> Tuple[bool, Optional[str]]:
    """
    Validate DNA sequence format.

    Args:
        sequence: DNA sequence string

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not sequence:
        return False, "Sequence is empty."

    # Check for valid DNA bases
    valid_bases = set("ATCGN")
    sequence_upper = sequence.upper()

    invalid_chars = set(sequence_upper) - valid_bases
    if invalid_chars:
        return False, f"Invalid characters in sequence: {', '.join(invalid_chars)}"

    if len(sequence) < 10:
        return False, "Sequence too short (minimum 10 bases)."

    return True, None


def validate_fasta_format(text: str) -> Tuple[bool, Optional[str]]:
    """
    Validate FASTA format text.

    Args:
        text: FASTA formatted text

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not text.strip():
        return False, "No input provided."

    lines = text.strip().split("\n")

    # Must start with header
    if not lines[0].startswith(">"):
        return False, "FASTA format must start with header line (>)."

    has_sequence = False
    for line in lines[1:]:
        if line.strip() and not line.startswith(">"):
            has_sequence = True
            break

    if not has_sequence:
        return False, "No sequence data found."

    return True, None

"""Input validation utilities."""

from typing import Tuple, Optional


def validate_input(user_input: str) -> Tuple[bool, Optional[str]]:
    """
    Validate user input.

    Args:
        user_input: User input string to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not user_input or user_input.strip() == "":
        return False, "Please enter a message."

    if len(user_input) > 2000:
        return False, "Message is too long. Please keep it under 2000 characters."

    return True, None


def validate_sequence(sequence: str) -> Tuple[bool, Optional[str]]:
    """
    Validate DNA sequence format.

    Args:
        sequence: DNA sequence string

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not sequence:
        return False, "Sequence is empty."

    # Check for valid DNA bases
    valid_bases = set("ATCGN")
    sequence_upper = sequence.upper()

    invalid_chars = set(sequence_upper) - valid_bases
    if invalid_chars:
        return False, f"Invalid characters in sequence: {', '.join(invalid_chars)}"

    if len(sequence) < 10:
        return False, "Sequence too short (minimum 10 bases)."

    return True, None


def validate_fasta_format(text: str) -> Tuple[bool, Optional[str]]:
    """
    Validate FASTA format text.

    Args:
        text: FASTA formatted text

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not text.strip():
        return False, "No input provided."

    lines = text.strip().split("\n")

    # Must start with header
    if not lines[0].startswith(">"):
        return False, "FASTA format must start with header line (>)."

    has_sequence = False
    for line in lines[1:]:
        if line.strip() and not line.startswith(">"):
            has_sequence = True
            break

    if not has_sequence:
        return False, "No sequence data found."

    return True, None
