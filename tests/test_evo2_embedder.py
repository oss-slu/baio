from __future__ import annotations

from types import SimpleNamespace

import numpy as np
import pytest

_evo2_deps_available = False
try:
    import torch  # noqa: F401
    import transformers  # noqa: F401

    _evo2_deps_available = True
except ImportError:
    pass

pytestmark = pytest.mark.skipif(
    not _evo2_deps_available,
    reason="Evo2 dependencies not installed — run: pip install baio[evo2]",
)

import binary_classifiers.evo2_embedder as evo2_module  # noqa: E402


class _FakeTensor:
    def __init__(self, data) -> None:
        self.data = np.asarray(data, dtype=float)

    def cuda(self) -> "_FakeTensor":
        return self

    def unsqueeze(self, dim: int) -> "_FakeTensor":
        return _FakeTensor(np.expand_dims(self.data, dim))

    def expand(self, shape) -> "_FakeTensor":
        return _FakeTensor(np.broadcast_to(self.data, shape))

    def float(self) -> "_FakeTensor":
        return self

    def size(self):
        return self.data.shape

    def sum(self, dim: int | None = None) -> "_FakeTensor":
        return _FakeTensor(self.data.sum(axis=dim))

    def mean(self, dim: int | None = None) -> "_FakeTensor":
        return _FakeTensor(self.data.mean(axis=dim))

    def cpu(self) -> "_FakeTensor":
        return self

    def numpy(self) -> np.ndarray:
        return self.data

    def __mul__(self, other) -> "_FakeTensor":
        other_data = other.data if isinstance(other, _FakeTensor) else other
        return _FakeTensor(self.data * other_data)

    def __truediv__(self, other) -> "_FakeTensor":
        other_data = other.data if isinstance(other, _FakeTensor) else other
        return _FakeTensor(self.data / other_data)


class _FakeNoGrad:
    def __enter__(self) -> None:
        return None

    def __exit__(self, exc_type, exc, tb) -> bool:
        return False


class _FakeCuda:
    def __init__(self, available: bool, memory_gb: float = 16.0) -> None:
        self._available = available
        self._memory_gb = memory_gb

    def is_available(self) -> bool:
        return self._available

    def get_device_name(self, _: int) -> str:
        return "Fake GPU"

    def get_device_properties(self, _: int):
        return SimpleNamespace(total_memory=int(self._memory_gb * (1024**3)))


class _FakeTorch:
    float16 = "float16"
    float32 = "float32"

    def __init__(self, cuda_available: bool, memory_gb: float = 16.0) -> None:
        self.cuda = _FakeCuda(cuda_available, memory_gb)

    def no_grad(self) -> _FakeNoGrad:
        return _FakeNoGrad()

    def sum(self, tensor: _FakeTensor, dim: int) -> _FakeTensor:
        return tensor.sum(dim)

    def clamp(self, tensor: _FakeTensor, min: float) -> _FakeTensor:
        return _FakeTensor(np.maximum(tensor.data, min))


class _FakeTokenizerInstance:
    def __call__(
        self,
        sequences,
        return_tensors: str,
        truncation: bool,
        max_length: int,
        padding: bool = False,
    ):
        del return_tensors, truncation, padding
        if isinstance(sequences, str):
            sequence_list = [sequences]
        else:
            sequence_list = list(sequences)

        lengths = [min(len(seq), max_length) for seq in sequence_list]
        max_len = max(lengths) if lengths else 0

        token_rows = []
        mask_rows = []
        for length in lengths:
            tokens = list(range(1, length + 1))
            pad = max_len - length
            token_rows.append(tokens + [0] * pad)
            mask_rows.append([1] * length + [0] * pad)

        return {
            "input_ids": _FakeTensor(token_rows),
            "attention_mask": _FakeTensor(mask_rows),
        }


class _FakeTokenizer:
    @staticmethod
    def from_pretrained(model_name: str, trust_remote_code: bool = True):
        del model_name, trust_remote_code
        return _FakeTokenizerInstance()


