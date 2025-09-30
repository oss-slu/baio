"""Simple implementations of 7 key prompt techniques."""

import json
import statistics
from typing import Dict, List, Any, Optional
from .base import PromptTechnique, PromptResult
from .schemas import validate_and_parse, REPORT_JSON_SCHEMA
from .client import LLMClient


class RoleTaskConstraints(PromptTechnique):
    """Zero-shot prompting with explicit role, task definition, and constraints.
    
    This technique provides clear context about the analysis task, explicit rules
    for pathogen detection thresholds, and structured output requirements without
    using examples. Best for baseline comparisons and rapid deployment.
    """
    
    def __init__(self, client: Optional['LLMClient'] = None) -> None:
        """Initialize the technique with an optional LLM client.
        
        Args:
            client: Optional LLM client instance. If None, creates one on first use.
        """
        super().__init__("Role+Task+Constraints", client)
    
    def build_messages(self, evidence: Dict[str, Any]) -> List[Dict[str, str]]:
        """Construct the message list for the LLM from evidence.

        Creates a single-turn prompt that establishes the biosurveillance context,
        provides the evidence data, states confidence thresholds, and requires
        JSON output matching the schema.
        
        Args:
            evidence: Dictionary containing 'known_taxa', 'ood_rate', 'sample_meta'.
            
        Returns:
            List containing a single user message with the complete prompt.
        """
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
        """Parse and validate raw LLM output against the report schema.

        Uses the shared validation pipeline to extract JSON, verify schema
        compliance, and generate appropriate fallback responses on failure.
        
        Args:
            raw_response: Raw text output from the LLM.
            evidence: Original evidence dict for context in error cases.
            
        Returns:
            Dict with 'json', 'valid', and 'errors' keys.
        """
        return validate_and_parse(raw_response, evidence)


class FewShotContrastive(PromptTechnique):
    """Few-shot learning using contrastive good/bad example pairs.
    
    Demonstrates both correct conservative analysis and common mistakes to avoid,
    particularly overclaiming with low confidence or high OOD rates. Helps the
    model learn appropriate uncertainty language and threshold application.
    """
    
    def __init__(self, client: Optional['LLMClient'] = None) -> None:
        super().__init__("Few-shot Contrastive", client)
    
    def build_messages(self, evidence: Dict[str, Any]) -> List[Dict[str, str]]:
        """Build LLM messages that include examples and the current evidence.
        
        Provides one high-confidence detection example and one low-confidence
        example showing both incorrect overclaiming and the correct conservative
        response.
        
        Args:
            evidence: Dictionary containing 'known_taxa', 'ood_rate', 'sample_meta'.
            
        Returns:
            List with single user message containing examples and query.
        """
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
        """Validate the LLM response against the reporting schema."""
        return validate_and_parse(raw_response, evidence)


