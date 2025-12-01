import random
import time
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, constr

from api.llm_client import LLMClient, SYSTEM_PROMPTS

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SequenceInput(BaseModel):
    id: constr(strip_whitespace=True, min_length=1)
    sequence: constr(strip_whitespace=True, min_length=1)


class ModelConfig(BaseModel):
    type: str = "Binary (Virus vs Host)"
    confidence_threshold: float = Field(0.5, ge=0.0, le=1.0)
    batch_size: int = Field(16, ge=1, le=1024)
    enable_ood: bool = True
    ood_threshold: float = Field(0.3, ge=0.0, le=1.0)


class ClassificationRequest(BaseModel):
    sequences: List[SequenceInput]
    config: Optional[ModelConfig] = None
    source: Optional[str] = None


class SequenceResult(BaseModel):
    sequence_id: str
    length: int
    gc_content: float
    prediction: Literal["Virus", "Host", "Novel"]
    confidence: float
    sequence_preview: str
    mahalanobis_distance: Optional[float] = None
    energy_score: Optional[float] = None
    ood_score: Optional[float] = None


class ClassificationResponse(BaseModel):
    total_sequences: int
    virus_count: int
    host_count: int
    novel_count: int
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


def classify_sequence(
    seq_id: str, sequence: str, config: ModelConfig
) -> SequenceResult:
    """Mock classification logic for API usage."""
    gc_content = (sequence.upper().count("G") + sequence.upper().count("C")) / max(
        len(sequence), 1
    )

    if gc_content > 0.6:
        predictions = ["Virus"] * 60 + ["Host"] * 30 + ["Novel"] * 10
    elif gc_content < 0.3:
        predictions = ["Host"] * 70 + ["Virus"] * 20 + ["Novel"] * 10
    else:
        predictions = ["Virus"] * 40 + ["Host"] * 50 + ["Novel"] * 10

    prediction = random.choice(predictions)
    confidence = random.uniform(
        max(config.confidence_threshold, 0.5), 0.95
    )  # keep mock scores reasonable

    result: Dict[str, Any] = {
        "sequence_id": seq_id,
        "length": len(sequence),
        "gc_content": round(gc_content, 3),
        "prediction": prediction,
        "confidence": round(confidence, 3),
        "sequence_preview": f"{sequence[:50]}..." if len(sequence) > 50 else sequence,
    }

    if config.enable_ood:
        result.update(
            {
                "mahalanobis_distance": round(random.uniform(1.0, 5.0), 3),
                "energy_score": round(random.uniform(-5.0, -1.0), 3),
                "ood_score": round(random.uniform(0.0, 1.0), 3),
            }
        )

    return SequenceResult(**result)


def run_classification(
    sequences: List[SequenceInput], config: ModelConfig, source: str
) -> ClassificationResponse:
    start = time.time()
    detailed_results: List[SequenceResult] = []
    virus_count = host_count = novel_count = 0

    for seq in sequences:
        result = classify_sequence(seq.id, seq.sequence, config)
        detailed_results.append(result)

        if result.prediction == "Virus":
            virus_count += 1
        elif result.prediction == "Host":
            host_count += 1
        else:
            novel_count += 1

    processing_time = time.time() - start

    response = ClassificationResponse(
        total_sequences=len(sequences),
        virus_count=virus_count,
        host_count=host_count,
        novel_count=novel_count,
        detailed_results=detailed_results,
        source=source,
        timestamp=datetime.now().isoformat(),
        processing_time=processing_time,
    )
    return response


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "healthy"}


@app.post("/run_pipeline")
async def run_pipeline() -> Dict[str, Any]:
    return {"result": "success"}


@app.post("/classify", response_model=ClassificationResponse)
async def classify(request: ClassificationRequest) -> ClassificationResponse:
    if not request.sequences:
        raise HTTPException(status_code=400, detail="No sequences provided.")

    config = request.config or ModelConfig()
    source = request.source or f"{len(request.sequences)}_sequences"
    return run_classification(request.sequences, config, source)


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages cannot be empty.")

    mode_prompt = SYSTEM_PROMPTS.get(request.mode, SYSTEM_PROMPTS["default"])
    client = LLMClient()
    reply = client.generate_response(
        [{"role": msg.role, "content": msg.content} for msg in request.messages],
        mode_prompt,
    )
    return ChatResponse(reply=reply)
