from typing import TypedDict

class LLMResponse(TypedDict):
    content: str
    latency_s: float
    mock: bool