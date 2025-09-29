import json
from prompting import client


def test_llmclient_mock_response_structure(monkeypatch):
    # Ensure no API keys so client runs in mock mode
    monkeypatch.delenv('LLM_API_KEY', raising=False)
    monkeypatch.delenv('GROK_API_KEY', raising=False)

    c = client.LLMClient()
    messages = [{"role": "user", "content": "Test SARS-CoV-2 content"}]
    res = c.chat(messages)

    assert isinstance(res, dict)
    assert 'content' in res and isinstance(res['content'], str)
    assert 'latency_s' in res and res['latency_s'] >= 0
    assert res.get('mock', True) is True

    # Ensure the mock content is JSON-parsable
    parsed = json.loads(res['content'])
    assert 'summary' in parsed
