from __future__ import annotations

import sys
from types import SimpleNamespace

from metaseq.evo2_client import Evo2Client


def test_chat_returns_response_content_and_latency(monkeypatch) -> None:
    monkeypatch.setenv("NVCF_RUN_KEY", "secret-key")
    client = Evo2Client()

    times = iter([100.0, 101.25])
    monkeypatch.setattr("metaseq.evo2_client.time.time", lambda: next(times))
    monkeypatch.setattr(
        client,
        "_response",
        lambda sequence, temperature, max_tokens: f"{sequence}:{temperature}:{max_tokens}",
    )

    response = client.chat("ACGT", temperature=0.6, max_tokens=12)

    assert client.api_key == "secret-key"
    assert response == {"content": "ACGT:0.6:12", "latency_s": 1.25}


def test_response_posts_expected_payload(monkeypatch) -> None:
    monkeypatch.setenv("NVCF_RUN_KEY", "nvidia-token")
    client = Evo2Client()

    captured: dict[str, object] = {}

    def _post(url: str, headers: dict[str, str], json: dict[str, object]):
        captured["url"] = url
        captured["headers"] = headers
        captured["json"] = json
        return SimpleNamespace(text="generated-response")

    monkeypatch.setitem(sys.modules, "requests", SimpleNamespace(post=_post))

    result = client._response("ATGC", temperature=0.2, max_tokens=44)

    assert result == "generated-response"
    assert captured["url"] == client.base_url
    assert captured["headers"] == {"Authorization": "Bearer nvidia-token"}
    assert captured["json"] == {
        "sequence": "ATGC",
        "temperature": 0.2,
        "num_tokens": 44,
    }
