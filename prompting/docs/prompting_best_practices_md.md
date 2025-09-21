# Best Practices for Pathogen Detection Prompts

## Core Principles
- **Conservative**: Default to "Inconclusive" when uncertain
- **Evidence-based**: Only claim what the data supports
- **Structured**: Always require valid JSON output
- **Safety-first**: Include caveats, no medical diagnosis

## Confidence Guidelines
- High (≥0.7): "Strong signal detected"
- Medium (0.3-0.7): "Moderate confidence"
- Low (<0.3): "Inconclusive"

## Required JSON Schema
```json
{
  "summary": "string",
  "known_pathogens": [{"taxon": "string", "confidence": 0.0}],
  "ood_rate": 0.0,
  "caveats": ["string"]
}
```

## OOD Rate Handling
- Normal (0-0.1): Proceed normally  
- Elevated (0.1-0.25): Increase confidence threshold
- High (>0.25): Require very high confidence or report inconclusive

## Safety Rules
- Never claim medical diagnosis
- Always include uncertainty caveats
- Don't invent pathogen names
- Flag high OOD rates as concerning