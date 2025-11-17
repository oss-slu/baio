from typing import Iterable, List, Tuple, Optional
import os


def _read_text(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def load_fasta(path: str) -> List[Tuple[str, str]]:
    text = _read_text(path)
    sequences: List[Tuple[str, str]] = []
    current_id = ""
    current_seq = ""
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith(">"):
            if current_id:
                sequences.append((current_id, current_seq))
            current_id = line[1:]
            current_seq = ""
        else:
            current_seq += line.upper()
    if current_id:
        sequences.append((current_id, current_seq))
    return sequences


essential_fastq_mod = 4


def load_fastq(path: str) -> List[Tuple[str, str]]:
    text = _read_text(path)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    sequences: List[Tuple[str, str]] = []
    for i in range(0, len(lines), essential_fastq_mod):
        if i + 1 < len(lines) and lines[i].startswith("@"):
            seq_id = lines[i][1:]
            seq = lines[i + 1].upper()
            sequences.append((seq_id, seq))
    return sequences


def load_sequences(path: str) -> List[Tuple[str, str]]:
    ext = os.path.splitext(path)[1].lower()
    if ext in (".fq", ".fastq"):
        return load_fastq(path)
    return load_fasta(path)


def filter_sequences(
    seqs: Iterable[Tuple[str, str]],
    min_len: int = 1,
    max_len: Optional[int] = None,
    allowed_chars: Optional[str] = "ACGTN",
) -> List[Tuple[str, str]]:
    out: List[Tuple[str, str]] = []
    allowed = set(allowed_chars) if allowed_chars is not None else None
    for sid, s in seqs:
        if len(s) < min_len:
            continue
        if max_len is not None and len(s) > max_len:
            continue
        if allowed is not None and any(c not in allowed for c in s.upper()):
            continue
        out.append((sid, s))
    return out
