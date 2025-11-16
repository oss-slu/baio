from metaseq.dataio import load_fasta, load_fastq, load_sequences, filter_sequences


def test_load_fasta(tmp_path):
    fasta = ">seq1\nACGTN\n>seq2\naaaaccc\n"
    p = tmp_path / "test.fasta"
    p.write_text(fasta)
    seqs = load_fasta(str(p))
    assert seqs == [("seq1", "ACGTN"), ("seq2", "AAAACCC")]


def test_load_fastq(tmp_path):
    fastq = "@id1\nACGT\n+\n!!!!\n@id2\nTTTT\n+\n!!!!\n"
    p = tmp_path / "test.fastq"
    p.write_text(fastq)
    seqs = load_fastq(str(p))
    assert seqs == [("id1", "ACGT"), ("id2", "TTTT")]


def test_load_sequences_dispatch(tmp_path):
    fasta = ">a\nACG\n"
    fastq = "@b\nTTT\n+\n!!!\n"
    pf = tmp_path / "a.fasta"
    pq = tmp_path / "b.fastq"
    pf.write_text(fasta)
    pq.write_text(fastq)
    assert load_sequences(str(pf))[0][0] == "a"
    assert load_sequences(str(pq))[0][0] == "b"


def test_filter_sequences():
    seqs = [("x", "NNACGTX"), ("y", "AC"), ("z", "ACGT")]
    out = filter_sequences(seqs, min_len=3, allowed_chars="ACGTN")
    # 'x' removed due to invalid char X; 'y' removed due to length; 'z' kept
    assert out == [("z", "ACGT")]
