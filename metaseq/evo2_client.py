import os
import time
from .types import LLMResponse


class Evo2Client:
    def __init__(self) -> None:
        """Initialize the LLM client from environment variables.

        Reads API credentials and basic settings from environment.
        """
        self.api_key = os.getenv("NVCF_RUN_KEY")
        self.base_url = "https://health.api.nvidia.com/v1/biology/arc/evo2-40b/generate"

    def chat(
        self, sequence: str, temperature: float = 0.3, max_tokens: int = 1000
    ) -> LLMResponse:
        """Send sequence to the Evo2 API and return a standardized response dict.

        The return value contains keys: 'content' (str), 'latency_s' (float).
        """
        start_time = time.time()

        response = self._response(sequence, temperature, max_tokens)

        resp: LLMResponse = {
            "content": response,
            "latency_s": time.time() - start_time,
            "mock": False,
        }

        return resp

    def _response(self, sequence: str, temperature: float, max_tokens: int) -> str:
        """Send sequence to the Evo2 API and return a response."""
        import requests

        headers = {"Authorization": f"Bearer {self.api_key}"}
        payload = {
            "sequence": sequence,
            "temperature": temperature,
            "num_tokens": max_tokens,
        }

        response = requests.post(self.base_url, headers=headers, json=payload)
        return response.text
