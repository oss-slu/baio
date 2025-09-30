import json
from prompting import schemas


def test_extract_json_from_text_direct():
    text = '{"a": 1, "b": "x"}'
    parsed, errs = schemas.extract_json_from_text(text)
    assert errs == []
    assert parsed == {"a": 1, "b": "x"}


def test_extract_json_from_text_embedded():
    text = 'Some text {"summary": "ok", "ood_rate": 0.1} trailing'
    parsed, errs = schemas.extract_json_from_text(text)
    assert errs == []
    assert parsed is not None and 'summary' in parsed


def test_validate_report_schema_and_inconclusive():
    good = {
        "summary": "Sth",
        "known_pathogens": [{"taxon": "T", "confidence": 0.5}],
        "ood_rate": 0.01,
        "caveats": ["note"]
    }
    ok, errors = schemas.validate_report_schema(good)
    assert ok is True
    assert errors == []

    bad = {"summary": 1}
    ok2, errs2 = schemas.validate_report_schema(bad)
    assert ok2 is False
    assert any('Missing required field' in e for e in errs2)


def test_create_inconclusive_and_validate_and_parse():
    incon = schemas.create_inconclusive_report('reason')
    assert incon['known_pathogens'] == []

    raw = json.dumps(incon)
    result = schemas.validate_and_parse(raw, evidence={})
    assert result['valid'] is True
    assert isinstance(result['json'], dict)


def test_validate_and_parse_no_json():
    raw = 'no json here, just text'
    result = schemas.validate_and_parse(raw, evidence={})
    # Fallback returns an inconclusive report and marks valid True (fallback)
    assert result['valid'] is True
    assert 'Inconclusive' in result['json']['summary'] or 'insufficient' in result['json']['summary'].lower()
    assert isinstance(result['errors'], list)