class _FakeModelInstance:
    def eval(self) -> "_FakeModelInstance":
        return self

    def __call__(self, **inputs):
        input_ids = inputs["input_ids"].data
        hidden_states = np.stack([input_ids, input_ids + 1], axis=-1)
        return SimpleNamespace(hidden_states=[_FakeTensor(hidden_states)])


class _FakeModel:
    @staticmethod
    def from_pretrained(
        model_name: str,
        trust_remote_code: bool = True,
        torch_dtype=None,
        device_map=None,
    ):
        del model_name, trust_remote_code, torch_dtype, device_map
        return _FakeModelInstance()


def _install_fake_runtime(
    monkeypatch,
    *,
    cuda_available: bool = False,
    memory_gb: float = 16.0,
) -> None:
    monkeypatch.setattr(evo2_module, "TRANSFORMERS_AVAILABLE", True)
    monkeypatch.setattr(evo2_module, "AUTO_TOKENIZER", _FakeTokenizer)
    monkeypatch.setattr(evo2_module, "AUTO_MODEL_FOR_CAUSAL_LM", _FakeModel)
    monkeypatch.setattr(
        evo2_module,
        "TORCH",
        _FakeTorch(cuda_available=cuda_available, memory_gb=memory_gb),
    )


def test_embedder_loads_model_and_generates_embeddings(monkeypatch) -> None:
    _install_fake_runtime(monkeypatch, cuda_available=False)
    embedder = evo2_module.Evo2Embedder(device="cpu", batch_size=2, max_length=4)

    assert embedder.load_model() is True

    embedding = embedder.get_embedding("acgtac")
    batch_embeddings = embedder.get_embeddings_batch(["AAAA", "AA"])

    assert embedder.initialized is True
    assert embedding is not None
    assert embedding.shape == (2,)
    assert batch_embeddings is not None
    assert len(batch_embeddings) == 2
    assert all(item.shape == (2,) for item in batch_embeddings)


def test_embedder_returns_false_when_model_load_fails(monkeypatch) -> None:
    class _BrokenTokenizer:
        @staticmethod
        def from_pretrained(*args, **kwargs):
            raise RuntimeError("broken tokenizer")

    monkeypatch.setattr(evo2_module, "TRANSFORMERS_AVAILABLE", True)
    monkeypatch.setattr(evo2_module, "AUTO_TOKENIZER", _BrokenTokenizer)
    monkeypatch.setattr(evo2_module, "AUTO_MODEL_FOR_CAUSAL_LM", _FakeModel)
    monkeypatch.setattr(evo2_module, "TORCH", _FakeTorch(cuda_available=False))

    embedder = evo2_module.Evo2Embedder(device="cpu")

    assert embedder.load_model() is False
    assert embedder.get_embedding("AAAA") is None


def test_embedder_reports_availability_and_requirement_tiers(monkeypatch) -> None:
    _install_fake_runtime(monkeypatch, cuda_available=True, memory_gb=80.0)

    gpu_embedder = evo2_module.Evo2Embedder(device="cuda")
    status = evo2_module.check_evo2_requirements()

    assert gpu_embedder.is_available() is True
    assert status["cuda_available"] is True
    assert status["meets_requirements"] is True
    assert status["recommended_model"] == "40b"


def test_embedder_requirements_without_transformers(monkeypatch) -> None:
    monkeypatch.setattr(evo2_module, "TRANSFORMERS_AVAILABLE", False)
    monkeypatch.setattr(evo2_module, "AUTO_TOKENIZER", None)
    monkeypatch.setattr(evo2_module, "AUTO_MODEL_FOR_CAUSAL_LM", None)
    monkeypatch.setattr(evo2_module, "TORCH", None)

    embedder = evo2_module.Evo2Embedder(device="cpu")
    status = evo2_module.check_evo2_requirements()

    assert embedder.is_available() is False
    assert status == {
        "transformers_available": False,
        "cuda_available": False,
        "gpu_name": None,
        "gpu_memory_gb": 0.0,
        "meets_requirements": False,
        "recommended_model": None,
    }
