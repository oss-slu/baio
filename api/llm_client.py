"""LLM client wrapper for API chat functionality."""

import os
import time
from typing import Dict, List


class LLMClient:
    """
    Wrapper class for LLM API calls.
    Replace the mock implementation with your actual LLM provider.
    """

    def __init__(self, provider: str = "openai", model: str = "gpt-4"):
        self.provider = provider
        self.model = model
        self.api_key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")

    def generate_response(
        self, messages: List[Dict[str, str]], system_prompt: str
    ) -> str:
        """
        Generate response from LLM.

        Args:
            messages: List of conversation messages
            system_prompt: System prompt for the LLM

        Returns:
            Generated response text
        """
        try:
            # MOCK IMPLEMENTATION (Replace with real API call)
            time.sleep(1)  # Simulate API call delay
            user_query = messages[-1]["content"].lower()

            if "what is baio" in user_query or "what's baio" in user_query:
                return "BAIO is a metagenomic analysis platform for taxonomy profiling and novel pathogen detection."

            return (
                f"Echo: {messages[-1]['content']}\n\n"
                "This is a mock response. Replace LLMClient.generate_response with a real LLM call."
            )
        except Exception as e:
            raise Exception(f"LLM API call failed: {str(e)}")


SYSTEM_PROMPTS = {
    "default": "You are an expert bioinformatics assistant for BAIO.",
    "analysis_helper": "You are analyzing metagenomic sequencing data with BAIO.",
    "technical_expert": "You are a technical expert on BAIO's architecture.",
}
