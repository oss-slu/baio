import os
import json
import time
import random
from typing import List, Dict
from .types import LLMResponse
from . import logging as plog


class LLMClient:
    def __init__(self) -> None:
        """Initialize the LLM client from environment variables.

        Reads API credentials and basic settings from environment and
        enables `mock_mode` when no API key is present.
        """
        # example env will have actual keys when available
        self.api_key = os.getenv("LLM_API_KEY") or os.getenv("GROK_API_KEY")
        self.base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
        self.model = os.getenv("LLM_MODEL", "gpt-4")
        self.mock_mode = not bool(self.api_key)

        if self.mock_mode:
            plog.info("llm_client_mode", mode="mock")

    def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1000,
    ) -> LLMResponse:
        """Send messages to the LLM and return a standardized response dict.

        If the client is running in mock mode a synthetic response is
        returned; otherwise a real API call is attempted. The return value
        contains keys: 'content' (str), 'latency_s' (float) and 'mock' (bool).
        """
        start_time = time.time()

        if self.mock_mode:
            response = self._mock_response(messages)
        else:
            response = self._real_response(messages, temperature, max_tokens)

        resp: LLMResponse = {
            "content": response,
            "latency_s": time.time() - start_time,
            "mock": self.mock_mode,
        }
        plog.info("llm_response", latency=resp["latency_s"], mock=resp["mock"])
        return resp

    def _real_response(
        self, messages: List[Dict[str, str]], temperature: float, max_tokens: int
    ) -> str:
        """TODO: Implement actual API call when keys available."""
        import requests

        # Placeholder for real API implementation
        headers = {"Authorization": f"Bearer {self.api_key}"}
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        response = requests.post(
            f"{self.base_url}/chat/completions", headers=headers, json=payload
        )
        return str(response.json()["choices"][0]["message"]["content"])

    def _mock_response(self, messages: List[Dict[str, str]]) -> str:
        """Generate mock response for testing."""
        time.sleep(random.uniform(0.1, 0.3))  # Simulate latency

        # Simple mock based on content
        content = " ".join(msg.get("content", "") for msg in messages).lower()

        if "sars-cov-2" in content:
            return self._mock_covid_response()
        elif "inconclusive" in content or "low" in content:
            return self._mock_inconclusive()
        else:
            return self._mock_generic()

    def _mock_covid_response(self) -> str:
        return json.dumps(
            {
                "summary": "SARS-CoV-2 detected with moderate confidence",
                "known_pathogens": [{"taxon": "SARS-CoV-2", "confidence": 0.65}],
                "ood_rate": 0.04,
                "caveats": ["Single sample", "Confirmation needed"],
            }
        )

    def _mock_inconclusive(self) -> str:
        return json.dumps(
            {
                "summary": "Inconclusive - insufficient evidence",
                "known_pathogens": [],
                "ood_rate": 0.20,
                "caveats": ["Low confidence scores", "High OOD rate"],
            }
        )

    def _mock_generic(self) -> str:
        return json.dumps(
            {
                "summary": "Mock analysis result",
                "known_pathogens": [{"taxon": "Test pathogen", "confidence": 0.4}],
                "ood_rate": 0.08,
                "caveats": ["Mock response", "Replace with real analysis"],
            }
        )
