"""Base classes for prompt techniques."""

from abc import ABC, abstractmethod
from typing import Dict, List, Any
import time


class PromptResult(dict):
    """Container for technique results.

    This dict-like container stores the outputs and metadata produced by a
    PromptTechnique run. Keys include:
      - 'technique': name of the technique used
      - 'evidence': input evidence dict passed to the technique
      - 'raw': raw LLM response as text
      - 'json': parsed/structured response (if any)
      - 'valid': boolean indicating the parsed response passed validation
      - 'errors': list of error messages encountered during processing
      - 'latency_s': latency in seconds for the LLM call
    """

    def __init__(self, technique: str, evidence: Dict[str, Any]):
        """Create a PromptResult initialized with default keys.

        Args:
            technique: Human-readable name of the technique producing this result.
            evidence: The input evidence dict provided to the technique.
        """
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
    """Base class for all prompt techniques.

    Subclasses implement specific prompting and postprocessing strategies.
    """

    def __init__(self, name: str, client=None):
        """Initialize a technique with a name and optional LLM client.

        Args:
            name: A short identifier for the technique.
            client: Optional client object used to call the LLM. If None, a
                default LLMClient will be created when run() is invoked.
        """
        self.name = name
        self.client = client

    @abstractmethod
    def build_messages(self, evidence: Dict[str, Any]) -> List[Dict[str, str]]:
        """Build the list of messages to send to the LLM.

        Subclasses should return a list of message dicts compatible with the
        LLM client API (e.g. [{'role': 'system', 'content': '...'}, ...]).

        Args:
            evidence: Arbitrary dictionary containing inputs the technique
                should use when constructing the prompt.

        Returns:
            A list of message dicts to be sent to the LLM.
        """
        pass

    @abstractmethod
    def postprocess(self, raw_response: str, evidence: Dict[str, Any]) -> Dict[str, Any]:
        """Parse and validate the raw LLM response.

        Implementations should parse raw_response into structured data and
        perform any necessary validation. The returned dict commonly includes:
          - 'json': parsed structured output (dict)
          - 'valid': boolean indicating whether the parsed output is valid
          - 'errors': list of validation or parsing errors

        Args:
            raw_response: The raw text returned by the LLM.
            evidence: The same evidence dict provided to build_messages/run,
                useful for context-aware validation.

        Returns:
            A dict with parsing/validation results (see description above).
        """
        pass

    def run(self, evidence: Dict[str, Any], temperature: float = 0.3) -> PromptResult:
        """Run the complete technique: build prompt, call LLM, and postprocess.

        This method orchestrates the full flow:
          1. Ensure an LLM client is available.
          2. Build messages via build_messages().
          3. Call the LLM client to get a response.
          4. Populate a PromptResult with raw and parsed outputs, latency,
             validation state, and any errors encountered.

        Args:
            evidence: Input data used to build the prompt and validate output.
            temperature: Sampling temperature to pass to the LLM client.

        Returns:
            A PromptResult instance containing raw and processed outputs as well
            as metadata and error information. Exceptions during the run are
            captured and appended to the result.errors list.
        """
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