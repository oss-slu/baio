"""LLM client wrapper for API chat functionality using Google Gemini."""

import os
import time
from typing import Any, Dict, List

try:
    import google.generativeai as genai
except ModuleNotFoundError:
    genai = None


class LLMClient:
    """Wrapper class for Google Gemini LLM API calls."""

    def __init__(self, provider: str = "google", model: str = "gemini-1.5-flash"):
        self.provider = provider
        self.model = model
        self.api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        self.client: Any = None

        if self.api_key and genai is not None:
            try:
                genai.configure(api_key=self.api_key)
                self.client = genai.GenerativeModel(model)
            except Exception as e:
                print(f"Failed to initialize Gemini: {e}", flush=True)
        elif self.api_key and genai is None:
            print(
                "google-generativeai is not installed; falling back to mock responses.",
                flush=True,
            )

    def generate_response(
        self, messages: List[Dict[str, str]], system_prompt: str
    ) -> str:
        """
        Generate response from Gemini LLM.

        Args:
            messages: List of conversation messages
            system_prompt: System prompt for the LLM

        Returns:
            Generated response text
        """
        try:
            if self.client is None:
                return self._mock_response(messages)

            history = []
            for msg in messages[:-1]:
                role = "user" if msg["role"] == "user" else "model"
                history.append({"role": role, "parts": [msg["content"]]})

            chat = self.client.start_chat(history=history)

            last_message = messages[-1]["content"] if messages else ""
            full_prompt = f"{system_prompt}\n\nUser: {last_message}"

            response = chat.send_message(full_prompt)
            return response.text

        except Exception as e:
            print(f"Gemini API error: {str(e)}")
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
