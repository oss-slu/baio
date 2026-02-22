import time
from datetime import datetime
from functools import lru_cache
from typing import Any, Dict, List, Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, constr

from api.llm_client import LLMClient, SYSTEM_PROMPTS
from binary_classifiers.predict_class import PredictClass

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
    confidence_threshold: float = Field(0.01, ge=0.0, le=1.0)
    batch_size: int = Field(16, ge=1, le=1024)
    enable_ood: bool = False
    ood_threshold: float = Field(0.99, ge=0.0, le=1.0)


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


def _resolve_model_name(config: ModelConfig) -> Literal["RandomForest", "SVM"]:
    model_hint = config.type.lower()
    if "random forest" in model_hint or "random_forest" in model_hint:
        return "RandomForest"
    if "svm" in model_hint:
        return "SVM"
    return "SVM"


@lru_cache(maxsize=2)
def get_predictor(model_name: Literal["RandomForest", "SVM"]) -> PredictClass:
    return PredictClass(model_name=model_name)


def classify_sequence(
    seq_id: str, sequence: str, config: ModelConfig
) -> SequenceResult:
    model_name = _resolve_model_name(config)
    predictor = get_predictor(model_name)

    gc_content = (sequence.upper().count("G") + sequence.upper().count("C")) / max(
        len(sequence), 1
    )
    predicted_label, raw_confidence = predictor.predict_with_confidence(sequence)
    confidence = round(float(raw_confidence), 3)
    ood_score = round(max(0.0, min(1.0, 1.0 - float(raw_confidence))), 3)

    prediction: Literal["Virus", "Host", "Novel"] = predicted_label
    if config.enable_ood and (
        confidence < config.confidence_threshold or ood_score >= config.ood_threshold
    ):
        prediction = "Novel"

    result: Dict[str, Any] = {
        "sequence_id": seq_id,
        "length": len(sequence),
        "gc_content": round(gc_content, 3),
        "prediction": prediction,
        "confidence": confidence,
        "sequence_preview": f"{sequence[:50]}..." if len(sequence) > 50 else sequence,
    }

    if config.enable_ood:
        result.update(
            {
                # Placeholder values derived from model confidence until real OOD heads are wired.
                "mahalanobis_distance": round(1.0 + (ood_score * 4.0), 3),
                "energy_score": round(-1.0 - (ood_score * 4.0), 3),
                "ood_score": ood_score,
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
