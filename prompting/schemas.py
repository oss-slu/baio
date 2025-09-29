"""JSON schemas and validation."""

import json
import re
from typing import Dict, Any, Tuple, Optional, List
from .types import Report
from . import logging as plog


REPORT_JSON_SCHEMA = {
    "type": "object",
    "required": ["summary", "known_pathogens", "ood_rate", "caveats"],
    "properties": {
        "summary": {"type": "string"},
        "known_pathogens": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["taxon", "confidence"],
                "properties": {
                    "taxon": {"type": "string"},
                    "confidence": {"type": "number", "minimum": 0, "maximum": 1}
                }
            }
        },
        "ood_rate": {"type": "number", "minimum": 0, "maximum": 1},
        "caveats": {"type": "array", "items": {"type": "string"}}
    }
}


def extract_json_from_text(text: str) -> Tuple[Optional[Dict[str, Any]], List[str]]:
    """Extract the first JSON object found in a text blob.

    Returns a tuple (parsed_dict or None, errors list).
    """
    errors = []
    
    # Try direct parse
    try:
        return json.loads(text.strip()), []
    except json.JSONDecodeError:
        pass
    
    # Look for JSON blocks
    json_pattern = r'\{.*?\}'
    matches = re.findall(json_pattern, text, re.DOTALL)
    
    for match in matches:
        try:
            parsed = json.loads(match)
            if isinstance(parsed, dict):
                return parsed, []
        except json.JSONDecodeError:
            continue
    
    errors.append("No valid JSON found")
    plog.info("json_extraction_failed", text_preview=text[:120])
    return None, errors


def validate_report_schema(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """Validate a parsed report dict against minimal schema rules.

    Returns (is_valid, errors).
    """
    errors = []
    
    required_fields = ["summary", "known_pathogens", "ood_rate", "caveats"]
    for field in required_fields:
        if field not in data:
            errors.append(f"Missing required field: {field}")
    
    # Type checks
    if "summary" in data and not isinstance(data["summary"], str):
        errors.append("summary must be string")
    
    if "known_pathogens" in data and not isinstance(data["known_pathogens"], list):
        errors.append("known_pathogens must be array")
    
    if "ood_rate" in data:
        ood = data["ood_rate"]
        if not isinstance(ood, (int, float)) or not (0 <= ood <= 1):
            errors.append("ood_rate must be number 0-1")
    
    if "caveats" in data and not isinstance(data["caveats"], list):
        errors.append("caveats must be array")
    
    ok = len(errors) == 0
    if not ok:
        plog.info("schema_validation_failed", errors=errors)
    return ok, errors


def create_inconclusive_report(reason: str = "Analysis failed") -> Report:
    """Return a simple inconclusive report dict with a reason.

    This is used as a safe fallback when parsing fails.
    """
    return {
        "summary": "Inconclusive - insufficient evidence",
        "known_pathogens": [],
        "ood_rate": 0.0,
        "caveats": [reason, "Additional validation recommended"]
    }


def validate_and_parse(raw_response: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
    """Extract JSON from raw_response and validate it against schema.

    Returns {'json': ..., 'valid': bool, 'errors': [...]}.
    """
    result = {'json': {}, 'valid': False, 'errors': []}
    
    # Extract JSON
    extracted, extraction_errors = extract_json_from_text(raw_response)
    result['errors'].extend(extraction_errors)
    
    if extracted is None:
        # Fallback to inconclusive
        plog.error("parsing_failed", reason="no_json", preview=raw_response[:120])
        result['json'] = create_inconclusive_report("JSON parsing failed")
        result['valid'] = True
        return result
    
    # Validate schema
    is_valid, validation_errors = validate_report_schema(extracted)
    result['errors'].extend(validation_errors)
    
    result['json'] = extracted
    result['valid'] = is_valid
    if not is_valid:
        plog.error("validation_errors", errors=validation_errors)
    
    return result