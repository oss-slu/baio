"""Base classes for prompt techniques."""

from abc import ABC, abstractmethod
from typing import Dict, List, Any
import time


class PromptResult(dict):
    """Container for technique results."""
    
    def __init__(self, technique: str, evidence: Dict[str, Any]):
        super().__init__()
        self.update({
            'technique': technique,
            'evidence': evidence,
            'raw': '',
            'json': {},
            'valid': False,
            'errors': [],
            'latency_s': 0.0
        })


class PromptTechnique(ABC):
    """Base class for all techniques."""
    
    def __init__(self, name: str, client=None):
        self.name = name
        self.client = client
    
    @abstractmethod
    def build_messages(self, evidence: Dict[str, Any]) -> List[Dict[str, str]]:
        """Build prompt messages."""
        pass
    
    @abstractmethod  
    def postprocess(self, raw_response: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
        """Parse and validate response."""
        pass
    
    def run(self, evidence: Dict[str, Any], temperature: float = 0.3) -> PromptResult:
        """Run complete analysis."""
        result = PromptResult(self.name, evidence)
        
        try:
            if self.client is None:
                from .client import LLMClient
                self.client = LLMClient()
            
            # Get LLM response
            messages = self.build_messages(evidence)
            llm_result = self.client.chat(messages, temperature=temperature)
            
            result['raw'] = llm_result['content']
            result['latency_s'] = llm_result['latency_s']
            
            # Parse response
            processed = self.postprocess(llm_result['content'], evidence)
            result['json'] = processed.get('json', {})
            result['valid'] = processed.get('valid', False)
            result['errors'] = processed.get('errors', [])
            
        except Exception as e:
            result['errors'].append(str(e))
            
        return result