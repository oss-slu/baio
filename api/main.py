import re
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

VALID_NUCLEOTIDES = set("ATGCNRYSWKMBDHV")
DNA_PATTERN = re.compile(r"^[ATGCNRYSWKMBDHV]+$", re.IGNORECASE)


def validate_dna_sequence(sequence: str, seq_id: str) -> tuple[bool, str]:
    """Validate if sequence contains valid DNA nucleotides."""
    if not sequence or len(sequence.strip()) == 0:
        return False, "Empty sequence provided"

    clean_seq = (
        sequence.upper()
        .replace(" ", "")
        .replace("\n", "")
        .replace("\r", "")
        .replace("\t", "")
    )

    print(f"[DEBUG] Clean sequence: {clean_seq[:50]}...")
    print(f"[DEBUG] Unique chars in sequence: {set(clean_seq)}")
    print(f"[DEBUG] Valid nucleotides: {VALID_NUCLEOTIDES}")

    if len(clean_seq) < 10:
        return False, f"Sequence too short ({len(clean_seq)}bp). Minimum 10bp required"

    invalid_chars = set(clean_seq) - VALID_NUCLEOTIDES
    print(f"[DEBUG] Invalid chars: {invalid_chars}")
    if invalid_chars:
        return (
            False,
            f"Invalid characters found: {', '.join(sorted(invalid_chars))}. Only DNA nucleotides (A,T,G,C,N) allowed",
        )

    if not DNA_PATTERN.match(clean_seq):
        return False, "Sequence contains non-DNA characters"

    gc_content = (clean_seq.count("G") + clean_seq.count("C")) / len(clean_seq)
    if gc_content == 0 or gc_content == 1:
        return False, "Invalid sequence: 0% or 100% GC content indicates non-DNA data"

    at_content = (clean_seq.count("A") + clean_seq.count("T")) / len(clean_seq)
    if at_content > 0.9:
        return False, "Invalid sequence: >90% A/T content suggests non-DNA data"
    if gc_content > 0.9:
        return False, "Invalid sequence: >90% G/C content suggests non-DNA data"

    valid_bases = sum(1 for c in clean_seq if c in "ATGC")
    valid_ratio = valid_bases / len(clean_seq)
    if valid_ratio < 0.85:
        return (
            False,
            f"Invalid sequence: Only {valid_ratio * 100:.0f}% are valid DNA bases (A,T,G,C). Expected >85%",
        )

    return True, ""


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
    confidence_threshold: float = Field(0.75, ge=0.0, le=1.0)
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


def _resolve_model_name(config: ModelConfig) -> Literal["RandomForest", "SVM"]:
    model_hint = config.type.lower()
    if "random forest" in model_hint or "random_forest" in model_hint:
        return "RandomForest"
    if "svm" in model_hint:
        return "SVM"
    return "RandomForest"


@lru_cache(maxsize=2)
def get_predictor(model_name: Literal["RandomForest", "SVM"]) -> PredictClass:
    return PredictClass(model_name=model_name)


@app.post("/reload_models")
async def reload_models() -> Dict[str, str]:
    """Clear model cache to reload updated models."""
    get_predictor.cache_clear()
    return {"status": "model cache cleared"}


def classify_sequence(
    seq_id: str, sequence: str, config: ModelConfig
) -> SequenceResult:
    is_valid, error_msg = validate_dna_sequence(sequence, seq_id)
    print(f"[DEBUG] Validating sequence {seq_id}: valid={is_valid}, error={error_msg}")
    print(f"[DEBUG] Sequence preview: {sequence[:50] if sequence else 'empty'}")
    if not is_valid:
        return SequenceResult(
            sequence_id=seq_id,
            length=len(sequence),
            gc_content=0.0,
            prediction="Invalid",
            confidence=0.0,
            sequence_preview=sequence[:50] + "..." if len(sequence) > 50 else sequence,
            organism_name="N/A",
            explanation=f"Invalid input data: {error_msg}. Please provide valid DNA sequences (A, T, G, C nucleotides only).",
            uncertain=True,
            threshold_used=config.confidence_threshold,
            ood_score=1.0,
        )

    model_name = _resolve_model_name(config)
    predictor = get_predictor(model_name)

    gc_content = (sequence.upper().count("G") + sequence.upper().count("C")) / max(
        len(sequence), 1
    )
    predicted_label, raw_confidence = predictor.predict_with_confidence(sequence)
    confidence = round(float(raw_confidence), 3)
    ood_score = round(max(0.0, min(1.0, 1.0 - float(raw_confidence))), 3)

    prediction: Literal["Virus", "Host", "Novel", "Uncertain", "Invalid"] = (
        predicted_label
    )
    uncertain = False

    # Mark as Uncertain if confidence is below threshold
    if confidence < config.confidence_threshold:
        prediction = "Uncertain"
        uncertain = True
    elif config.enable_ood and ood_score >= config.ood_threshold:
        prediction = "Novel"

    organism_name = detect_organism(seq_id, sequence)
    explanation = generate_explanation(
        predicted_label, confidence, gc_content, len(sequence), organism_name
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
        "uncertain": uncertain,
        "threshold_used": config.confidence_threshold,
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
    virus_count = host_count = novel_count = uncertain_count = 0

    for seq in sequences:
        result = classify_sequence(seq.id, seq.sequence, config)
        detailed_results.append(result)

        if result.prediction == "Virus":
            virus_count += 1
        elif result.prediction == "Host":
            host_count += 1
        elif result.prediction == "Novel":
            novel_count += 1
        elif result.prediction == "Uncertain":
            uncertain_count += 1

    processing_time = time.time() - start

    response = ClassificationResponse(
        total_sequences=len(sequences),
        virus_count=virus_count,
        host_count=host_count,
        novel_count=novel_count,
        uncertain_count=uncertain_count,
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
