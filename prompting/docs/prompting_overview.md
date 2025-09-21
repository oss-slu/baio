# BAIO Prompting Framework - Getting Started

Simple framework for testing prompt techniques with pathogen detection.

## Quick Start

```bash
# Run with mock mode 
python scripts/prompt_compare.py
```

## Structure

```
prompting/
├── client.py          # LLM client 
├── base.py           # Base classes
├── schemas.py        # JSON validation
├── techniques.py     # 7 prompt techniques
├── compare.py        # Run all techniques
└── examples/
    └── sample_inputs.jsonl

scripts/
└── prompt_compare.py  # Simple runner
```

## Environment Variables

```bash
# framework runs in mock mode without these
export LLM_API_KEY="your-key"
export LLM_MODEL="gpt-4"
```

## Example Usage

```python
from prompting.techniques import RoleTaskConstraints
from prompting.client import LLMClient

evidence = {
    "known_taxa": [["SARS-CoV-2", 0.65], ["Human", 0.25]],
    "ood_rate": 0.05,
    "sample_meta": "Test sample"
}

client = LLMClient()  # Auto-detects mock mode
technique = RoleTaskConstraints(client)
result = technique.run(evidence)

print(f"Valid: {result['valid']}")
print(f"Summary: {result['json'].get('summary', 'N/A')}")
```

## Adding New Techniques

1. Inherit from `PromptTechnique`
2. Implement `build_messages()` and `postprocess()`
3. Add to techniques registry

```python
class MyTechnique(PromptTechnique):
    def build_messages(self, evidence):
        prompt = f"Analyze: {evidence}"
        return [{"role": "user", "content": prompt}]
    
    def postprocess(self, raw_response, evidence):
        return validate_and_parse(raw_response, evidence)
```

## Output Format

All techniques return:

```json
{
  "summary": "Analysis result",
  "known_pathogens": [{"taxon": "SARS-CoV-2", "confidence": 0.65}],
  "ood_rate": 0.05,
  "caveats": ["Single sample", "Confirmation needed"]
}
```

Ready to extend as the project grows!