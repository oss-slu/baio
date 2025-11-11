"""
Utilities for generating Evo2 embeddings for DNA sequences.

This module provides a thin abstraction over potential Evo2 backends:
  * Local Hugging Face checkpoints (when available)
  * Remote Evo2 API (placeholder via `Evo2Client`)
  * Deterministic mock embedding generation for offline development

The CLI orchestrator uses this component to capture embeddings prior to
classification.  The actual binary classifiers still consume k-mer features,
but storing embeddings now enables an easy switch once embedding-based heads
are trained.
"""

from __future__ import annotations

import hashlib
import os
import re
import time
from dataclasses import dataclass
from typing import Iterable, List, Optional

import numpy as np

from .evo2_client import Evo2Client

DNA_PATTERN = re.compile(r"^[ACGTNacgtn]+$")


@dataclass
class Evo2EmbeddingConfig:
    """Configuration for Evo2 embedding generation."""

    model_name: Optional[str] = os.getenv("EVO2_MODEL_NAME")
    device: Optional[str] = None
    pooling: str = os.getenv("EVO2_POOLING", "mean")  # "mean" or "cls"
    max_length: int = int(os.getenv("EVO2_MAX_LENGTH", "4096"))
    max_retries: int = int(os.getenv("EVO2_MAX_RETRIES", "3"))
    retry_backoff_seconds: float = float(os.getenv("EVO2_BACKOFF_SECONDS", "2.0"))
    enable_remote_api: bool = os.getenv("EVO2_USE_REMOTE", "0") == "1"
    mock_mode: Optional[bool] = None  # override automatic detection when set


class Evo2EmbeddingGenerator:
    """Generate Evo2 embeddings with graceful fallbacks."""

    def __init__(self, config: Optional[Evo2EmbeddingConfig] = None) -> None:
        self.config = config or Evo2EmbeddingConfig()
        self._torch = None
        self._tokenizer = None
        self._model = None
        self._remote_client: Optional[Evo2Client] = None
        self.mock_mode = self._should_use_mock_mode()

        if not self.mock_mode:
            self._initialise_local_model()

        if self.config.enable_remote_api and not self.mock_mode:
            # Remote API is only used when explicitly requested and local model
            # initialisation succeeded.
            self._remote_client = Evo2Client()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def generate_embedding(self, sequence: str) -> np.ndarray:
        """Generate an embedding for a single DNA sequence."""
        sequence = sequence.strip().upper()
        self._validate_sequence(sequence)

        if self.mock_mode:
            return self._mock_embedding(sequence)

        if self._remote_client:
            return self._remote_embedding(sequence)

        return self._local_embedding(sequence)

    def generate_batch(self, sequences: Iterable[str]) -> np.ndarray:
        """Generate embeddings for a batch of sequences."""
        vectors: List[np.ndarray] = []
        for seq in sequences:
            vectors.append(self.generate_embedding(seq))
        return np.stack(vectors, axis=0)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _should_use_mock_mode(self) -> bool:
        """Determine whether to use mock embeddings."""
        if self.config.mock_mode is not None:
            return self.config.mock_mode

        if os.getenv("EVO2_EMBED_MOCK", "0") == "1":
            return True

        # If a local model name is not provided we fall back to mock mode.
        if not self.config.model_name:
            return True

        try:
            import torch  # noqa: F401

            return False
        except ImportError:
            return True

    def _initialise_local_model(self) -> None:
        """Load Hugging Face model/tokenizer if available."""
        try:
            import torch
            from transformers import AutoModel, AutoTokenizer

            self._torch = torch

            model_name = self.config.model_name  # type: ignore[assignment]
            if not model_name:
                raise ValueError("Model name must be provided for local embeddings.")

            self._tokenizer = AutoTokenizer.from_pretrained(
                model_name, trust_remote_code=True
            )
            self._model = AutoModel.from_pretrained(
                model_name, trust_remote_code=True
            )

            device = (
                self.config.device
                if self.config.device is not None
                else ("cuda" if torch.cuda.is_available() else "cpu")
            )
            self._model.to(device)
            self._model.eval()
            self._device = device
        except Exception as exc:  # pragma: no cover - defensive
            # If local initialisation fails fall back to mock mode.
            self.mock_mode = True
            self._tokenizer = None
            self._model = None
            self._torch = None
            print(f"[Evo2EmbeddingGenerator] Falling back to mock mode: {exc}")

    def _validate_sequence(self, sequence: str) -> None:
        if not sequence:
            raise ValueError("DNA sequence is empty.")
        if not DNA_PATTERN.match(sequence):
            raise ValueError(
                "Sequence contains invalid characters. Only A/C/G/T/N are allowed."
            )
        if len(sequence) > self.config.max_length:
            raise ValueError(
                f"Sequence length {len(sequence)} exceeds max length "
                f"{self.config.max_length}."
            )

    def _mock_embedding(self, sequence: str) -> np.ndarray:
        """Create deterministic mock embeddings using SHA256 digest."""
        digest = hashlib.sha256(sequence.encode("utf-8")).digest()
        repeat = 8  # 32 bytes * 8 = 256 dims
        vector = np.frombuffer(digest * repeat, dtype=np.uint8).astype(np.float32)
        vector = vector / 255.0  # normalise to [0, 1]
        return vector

    def _remote_embedding(self, sequence: str) -> np.ndarray:
        """Call remote Evo2 API to obtain embeddings."""
        if not self._remote_client:
            raise RuntimeError("Remote client is not initialised.")

        backoff = self.config.retry_backoff_seconds
        for attempt in range(1, self.config.max_retries + 1):
            try:
                response = self._remote_client.chat(sequence)
                content = response["content"]
                vector = self._parse_remote_embedding(content)
                if vector is not None:
                    return vector
            except Exception as exc:  # pragma: no cover - defensive
                if attempt == self.config.max_retries:
                    raise RuntimeError(
                        "Failed to obtain Evo2 embedding after retries."
                    ) from exc
                time.sleep(backoff * attempt)

        # Fallback (shouldn't reach here because of raise above)
        return self._mock_embedding(sequence)

    def _parse_remote_embedding(self, payload: str) -> Optional[np.ndarray]:
        """Parse embedding vector from remote API payload."""
        try:
            import json

            data = json.loads(payload)
            if isinstance(data, dict):
                emb = data.get("embedding") or data.get("embeddings")
                if isinstance(emb, list):
                    return np.asarray(emb, dtype=np.float32)
        except Exception:
            pass
        return None

    def _local_embedding(self, sequence: str) -> np.ndarray:
        """Generate embeddings using a locally loaded Hugging Face model."""
        if not self._model or not self._tokenizer or not self._torch:
            raise RuntimeError("Local Evo2 model is not initialised.")

        torch = self._torch
        inputs = self._tokenizer(
            sequence,
            return_tensors="pt",
            truncation=True,
            max_length=self.config.max_length,
        )
        inputs = {k: v.to(self._device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self._model(**inputs)

        hidden_state = getattr(outputs, "last_hidden_state", None)
        if hidden_state is None:
            raise RuntimeError("Model output does not contain last_hidden_state.")

        if self.config.pooling == "cls":
            vector = hidden_state[:, 0, :]
        else:
            vector = hidden_state.mean(dim=1)

        return vector.squeeze(0).detach().cpu().numpy().astype(np.float32)


__all__ = ["Evo2EmbeddingGenerator", "Evo2EmbeddingConfig"]

