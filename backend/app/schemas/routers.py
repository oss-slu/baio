from typing import List, Literal, Optional
from pydantic import BaseModel, Field, constr


class ModelConfig(BaseModel):
    type: str = "Binary (Virus vs Host)"
    confidence_threshold: float = Field(0.6, ge=0.0, le=1.0)
    batch_size: int = Field(64, ge=1, le=1024)
    enable_ood: bool = False
    ood_threshold: float = Field(0.99, ge=0.0, le=1.0)


class SequenceInput(BaseModel):
    sequence_id: str
    sequence: str


class ClassificationRequest(BaseModel):
    sequences: List[SequenceInput]
    config: Optional[ModelConfig] = None
    source: Optional[str] = None


class SequenceResult(BaseModel):
    id: Optional[int] = None
    sequence_id: str
    length: int
    gc_content: float
    prediction: Literal["Virus", "Host", "Novel", "Uncertain", "Invalid"]
    confidence: float
    sequence_preview: str
    organism_name: Optional[str] = None
    explanation: Optional[str] = None
    mahalanobis_distance: Optional[float] = None
    energy_score: Optional[float] = None
    ood_score: Optional[float] = None
    uncertain: Optional[bool] = False
    threshold_used: Optional[float] = None


class ClassificationResponse(BaseModel):
    total_sequences: int
    virus_count: int
    host_count: int
    novel_count: int
    uncertain_count: int
    detailed_results: List[SequenceResult]
    source: str
    timestamp: str
    processing_time: float


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: constr(strip_whitespace=True, min_length=1)


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    mode: str = "default"


class ChatResponse(BaseModel):
    reply: str
