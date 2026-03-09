import os
import time
import requests
import json
from typing import Dict, List

SYSTEM_PROMPTS = {
    "default": """You are BAIO, an expert bioinformatics assistant specialized in DNA sequence classification and pathogen detection.

You help researchers:
- Understand classification results (Virus vs Host predictions)
- Interpret confidence scores and risk levels
- Explain k-mer analysis and model predictions
- Provide guidance on next steps for validation

Be concise, helpful, and scientific in your responses. Use emojis sparingly.""",
    "analysis_helper": "You are analyzing metagenomic sequencing data with BAIO. Help interpret the classification results and suggest next steps.",
    "technical_expert": "You are a technical expert on BAIO's architecture, focusing on RandomForest models, k-mer tokenization, and TF-IDF features.",
}


class LLMClient:

    def __init__(self, model: str = "liquid/lfm-2.5-1.2b-instruct:free"):
        self.model = model
        self.api_key = os.getenv("OPENROUTER_API_KEY")

        if self.api_key is None:
            print(
                "OpenRouter api key not found; falling back to mock responses.",
                flush=True,
            )

    def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str = SYSTEM_PROMPTS["default"],
    ) -> str:
        """
        Generate response from the LLM or fallback to mock if API key missing/error.

        Args:
            messages: List of conversation messages
            system_prompt: System prompt for the LLM

        Returns:
            Generated response text
        """

        if self.api_key is None:
            return self._mock_response(messages)

        # Build the payload for OpenRouter API
        payload = {"model": self.model, "messages": messages}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            response = requests.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                data=json.dumps(payload),
                timeout=10,  # seconds
            )
            response.raise_for_status()
            data = response.json()

            # Extract the assistant's reply
            return data["choices"][0]["message"]["content"]

        except Exception as e:
            print(f"API error: {e}. Falling back to mock response.", flush=True)
            return self._mock_response(messages)

    def _mock_response(self, messages: List[Dict[str, str]]) -> str:
        """Fallback mock response when API key is not available."""
        time.sleep(0.5)
        user_query = messages[-1]["content"].lower() if messages else ""

        if "what is baio" in user_query or "what's baio" in user_query:
            return "BAIO (Bioinformatics AI for Omics) is a metagenomic analysis platform for DNA sequence classification, taxonomy profiling, and novel pathogen detection. It uses machine learning models (RandomForest, SVM) to classify sequences as Virus or Host based on k-mer frequency analysis."

        if "virus" in user_query and "host" in user_query:
            return "In BAIO, sequences are classified as either Virus or Host based on k-mer frequency patterns. The model analyzes 6-mer patterns, GC content, and sequence characteristics to make predictions with confidence scores."

        if "confidence" in user_query:
            return "The confidence score represents the model's certainty in its prediction. Higher values (closer to 1.0) indicate stronger confidence. Sequences with confidence below the threshold may be flagged as Novel for further investigation."

        if "novel" in user_query or "ood" in user_query:
            return "Novel/Out-of-Distribution (OOD) sequences are those that don't match the training distribution well. These may represent new pathogens or unusual sequences that warrant additional analysis."

        if "gc content" in user_query:
            return "GC content (Guanine-Cytosine percentage) is a genomic feature used in classification. Viruses often have distinct GC patterns compared to host organisms, helping the model distinguish between them."

        return (
            "I can help you with BAIO-related questions about sequence classification, "
            "virus/host detection, confidence scores, and the analysis pipeline. "
            "What would you like to know?"
        )
