import json
from prompting import compare


def test_run_all_writes_file(tmp_path, monkeypatch):
    evidence = {"known_taxa": [["SARS-CoV-2", 0.8]], "ood_rate": 0.03}
    out_dir = tmp_path / "out"
    # Ensure directory is used
    out_file = compare.run_all(evidence, out_dir=str(out_dir))

    assert out_file is not None
    with open(out_file, 'r') as f:
        data = json.load(f)

    assert 'technique_results' in data
    assert 'summary' in data
    assert data['summary']['total_techniques'] >= 1


def test_run_all_with_empty_evidence(tmp_path):
    evidence = {}
    out_dir = tmp_path / "out2"
    out_file = compare.run_all(evidence, out_dir=str(out_dir))
    with open(out_file) as f:
        data = json.load(f)
    assert 'technique_results' in data
    # With empty evidence, some techniques may still run but success_rate should be a number
    assert isinstance(data['summary']['success_rate'], float)
