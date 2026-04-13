from typing import List, Literal
from pydantic import BaseModel, Field, constr


class ModelConfig(BaseModel):
    type: str = "Binary (Virus vs Host)"
    confidence_threshold: float = Field(0.6, ge=0.0, le=1.0)
    batch_size: int = Field(64, ge=1, le=1024)
    enable_ood: bool = False
    ood_threshold: float = Field(0.99, ge=0.0, le=1.0)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: constr(strip_whitespace=True, min_length=1)


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    mode: str = "default"


class ChatResponse(BaseModel):
    reply: str