class StructuredJSONGuard(PromptTechnique):
    """Strict schema enforcement with explicit formatting requirements.
    
    Emphasizes exact JSON output with no additional text, provides the complete
    schema inline, and includes a fallback "inconclusive" template. Best for
    production environments requiring guaranteed parseable outputs.
    """
    
    def __init__(self, client: Optional['LLMClient'] = None) -> None:
        super().__init__("Structured JSON Guard", client)
    
    def build_messages(self, evidence: Dict[str, Any]) -> List[Dict[str, str]]:
        """Prompt the model to produce JSON that strictly follows the schema.
        
        Uses emphatic language ("CRITICAL", "EXACTLY") and provides the full
        schema definition plus an inconclusive template as a safety net.
        
        Args:
            evidence: Dictionary containing 'known_taxa', 'ood_rate', 'sample_meta'.
            
        Returns:
            List with single message emphasizing strict JSON compliance.
        """
        taxa_str = ', '.join([f"{t[0]} ({t[1]:.2f})" for t in evidence.get('known_taxa', [])])
        
        prompt = f"""CRITICAL: Output EXACTLY valid JSON. No extra text.

Schema: {json.dumps(REPORT_JSON_SCHEMA)}

Evidence: {taxa_str}, OOD: {evidence.get('ood_rate', 0.0):.3f}

If uncertain, use: {{"summary": "Inconclusive", "known_pathogens": [], "ood_rate": {evidence.get('ood_rate', 0.0)}, "caveats": ["Insufficient evidence"]}}

JSON:"""
        
        return [{"role": "user", "content": prompt}]
    
    def postprocess(self, raw_response: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
        """Parse LLM output into structured report using shared validator."""
        return validate_and_parse(raw_response, evidence)


class RAGLite(PromptTechnique):
    """Retrieval-augmented generation lite: inject pipeline context into prompts.
    
    Provides analysis parameters (thresholds, database info), sample metadata,
    and interpretation notes. Helps the model make context-aware decisions about
    OOD rates and sample types (e.g., environmental vs clinical).
    """
    
    def __init__(self, client: Optional['LLMClient'] = None) -> None:
        super().__init__("RAG-lite", client)
    
    def build_messages(self, evidence: Dict[str, Any]) -> List[Dict[str, str]]:
        """Inject pipeline context and sample metadata into the prompt.
        
        Includes confidence thresholds, OOD warning levels, database information,
        and analysis notes about what elevated OOD rates or environmental samples
        might indicate.
        
        Args:
            evidence: Dictionary containing 'known_taxa', 'ood_rate', 'sample_meta'.
            
        Returns:
            List with message containing context, evidence, and analysis notes.
        """
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
        """Validate and parse RAG-assisted analysis output."""
        return validate_and_parse(raw_response, evidence)


class SelfConsistency(PromptTechnique):
    """Multiple sampling with consensus aggregation for improved reliability.
    
    Runs a base technique multiple times (default 3) with elevated temperature,
    then aggregates results using majority voting and median confidence scores.
    Pathogens detected in >50% of samples are included in the final report.
    Higher cost but more reliable for critical decisions.
    """
    
    def __init__(self, base_technique: Optional[PromptTechnique] = None, 
                 n_samples: int = 3, 
                 client: Optional['LLMClient'] = None) -> None:
        """Initialize self-consistency wrapper around a base technique.
        
        Args:
            base_technique: Technique to run multiple times. Defaults to RoleTaskConstraints.
            n_samples: Number of independent samples to generate (default 3).
            client: Optional LLM client instance.
        """
        super().__init__("Self-Consistency", client)
        self.base_technique = base_technique or RoleTaskConstraints(client)
        self.n_samples = n_samples
    
    def build_messages(self, evidence: Dict[str, Any]) -> List[Dict[str, str]]:
        """Delegate message construction to the configured base technique."""
        return self.base_technique.build_messages(evidence)
    
    def postprocess(self, raw_response: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
        """Use shared validator to parse each sample's response."""
        return validate_and_parse(raw_response, evidence)
    
    def run(self, evidence: Dict[str, Any], temperature: float = 0.7) -> PromptResult:
        """Run the base technique multiple times and aggregate consensus.

        Collects multiple independent analyses, filters to valid results,
        performs majority voting on pathogen detections, and computes median
        confidence scores and OOD rates.
        
        Args:
            evidence: Dictionary containing 'known_taxa', 'ood_rate', 'sample_meta'.
            temperature: Sampling temperature for diversity (default 0.7).
            
        Returns:
            PromptResult containing aggregated consensus analysis. If all samples
            fail validation, returns an inconclusive report.
        """
        result = PromptResult(self.name, evidence)
        sub_results: List[Dict[str, Any]] = []
        
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
        pathogen_votes: Dict[str, List[float]] = {}
        for sub_json in sub_results:
            for pathogen in sub_json.get('known_pathogens', []):
                taxon = pathogen['taxon']
                if taxon not in pathogen_votes:
                    pathogen_votes[taxon] = []
                pathogen_votes[taxon].append(pathogen['confidence'])
        
        # Keep pathogens detected in majority of samples
        consensus_pathogens: List[Dict[str, Any]] = []
        majority_threshold = len(sub_results) / 2
        
        for taxon, confidences in pathogen_votes.items():
            if len(confidences) > majority_threshold:
                consensus_pathogens.append({
                    'taxon': taxon,
                    'confidence': statistics.median(confidences)
                })
        
        consensus_result: Dict[str, Any] = {
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
    """Two-step analysis with explicit claim verification (CoVe).
    
    Asks the model to: (1) provide initial analysis, (2) verify each claim
    against thresholds and evidence, (3) produce final verified output. Reduces
    hallucination and overclaiming by forcing explicit checking steps.
    """
    
    def __init__(self, client: Optional['LLMClient'] = None) -> None:
        super().__init__("Chain-of-Verification", client)
    
    def build_messages(self, evidence: Dict[str, Any]) -> List[Dict[str, str]]:
        """Create a three-step prompt: analyze, verify, finalize.
        
        The prompt structure guides the model through explicit verification of
        confidence thresholds, taxon name accuracy, OOD rate implications, and
        conservative bias before producing the final JSON output.
        
        Args:
            evidence: Dictionary containing 'known_taxa', 'ood_rate', 'sample_meta'.
            
        Returns:
            List with single message containing all three verification steps.
        """
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
        """Validate chain-of-verification LLM output."""
        return validate_and_parse(raw_response, evidence)


class CritiqueAndRevise(PromptTechnique):
    """Two-stage analysis with critic-reviewer loop.
    
    Generates initial analysis, then acts as its own critic to identify issues
    (overclaiming, missing caveats, insufficient conservatism) before producing
    a revised final output. Highest quality but also highest latency and cost.
    """
    
    def __init__(self, client: Optional['LLMClient'] = None) -> None:
        super().__init__("Critique-and-Revise", client)
    
    def run(self, evidence: Dict[str, Any], temperature: float = 0.3) -> PromptResult:
        """Perform two-stage analysis: initial draft then critique-based revision.
        
        Stage 1 produces a draft analysis. Stage 2 reviews the draft for common
        errors (overconfidence, inadequate caveats) and produces an improved
        version. Total latency is the sum of both stages.
        
        Args:
            evidence: Dictionary containing 'known_taxa', 'ood_rate', 'sample_meta'.
            temperature: Sampling temperature for both stages (default 0.3).
            
        Returns:
            PromptResult containing the revised analysis after critique, or error
            information if either stage fails.
        """
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
    
    def _build_initial_messages(self, evidence: Dict[str, Any]) -> List[Dict[str, str]]:
        """Build the first-stage analysis prompt (draft generation).
        
        Args:
            evidence: Dictionary containing evidence data.
            
        Returns:
            Message list for initial draft analysis.
        """
        taxa_str = ', '.join([f"{t[0]} ({t[1]:.2f})" for t in evidence.get('known_taxa', [])])
        prompt = f"Analyze: {taxa_str}, OOD: {evidence.get('ood_rate', 0.0):.3f}. Provide JSON pathogen analysis."
        return [{"role": "user", "content": prompt}]
    
    def _build_critique_messages(self, initial_analysis: str, evidence: Dict[str, Any]) -> List[Dict[str, str]]:
        """Build the critique prompt that reviews and improves the initial draft.
        
        Args:
            initial_analysis: The draft analysis text from stage 1.
            evidence: Original evidence for context.
            
        Returns:
            Message list asking for critique and revision.
        """
        prompt = f"""Initial analysis: {initial_analysis}

Reviewer critique:
- Is this too confident for the evidence strength?
- Are caveats adequate?
- Any overclaiming?

Provide improved JSON analysis:"""
        return [{"role": "user", "content": prompt}]
    
    def build_messages(self, evidence: Dict[str, Any]) -> List[Dict[str, str]]:
        """Delegated to _build_initial_messages for consistency."""
        return self._build_initial_messages(evidence)
    
    def postprocess(self, raw_response: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
        """Parse and validate the revised analysis output."""
        return validate_and_parse(raw_response, evidence)


def get_all_techniques(client: Optional['LLMClient'] = None) -> Dict[str, PromptTechnique]:
    """Create instances of all available prompt techniques.
    
    Instantiates each technique class with the provided (or default) LLM client.
    Used by the comparison framework to test all techniques on the same evidence.
    
    Args:
        client: Optional LLM client to share across techniques. If None, each
                technique creates its own client on first use.
        
    Returns:
        Dictionary mapping technique names (snake_case) to initialized instances.
    """
    return {
        'role_task_constraints': RoleTaskConstraints(client),
        'few_shot_contrastive': FewShotContrastive(client),
        'structured_json_guard': StructuredJSONGuard(client),
        'rag_lite': RAGLite(client),
        'self_consistency': SelfConsistency(client=client),
        'chain_of_verification': ChainOfVerification(client),
        'critique_and_revise': CritiqueAndRevise(client)
    }