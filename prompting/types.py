from typing import TypedDict, List, Dict, Protocol


class Pathogen(TypedDict):
    taxon: str
    confidence: float


class Report(TypedDict):
    summary: str
    known_pathogens: List[Pathogen]
    ood_rate: float
    caveats: List[str]


class LLMResponse(TypedDict):
    content: str
    latency_s: float
    mock: bool


class LLMClientProto(Protocol):
    def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1000,
    ) -> LLMResponse: ...
