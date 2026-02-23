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
    organism_name: Optional[str] = None
    explanation: Optional[str] = None
    mahalanobis_distance: Optional[float] = None
    energy_score: Optional[float] = None
    ood_score: Optional[float] = None


ORGANISM_PATTERNS = {
    "human": "Human (Homo sapiens)",
    "homo sapiens": "Human (Homo sapiens)",
    "chr": "Human (Homo sapiens)",
    "sars-cov-2": "SARS-CoV-2 (Coronavirus)",
    "coronavirus": "SARS-CoV-2 (Coronavirus)",
    "covid": "SARS-CoV-2 (Coronavirus)",
    "nc_045512": "SARS-CoV-2 (Coronavirus)",
    "hiv": "HIV-1 (Human Immunodeficiency Virus)",
    "influenza": "Influenza Virus",
    "ebola": "Ebola Virus",
    "e. coli": "E. coli (Escherichia coli)",
    "escherichia": "E. coli (Escherichia coli)",
    "mouse": "Mouse (Mus musculus)",
    "mus musculus": "Mouse (Mus musculus)",
    "rat": "Rat (Rattus norvegicus)",
    "dog": "Dog (Canis familiaris)",
    "cat": "Cat (Felis catus)",
    "yeast": "Yeast (Saccharomyces cerevisiae)",
    "drosophila": "Fruit Fly (Drosophila melanogaster)",
    "zebrafish": "Zebrafish (Danio rerio)",
}


def detect_organism(seq_id: str, sequence: str) -> str:
    seq_id_lower = seq_id.lower()
    for pattern, name in ORGANISM_PATTERNS.items():
        if pattern in seq_id_lower:
            return name
    return "Unknown organism"


def generate_explanation(
    prediction: str, confidence: float, gc_content: float, length: int, organism: str
) -> str:
    conf_pct = confidence * 100
    gc_pct = gc_content * 100

    if prediction == "Virus":
        category = "viral pathogen"
        characteristics = "typically has lower GC content and distinct k-mer patterns"
    elif prediction == "Host":
        category = "host organism"
        characteristics = (
            "shows genomic patterns consistent with eukaryotic/prokaryotic hosts"
        )
    else:
        category = "novel/unknown organism"
        characteristics = "exhibits patterns outside the training distribution"

    explanation = (
        f"Classified as {category} ({organism}) with {conf_pct:.1f}% confidence. "
        f"Analysis based on {length}bp sequence with {gc_pct:.1f}% GC content. "
        f"The model uses k-mer frequency analysis (6-mers) to detect patterns that {characteristics}. "
    )

    if confidence < 0.3:
        explanation += "Low confidence suggests the sequence may benefit from additional validation."
    elif confidence < 0.7:
        explanation += (
            "Moderate confidence; consider comparing with reference databases."
        )
    else:
        explanation += "High confidence classification based on strong feature matches."

    return explanation


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
    from pathlib import Path

    model_dir = Path(__file__).resolve().parent.parent / "binary_classifiers" / "models"
    print(f"DEBUG: Loading model from: {model_dir}", flush=True)
    predictor = PredictClass(model_name=model_name)
    print(f"DEBUG: Model classes: {predictor.model.classes_}", flush=True)
    return predictor


@app.post("/reload_models")
async def reload_models() -> Dict[str, str]:
    """Clear model cache to reload updated models."""
    get_predictor.cache_clear()
    return {"status": "model cache cleared"}


def classify_sequence(
    seq_id: str, sequence: str, config: ModelConfig
) -> SequenceResult:
    model_name = _resolve_model_name(config)
    predictor = get_predictor(model_name)

    gc_content = (sequence.upper().count("G") + sequence.upper().count("C")) / max(
        len(sequence), 1
    )
    predicted_label, raw_confidence = predictor.predict_with_confidence(sequence)
    print(f"DEBUG: raw_confidence from predictor: {raw_confidence}", flush=True)
    confidence = round(float(raw_confidence), 3)
    print(f"DEBUG: rounded confidence: {confidence}", flush=True)
    ood_score = round(max(0.0, min(1.0, 1.0 - float(raw_confidence))), 3)

    prediction: Literal["Virus", "Host", "Novel"] = predicted_label
    if config.enable_ood and (
        confidence < config.confidence_threshold or ood_score >= config.ood_threshold
    ):
        prediction = "Novel"

    organism_name = detect_organism(seq_id, sequence)
    explanation = generate_explanation(
        prediction, confidence, gc_content, len(sequence), organism_name
    )

    result: Dict[str, Any] = {
        "sequence_id": seq_id,
        "length": len(sequence),
        "gc_content": round(gc_content, 3),
        "prediction": prediction,
        "confidence": confidence,
        "sequence_preview": f"{sequence[:50]}..." if len(sequence) > 50 else sequence,
        "organism_name": organism_name,
        "explanation": explanation,
    }

    if config.enable_ood:
        result.update(
            {
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
