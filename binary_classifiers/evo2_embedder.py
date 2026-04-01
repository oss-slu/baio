"""
Evo 2 Integration for BAIO.

Provides DNA embeddings using Evo 2 model for higher accuracy classification.

Requirements:
- NVIDIA GPU with 16GB+ VRAM (for 7B model) or 80GB+ (for 40B model)
- CUDA 12.0+
- transformers library
"""

from __future__ import annotations

from typing import Any, TypedDict

import numpy as np

AUTO_MODEL_FOR_CAUSAL_LM: Any = None
AUTO_TOKENIZER: Any = None
TORCH: Any = None

try:
    from transformers import AutoModelForCausalLM as _AutoModelForCausalLM
    from transformers import AutoTokenizer as _AutoTokenizer
    import torch as _torch
except ImportError:
    TRANSFORMERS_AVAILABLE = False
else:
    TRANSFORMERS_AVAILABLE = True
    AUTO_MODEL_FOR_CAUSAL_LM = _AutoModelForCausalLM
    AUTO_TOKENIZER = _AutoTokenizer
    TORCH = _torch


class Evo2RequirementStatus(TypedDict):
    transformers_available: bool
    cuda_available: bool
    gpu_name: str | None
    gpu_memory_gb: float
    meets_requirements: bool
    recommended_model: str | None


class Evo2Embedder:
    """
    Evo 2 embedder for DNA sequences.
    Uses Hugging Face's Evo 2 model for generating embeddings.

    Supports:
    - nvidia/evo2-7b (7 billion parameters, ~16GB VRAM)
    - nvidia/evo2-40b (40 billion parameters, ~80GB VRAM)
    """

    MODEL_SIZES: dict[str, str] = {
        "7b": "nvidia/evo2-7b",
        "40b": "nvidia/evo2-40b",
    }

    def __init__(
        self,
        model_size: str = "7b",
        device: str = "cuda",
        batch_size: int = 4,
        max_length: int = 8192,
    ):
        """
        Initialize Evo 2 embedder.

        Args:
            model_size: Model size - "7b" or "40b"
            device: Device to use - "cuda" or "cpu"
            batch_size: Batch size for processing
            max_length: Maximum sequence length to process
        """
        self.model_size = model_size
        self.device = device
        self.batch_size = batch_size
        self.max_length = max_length

        self.model: Any | None = None
        self.tokenizer: Any | None = None
        self.initialized = False

        if not TRANSFORMERS_AVAILABLE:
            print(
                "WARNING: Evo2 dependencies not installed. Install with: pip install baio[evo2]"
            )
            return

        if device == "cpu":
            print("WARNING: CPU mode for Evo 2 will be very slow. GPU recommended.")

    def load_model(self) -> bool:
        """Load the Evo 2 model and tokenizer."""
        if (
            not TRANSFORMERS_AVAILABLE
            or AUTO_TOKENIZER is None
            or AUTO_MODEL_FOR_CAUSAL_LM is None
            or TORCH is None
        ):
            print("Cannot load model: transformers not available")
            return False

        if self.initialized:
            return True

        model_name = self.MODEL_SIZES.get(self.model_size)
        if not model_name:
            print(f"Unknown model size: {self.model_size}. Using 7b.")
            model_name = self.MODEL_SIZES["7b"]

        try:
            print(f"Loading Evo 2 {self.model_size} model from {model_name}...")
            self.tokenizer = AUTO_TOKENIZER.from_pretrained(
                model_name,
                trust_remote_code=True,
            )
            self.model = AUTO_MODEL_FOR_CAUSAL_LM.from_pretrained(
                model_name,
                trust_remote_code=True,
                torch_dtype=TORCH.float16 if self.device == "cuda" else TORCH.float32,
                device_map="auto" if self.device == "cuda" else None,
            )

            if self.device == "cuda":
                self.model = self.model.eval()

            self.initialized = True
            print(f"Evo 2 {self.model_size} model loaded successfully!")
            return True

        except Exception as e:
            print(f"Failed to load Evo 2 model: {e}")
            print("Falling back to k-mer based classification.")
            return False

    def _ensure_runtime(self) -> tuple[Any, Any, Any]:
        if not self.initialized and not self.load_model():
            raise RuntimeError("Evo 2 model could not be loaded")

        if self.tokenizer is None or self.model is None or TORCH is None:
            raise RuntimeError("Evo 2 runtime is not fully initialized")

        return self.tokenizer, self.model, TORCH

    def get_embedding(self, sequence: str) -> np.ndarray | None:
        """
        Get embedding for a single DNA sequence.

        Args:
            sequence: DNA sequence string

        Returns:
            Numpy array of embeddings or None if failed
        """
        if not self.initialized:
            if not self.load_model():
                return None

        try:
            tokenizer, model, torch_module = self._ensure_runtime()

            # Clean sequence
            clean_seq = (
                sequence.upper().replace(" ", "").replace("\n", "")[: self.max_length]
            )

            # Tokenize
            inputs = tokenizer(
                clean_seq,
                return_tensors="pt",
                truncation=True,
                max_length=self.max_length,
            )

            if self.device == "cuda":
                inputs = {k: v.cuda() for k, v in inputs.items()}

            # Get hidden states
            with torch_module.no_grad():
                outputs = model(
                    **inputs,
                    output_hidden_states=True,
                )

            # Use last hidden state, mean pooled
            hidden_states = outputs.hidden_states[-1]
            attention_mask = inputs.get("attention_mask")

            if attention_mask is not None:
                # Mean pooling with attention mask
                mask_expanded = (
                    attention_mask.unsqueeze(-1).expand(hidden_states.size()).float()
                )
                sum_embeddings = torch_module.sum(
                    hidden_states * mask_expanded,
                    dim=1,
                )
                sum_mask = torch_module.clamp(mask_expanded.sum(dim=1), min=1e-9)
                embedding = sum_embeddings / sum_mask
            else:
                embedding = hidden_states.mean(dim=1)

            return np.asarray(embedding.cpu().numpy()).flatten()

        except Exception as e:
            print(f"Error getting embedding: {e}")
            return None

    def get_embeddings_batch(self, sequences: list[str]) -> list[np.ndarray] | None:
        """
        Get embeddings for multiple DNA sequences in batch.

        Args:
            sequences: List of DNA sequence strings

        Returns:
            List of embedding arrays or None if failed
        """
        try:
            tokenizer, model, torch_module = self._ensure_runtime()
        except Exception as e:
            print(f"Error preparing Evo 2 batch runtime: {e}")
            return None

        embeddings: list[np.ndarray] = []

        for i in range(0, len(sequences), self.batch_size):
            batch = sequences[i : i + self.batch_size]

            try:
                # Clean sequences
                clean_seqs = [
                    seq.upper().replace(" ", "").replace("\n", "")[: self.max_length]
                    for seq in batch
                ]

                # Tokenize
                inputs = tokenizer(
                    clean_seqs,
                    return_tensors="pt",
                    truncation=True,
                    max_length=self.max_length,
                    padding=True,
                )

                if self.device == "cuda":
                    inputs = {k: v.cuda() for k, v in inputs.items()}

                # Get hidden states
                with torch_module.no_grad():
                    outputs = model(
                        **inputs,
                        output_hidden_states=True,
                    )

                # Use last hidden state
                hidden_states = outputs.hidden_states[-1]
                attention_mask = inputs.get("attention_mask")

                if attention_mask is not None:
                    mask_expanded = (
                        attention_mask.unsqueeze(-1)
                        .expand(hidden_states.size())
                        .float()
                    )
                    sum_embeddings = torch_module.sum(
                        hidden_states * mask_expanded,
                        dim=1,
                    )
                    sum_mask = torch_module.clamp(mask_expanded.sum(dim=1), min=1e-9)
                    batch_embeddings = (sum_embeddings / sum_mask).cpu().numpy()
                else:
                    batch_embeddings = hidden_states.mean(dim=1).cpu().numpy()

                for emb in batch_embeddings:
                    embeddings.append(emb.flatten())

            except Exception as e:
                print(f"Error processing batch {i // self.batch_size}: {e}")
                return None

        return embeddings

    def is_available(self) -> bool:
        """Check if Evo 2 is available on this system."""
        if not TRANSFORMERS_AVAILABLE or TORCH is None:
            return False

        if self.device == "cuda":
            return bool(TORCH.cuda.is_available())

        return True


