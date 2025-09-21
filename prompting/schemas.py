"""JSON schemas and validation."""

import json
import re
from typing import Dict, Any, Tuple, Optional


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


def extract_json_from_text(text: str) -> Tuple[Optional[Dict], list]:
    """Extract first JSON object from text."""
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
    return None, errors


def validate_report_schema(data: Dict[str, Any]) -> Tuple[bool, list]:
    """Basic schema validation."""
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
    
    return len(errors) == 0, errors


def create_inconclusive_report(reason: str = "Analysis failed") -> Dict[str, Any]:
    """Create fallback inconclusive report."""
    return {
        "summary": "Inconclusive - insufficient evidence",
        "known_pathogens": [],
        "ood_rate": 0.0,
        "caveats": [reason, "Additional validation recommended"]
    }


def validate_and_parse(raw_response: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
    """Complete parsing and validation pipeline."""
    result = {'json': {}, 'valid': False, 'errors': []}
    
    # Extract JSON
    extracted, extraction_errors = extract_json_from_text(raw_response)
    result['errors'].extend(extraction_errors)
    
    if extracted is None:
        # Fallback to inconclusive
        result['json'] = create_inconclusive_report("JSON parsing failed")
        result['valid'] = True
        return result
    
    # Validate schema
    is_valid, validation_errors = validate_report_schema(extracted)
    result['errors'].extend(validation_errors)
    
    result['json'] = extracted
    result['valid'] = is_valid
    
    return result