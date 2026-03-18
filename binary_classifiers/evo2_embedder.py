"""
Evo 2 Integration for BAIO
Provides DNA embeddings using Evo 2 model for higher accuracy classification.

Requirements:
- NVIDIA GPU with 16GB+ VRAM (for 7B model) or 80GB+ (for 40B model)
- CUDA 12.0+
- transformers library
"""

from typing import List, Optional
import numpy as np

# Try to import transformers, will be None if not available
try:
    from transformers import AutoTokenizer, AutoModelForCausalLM
    import torch

    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    AutoTokenizer = None
    AutoModelForCausalLM = None
    torch = None


class Evo2Embedder:
    """
    Evo 2 embedder for DNA sequences.
    Uses Hugging Face's Evo 2 model for generating embeddings.

    Supports:
    - nvidia/evo2-7b (7 billion parameters, ~16GB VRAM)
    - nvidia/evo2-40b (40 billion parameters, ~80GB VRAM)
    """

    MODEL_SIZES = {
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

        self.model = None
        self.tokenizer = None
        self.initialized = False

        if not TRANSFORMERS_AVAILABLE:
            print(
                "WARNING: transformers library not installed. Install with: pip install transformers torch"
            )
            return

        if device == "cpu":
            print("WARNING: CPU mode for Evo 2 will be very slow. GPU recommended.")

    def load_model(self) -> bool:
        """Load the Evo 2 model and tokenizer."""
        if not TRANSFORMERS_AVAILABLE:
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
            self.tokenizer = AutoTokenizer.from_pretrained(
                model_name,
                trust_remote_code=True,
            )
            self.model = AutoModelForCausalLM.from_pretrained(
                model_name,
                trust_remote_code=True,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
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

    def get_embedding(self, sequence: str) -> Optional[np.ndarray]:
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
            # Clean sequence
            clean_seq = (
                sequence.upper().replace(" ", "").replace("\n", "")[: self.max_length]
            )

            # Tokenize
            inputs = self.tokenizer(
                clean_seq,
                return_tensors="pt",
                truncation=True,
                max_length=self.max_length,
            )

            if self.device == "cuda":
                inputs = {k: v.cuda() for k, v in inputs.items()}

            # Get hidden states
            with torch.no_grad():
                outputs = self.model(
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
                sum_embeddings = torch.sum(hidden_states * mask_expanded, dim=1)
                sum_mask = torch.clamp(mask_expanded.sum(dim=1), min=1e-9)
                embedding = sum_embeddings / sum_mask
            else:
                embedding = hidden_states.mean(dim=1)

            return embedding.cpu().numpy().flatten()

        except Exception as e:
            print(f"Error getting embedding: {e}")
            return None

    def get_embeddings_batch(self, sequences: List[str]) -> Optional[List[np.ndarray]]:
        """
        Get embeddings for multiple DNA sequences in batch.

        Args:
            sequences: List of DNA sequence strings

        Returns:
            List of embedding arrays or None if failed
        """
        if not self.initialized:
            if not self.load_model():
                return None

        embeddings = []

        for i in range(0, len(sequences), self.batch_size):
            batch = sequences[i : i + self.batch_size]

            try:
                # Clean sequences
                clean_seqs = [
                    seq.upper().replace(" ", "").replace("\n", "")[: self.max_length]
                    for seq in batch
                ]

                # Tokenize
                inputs = self.tokenizer(
                    clean_seqs,
                    return_tensors="pt",
                    truncation=True,
                    max_length=self.max_length,
                    padding=True,
                )

                if self.device == "cuda":
                    inputs = {k: v.cuda() for k, v in inputs.items()}

                # Get hidden states
                with torch.no_grad():
                    outputs = self.model(
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
                    sum_embeddings = torch.sum(hidden_states * mask_expanded, dim=1)
                    sum_mask = torch.clamp(mask_expanded.sum(dim=1), min=1e-9)
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
        if not TRANSFORMERS_AVAILABLE:
            return False

        if self.device == "cuda":
            try:
                import torch

                return torch.cuda.is_available()
            except ImportError:
                return False

        return True


def check_evo2_requirements() -> dict:
    """Check if system meets requirements for Evo 2."""
    import torch

    status = {
        "transformers_available": TRANSFORMERS_AVAILABLE,
        "cuda_available": (
            torch.cuda.is_available() if TRANSFORMERS_AVAILABLE else False
        ),
        "gpu_name": None,
        "gpu_memory_gb": 0,
        "meets_requirements": False,
        "recommended_model": None,
    }

    if status["cuda_available"]:
        status["gpu_name"] = torch.cuda.get_device_name(0)
        status["gpu_memory_gb"] = torch.cuda.get_device_properties(0).total_memory / (
            1024**3
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