def check_evo2_requirements() -> Evo2RequirementStatus:
    """Check if system meets requirements for Evo 2."""
    status: Evo2RequirementStatus = {
        "transformers_available": TRANSFORMERS_AVAILABLE,
        "cuda_available": False,
        "gpu_name": None,
        "gpu_memory_gb": 0.0,
        "meets_requirements": False,
        "recommended_model": None,
    }

    if not TRANSFORMERS_AVAILABLE or TORCH is None:
        return status

    status["cuda_available"] = bool(TORCH.cuda.is_available())

    if status["cuda_available"]:
        status["gpu_name"] = str(TORCH.cuda.get_device_name(0))
        status["gpu_memory_gb"] = float(
            TORCH.cuda.get_device_properties(0).total_memory / (1024**3)
        )

        if status["gpu_memory_gb"] >= 80:
            status["meets_requirements"] = True
            status["recommended_model"] = "40b"
        elif status["gpu_memory_gb"] >= 16:
            status["meets_requirements"] = True
            status["recommended_model"] = "7b"
        else:
            status["recommended_model"] = "Not enough VRAM"

    return status


if __name__ == "__main__":
    print("=== Evo 2 Requirements Check ===")
    status = check_evo2_requirements()

    print(
        f"Transformers library: {'✓ Available' if status['transformers_available'] else '✗ Not installed'}"
    )
    print(f"CUDA available: {'✓ Yes' if status['cuda_available'] else '✗ No'}")

    if status["cuda_available"]:
        print(f"GPU: {status['gpu_name']}")
        print(f"GPU Memory: {status['gpu_memory_gb']:.1f} GB")

    print(f"Can run Evo 2: {'✓ Yes' if status['meets_requirements'] else '✗ No'}")
    print(f"Recommended model: {status['recommended_model']}")
