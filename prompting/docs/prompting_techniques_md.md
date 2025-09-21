# Prompting Techniques for Pathogen Detection

## 1. Role + Task + Constraints (Zero-shot)
**Purpose**: Clear baseline with explicit rules
**Example**:
```
You are analyzing metagenomic data for pathogen surveillance.
- Only report pathogens with confidence ≥ 0.3
- If max confidence < 0.5, say "Inconclusive" 
- Output valid JSON only
```

## 2. Few-shot with Examples
**Purpose**: Show good vs bad analysis
**Example**:
```
Good: SARS-CoV-2 (0.8) → "High confidence SARS-CoV-2 detected"
Bad: Unknown (0.2) → Don't claim "novel pathogen"
Correct: "Inconclusive - low confidence"
```

## 3. Structured JSON Guard
**Purpose**: Force schema compliance
**Example**: Include exact JSON schema in prompt, validate output

## 4. RAG-lite (Evidence Injection)
**Purpose**: Add pipeline context
**Example**: Include thresholds, sample metadata, QC status in prompt

## 5. Self-Consistency
**Purpose**: Run same prompt N times, aggregate results
**Example**: 3 runs → take median confidence, majority vote on detection

## 6. Chain-of-Verification
**Purpose**: Generate analysis, then verify each claim
**Example**: Draft → "Check: confidence 0.6 meets threshold? Yes" → Final

## 7. Critique-and-Revise
**Purpose**: Two-pass with reviewer
**Example**: Initial analysis → Reviewer critique → Revised output