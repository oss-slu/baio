"""Simple implementations of 7 key prompt techniques."""

import json
import statistics
from typing import Dict, List, Any, TYPE_CHECKING
from .base import PromptTechnique
from .schemas import validate_and_parse, REPORT_JSON_SCHEMA

if TYPE_CHECKING:
    from .base import PromptResult


class RoleTaskConstraints(PromptTechnique):
    """Zero-shot with clear role and constraints."""
    
    def __init__(self, client=None):
        super().__init__("Role+Task+Constraints", client)
    
    def build_messages(self, evidence: Dict[str, Any]) -> List[Dict[str, str]]:
        taxa_str = ', '.join([f"{t[0]} ({t[1]:.2f})" for t in evidence.get('known_taxa', [])])
        
        prompt = f"""You are analyzing metagenomic data for pathogen surveillance.

EVIDENCE:
- Taxa: {taxa_str}
- OOD rate: {evidence.get('ood_rate', 0.0):.3f}
- Sample: {evidence.get('sample_meta', 'Unknown')}

RULES:
- Only report pathogens with confidence ≥ 0.3
- If max confidence < 0.5, report "Inconclusive"
- Output valid JSON only

JSON Schema: {json.dumps(REPORT_JSON_SCHEMA, indent=2)}

Analysis:"""
        
        return [{"role": "user", "content": prompt}]
    
    def postprocess(self, raw_response: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
        return validate_and_parse(raw_response, evidence)


class FewShotContrastive(PromptTechnique):
    """Few-shot with good/bad examples."""
    
    def __init__(self, client=None):
        super().__init__("Few-shot Contrastive", client)
    
    def build_messages(self, evidence: Dict[str, Any]) -> List[Dict[str, str]]:
        taxa_str = ', '.join([f"{t[0]} ({t[1]:.2f})" for t in evidence.get('known_taxa', [])])
        
        prompt = f"""Analyze metagenomic data. Learn from these examples:

GOOD EXAMPLE:
Evidence: SARS-CoV-2 (0.75), Human (0.20), OOD: 0.03
Output: {{"summary": "SARS-CoV-2 detected with high confidence", "known_pathogens": [{{"taxon": "SARS-CoV-2", "confidence": 0.75}}], "ood_rate": 0.03, "caveats": ["Single sample", "Confirmation needed"]}}

BAD EXAMPLE (don't do this):
Evidence: Unknown virus (0.15), Human (0.80), OOD: 0.30
Bad Output: {{"summary": "Novel pathogen detected"}}
Correct: {{"summary": "Inconclusive - low confidence", "known_pathogens": [], "ood_rate": 0.30, "caveats": ["Low confidence", "High OOD rate"]}}

NOW ANALYZE:
- Taxa: {taxa_str}
- OOD: {evidence.get('ood_rate', 0.0):.3f}

JSON output:"""
        
        return [{"role": "user", "content": prompt}]
    
    def postprocess(self, raw_response: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
        return validate_and_parse(raw_response, evidence)


class StructuredJSONGuard(PromptTechnique):
    """Strict schema enforcement."""
    
    def __init__(self, client=None):
        super().__init__("Structured JSON Guard", client)
    
    def build_messages(self, evidence: Dict[str, Any]) -> List[Dict[str, str]]:
        taxa_str = ', '.join([f"{t[0]} ({t[1]:.2f})" for t in evidence.get('known_taxa', [])])
        
        prompt = f"""CRITICAL: Output EXACTLY valid JSON. No extra text.

Schema: {json.dumps(REPORT_JSON_SCHEMA)}

Evidence: {taxa_str}, OOD: {evidence.get('ood_rate', 0.0):.3f}

If uncertain, use: {{"summary": "Inconclusive", "known_pathogens": [], "ood_rate": {evidence.get('ood_rate', 0.0)}, "caveats": ["Insufficient evidence"]}}

JSON:"""
        
        return [{"role": "user", "content": prompt}]
    
    def postprocess(self, raw_response: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
        return validate_and_parse(raw_response, evidence)


class RAGLite(PromptTechnique):
    """Context injection with pipeline info."""
    
    def __init__(self, client=None):
        super().__init__("RAG-lite", client)
    
    def build_messages(self, evidence: Dict[str, Any]) -> List[Dict[str, str]]:
        taxa_str = ', '.join([f"{t[0]} ({t[1]:.2f})" for t in evidence.get('known_taxa', [])])
        
        prompt = f"""PIPELINE CONTEXT:
- Confidence threshold: 0.3
- OOD warning level: 0.15
- Method: Metagenomic classification
- Database: RefSeq + custom

SAMPLE:
- Taxa: {taxa_str}
- OOD rate: {evidence.get('ood_rate', 0.0):.3f}
- Info: {evidence.get('sample_meta', 'Unknown')}

ANALYSIS NOTES:
- OOD > 0.15 suggests novel sequences
- Environmental samples may have non-viable DNA
- Single-sample limitations apply

Provide conservative JSON analysis:"""
        
        return [{"role": "user", "content": prompt}]
    
    def postprocess(self, raw_response: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
        return validate_and_parse(raw_response, evidence)


class SelfConsistency(PromptTechnique):
    """Multiple samples with aggregation."""
    
    def __init__(self, base_technique=None, n_samples=3, client=None):
        super().__init__("Self-Consistency", client)
        self.base_technique = base_technique or RoleTaskConstraints(client)
        self.n_samples = n_samples
    
    def build_messages(self, evidence: Dict[str, Any]) -> List[Dict[str, str]]:
        return self.base_technique.build_messages(evidence)
    
    def postprocess(self, raw_response: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
        return validate_and_parse(raw_response, evidence)
    
    def run(self, evidence: Dict[str, Any], temperature: float = 0.7):
        """Run multiple samples and aggregate."""
        from .base import PromptResult
        
        result = PromptResult(self.name, evidence)
        sub_results = []
        
        # Get multiple results
        for _ in range(self.n_samples):
            sub_result = self.base_technique.run(evidence, temperature=temperature)
            if sub_result['valid']:
                sub_results.append(sub_result['json'])
        
        if not sub_results:
            from .schemas import create_inconclusive_report
            result['raw'] = f"All {self.n_samples} samples failed"
            result['json'] = create_inconclusive_report("Consensus failed")
            result['valid'] = True
            result['errors'] = ["No valid samples for consensus"]
            return result
        
        # Simple aggregation: majority vote + median confidence
        pathogen_votes = {}
        for sub_json in sub_results:
            for pathogen in sub_json.get('known_pathogens', []):
                taxon = pathogen['taxon']
                if taxon not in pathogen_votes:
                    pathogen_votes[taxon] = []
                pathogen_votes[taxon].append(pathogen['confidence'])
        
        # Keep pathogens detected in majority of samples
        consensus_pathogens = []
        majority_threshold = len(sub_results) / 2
        
        for taxon, confidences in pathogen_votes.items():
            if len(confidences) > majority_threshold:
                consensus_pathogens.append({
                    'taxon': taxon,
                    'confidence': statistics.median(confidences)
                })
        
        consensus_result = {
            'summary': f"Consensus from {len(sub_results)} samples",
            'known_pathogens': consensus_pathogens,
            'ood_rate': statistics.median([r.get('ood_rate', 0) for r in sub_results]),
            'caveats': [f"Consensus from {len(sub_results)} samples", "Multiple sampling analysis"]
        }
        
        result['raw'] = f"Aggregated from {len(sub_results)} valid samples"
        result['json'] = consensus_result
        result['valid'] = True
        result['latency_s'] = sum(sr.get('latency_s', 0) for sr in sub_results if isinstance(sr, dict))
        
        return result


class ChainOfVerification(PromptTechnique):
    """Two-step analysis with verification."""
    
    def __init__(self, client=None):
        super().__init__("Chain-of-Verification", client)
    
    def build_messages(self, evidence: Dict[str, Any]) -> List[Dict[str, str]]:
        taxa_str = ', '.join([f"{t[0]} ({t[1]:.2f})" for t in evidence.get('known_taxa', [])])
        
        prompt = f"""Two-step analysis:

STEP 1 - Initial Analysis:
Evidence: {taxa_str}, OOD: {evidence.get('ood_rate', 0.0):.3f}
Provide initial pathogen assessment.

STEP 2 - Verification:
Check your analysis:
- Do confidences meet ≥0.3 threshold?
- Are taxon names exact matches?
- Is OOD rate ({evidence.get('ood_rate', 0.0):.3f}) concerning?
- Are claims conservative enough?

STEP 3 - Final JSON:
Provide verified analysis as JSON."""
        
        return [{"role": "user", "content": prompt}]
    
    def postprocess(self, raw_response: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
        return validate_and_parse(raw_response, evidence)


class CritiqueAndRevise(PromptTechnique):
    """Two-pass with reviewer."""
    
    def __init__(self, client=None):
        super().__init__("Critique-and-Revise", client)
    
    def run(self, evidence: Dict[str, Any], temperature: float = 0.3):
        """Two-stage process with critique."""
        from .base import PromptResult
        
        if self.client is None:
            from .client import LLMClient
            self.client = LLMClient()
        
        result = PromptResult(self.name, evidence)
        
        try:
            # Stage 1: Initial analysis
            initial_messages = self._build_initial_messages(evidence)
            initial_response = self.client.chat(initial_messages, temperature=temperature)
            
            # Stage 2: Critique and revise
            critique_messages = self._build_critique_messages(initial_response['content'], evidence)
            final_response = self.client.chat(critique_messages, temperature=temperature)
            
            # Parse final response
            parsed = validate_and_parse(final_response['content'], evidence)
            
            result['raw'] = final_response['content']
            result['json'] = parsed['json']
            result['valid'] = parsed['valid']
            result['errors'] = parsed['errors']
            result['latency_s'] = initial_response['latency_s'] + final_response['latency_s']
            
        except Exception as e:
            result['errors'].append(str(e))
            result['valid'] = False
        
        return result
    
    def _build_initial_messages(self, evidence):
        taxa_str = ', '.join([f"{t[0]} ({t[1]:.2f})" for t in evidence.get('known_taxa', [])])
        prompt = f"Analyze: {taxa_str}, OOD: {evidence.get('ood_rate', 0.0):.3f}. Provide JSON pathogen analysis."
        return [{"role": "user", "content": prompt}]
    
    def _build_critique_messages(self, initial_analysis, evidence):
        prompt = f"""Initial analysis: {initial_analysis}

Reviewer critique:
- Is this too confident for the evidence strength?
- Are caveats adequate?
- Any overclaiming?

Provide improved JSON analysis:"""
        return [{"role": "user", "content": prompt}]
    
    def build_messages(self, evidence: Dict[str, Any]) -> List[Dict[str, str]]:
        return self._build_initial_messages(evidence)
    
    def postprocess(self, raw_response: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
        return validate_and_parse(raw_response, evidence)


# Simple registry
def get_all_techniques(client=None):
    return {
        'role_task_constraints': RoleTaskConstraints(client),
        'few_shot_contrastive': FewShotContrastive(client),
        'structured_json_guard': StructuredJSONGuard(client),
        'rag_lite': RAGLite(client),
        'self_consistency': SelfConsistency(client=client),
        'chain_of_verification': ChainOfVerification(client),
        'critique_and_revise': CritiqueAndRevise(client)
    }