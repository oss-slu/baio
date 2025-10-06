from prompting import client
import json
from typing import Any


def test_mock_inconclusive_response(monkeypatch: Any) -> None:
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    monkeypatch.delenv("GROK_API_KEY", raising=False)

    c = client.LLMClient()
    messages = [{"role": "user", "content": "This is inconclusive or low evidence"}]
    res = c.chat(messages)

    parsed = json.loads(res["content"])
    assert (
        parsed["summary"].lower().startswith("inconclusive")
        or "insufficient" in parsed["summary"].lower()
    )
    assert isinstance(parsed.get("ood_rate", 0), float)


def test_mock_generic_response(monkeypatch: Any) -> None:
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    monkeypatch.delenv("GROK_API_KEY", raising=False)

    c = client.LLMClient()
    messages = [{"role": "user", "content": "hello world"}]
    res = c.chat(messages)

    parsed = json.loads(res["content"])
    assert parsed.get("summary") == "Mock analysis result"
