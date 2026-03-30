import re
from typing import Set, Tuple

# IUPAC nucleotide codes
VALID_NUCLEOTIDES: Set[str] = set("ATGCNRYSWKMBDHV")
DNA_PATTERN = re.compile(r"^[ATGCNRYSWKMBDHV]+$", re.IGNORECASE)

MAX_SEQ_LENGTH = 3_000_000_000  # 3GB max per sequence


def validate_dna_sequence(sequence: str, seq_id: str = "") -> Tuple[bool, str]:
    """Validate if a DNA sequence is likely valid.

    Returns:
        (True, "") if valid, otherwise (False, reason string)
    """
    if not sequence or not sequence.strip():
        return False, "Empty sequence provided"

    # Clean sequence: remove whitespace and newlines
    clean_seq = sequence.upper().translate({ord(c): None for c in " \n\r\t"})

    # Check sequence length
    if len(clean_seq) < 10:
        return False, f"Sequence too short ({len(clean_seq)}bp). Minimum 10bp required"
    if len(clean_seq) > MAX_SEQ_LENGTH:
        return (
            False,
            f"Sequence too long ({len(clean_seq)}bp). Maximum {MAX_SEQ_LENGTH}bp allowed",
        )

    # Check invalid characters
    invalid_chars = set(clean_seq) - VALID_NUCLEOTIDES
    if invalid_chars:
        return (
            False,
            f"Invalid characters found: {', '.join(sorted(invalid_chars))}. Only DNA nucleotides (A,T,G,C,N,R,Y,S,W,K,M,B,D,H,V) allowed",
        )

    # Regex validation
    if not DNA_PATTERN.fullmatch(clean_seq):
        return False, "Sequence contains non-DNA characters"

    # Check GC and AT content extremes
    gc_content = (clean_seq.count("G") + clean_seq.count("C")) / len(clean_seq)
    at_content = (clean_seq.count("A") + clean_seq.count("T")) / len(clean_seq)
    if gc_content in (0, 1):
        return False, "Invalid sequence: 0% or 100% GC content indicates non-DNA data"
    if at_content > 0.9:
        return False, "Invalid sequence: >90% A/T content suggests non-DNA data"
    if gc_content > 0.9:
        return False, "Invalid sequence: >90% G/C content suggests non-DNA data"

    # Check ratio of standard DNA bases (A,T,G,C)
    valid_bases = sum(1 for c in clean_seq if c in "ATGC")
    valid_ratio = valid_bases / len(clean_seq)
    if valid_ratio < 0.85:
        return (
            False,
            f"Invalid sequence: Only {valid_ratio * 100:.0f}% are valid DNA bases (A,T,G,C). Expected >85%",
        )

    return True, ""
