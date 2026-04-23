import os
import time
import requests
import json
from typing import Dict, List
from dotenv import load_dotenv

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

    def __init__(self, model: str = "meta-llama/llama-3.1-8b-instruct:free"):
        load_dotenv()
        self.model = model
        self.openrouter_key = os.getenv("OPENROUTER_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.nvidia_key = os.getenv("NVCF_RUN_KEY")

        # Treat placeholder values as unset
        if self.openrouter_key == "your_openrouter_key_here":
            self.openrouter_key = None
        if self.gemini_key == "your_gemini_key_here":
            self.gemini_key = None

        if self.openrouter_key:
            self._backend = "openrouter"
        elif self.gemini_key:
            self._backend = "gemini"
            print("OpenRouter key not found; using Gemini API.", flush=True)
        elif self.nvidia_key:
            self._backend = "nvidia"
            self.nvidia_model = "nvidia/llama-3.1-nemotron-nano-8b-v1"
            print("Using NVIDIA NIM API (nemotron-nano-8b).", flush=True)
        else:
            self._backend = "mock"
            print("No LLM API key found; falling back to mock responses.", flush=True)

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
        if self._backend == "openrouter":
            return self._call_openrouter(messages, system_prompt)
        elif self._backend == "gemini":
            return self._call_gemini(messages, system_prompt)
        elif self._backend == "nvidia":
            return self._call_nvidia(messages, system_prompt)
        else:
            return self._mock_response(messages)

    def _call_openrouter(
        self, messages: List[Dict[str, str]], system_prompt: str
    ) -> str:
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                *messages,
            ],
        }
        headers = {
            "Authorization": f"Bearer {self.openrouter_key}",
            "Content-Type": "application/json",
        }
        try:
            response = requests.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                data=json.dumps(payload),
                timeout=30,
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"OpenRouter error: {e}. Falling back to mock response.", flush=True)
            return self._mock_response(messages)

    def _call_gemini(self, messages: List[Dict[str, str]], system_prompt: str) -> str:
        try:
            import google.generativeai as genai

            genai.configure(api_key=self.gemini_key)
            gemini_model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                system_instruction=system_prompt,
            )

            # Convert messages to Gemini's format
            history = []
            for msg in messages[:-1]:
                role = "user" if msg["role"] == "user" else "model"
                history.append({"role": role, "parts": [msg["content"]]})

            chat = gemini_model.start_chat(history=history)
            last_message = messages[-1]["content"] if messages else ""
            response = chat.send_message(last_message)
            return response.text
        except Exception as e:
            print(f"Gemini error: {e}. Falling back to mock response.", flush=True)
            return self._mock_response(messages)

    def _call_nvidia(self, messages: List[Dict[str, str]], system_prompt: str) -> str:
        payload = {
            "model": self.nvidia_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                *messages,
            ],
            "max_tokens": 1024,
            "temperature": 0.7,
            "top_p": 0.9,
        }
        headers = {
            "Authorization": f"Bearer {self.nvidia_key}",
            "Content-Type": "application/json",
        }
        try:
            response = requests.post(
                url="https://integrate.api.nvidia.com/v1/chat/completions",
                headers=headers,
                data=json.dumps(payload),
                timeout=60,
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"NVIDIA NIM error: {e}. Falling back to mock response.", flush=True)
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
