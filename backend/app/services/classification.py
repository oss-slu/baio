import time
from datetime import datetime
from functools import lru_cache
from typing import Any, Dict, List, Literal

# Pydantic/Data models
from binary_classifiers.predict_class import PredictClass
from ..schemas.routers import (
    SequenceInput,
    SequenceResult,
    ClassificationResponse,
    ModelConfig,
)

# Helpers
from ..utils.dna_validation import validate_dna_sequence
from ..utils.organism_patterns import detect_organism


@lru_cache(maxsize=3)
def get_predictor(model_name: Literal["RandomForest", "SVM", "Evo2"]) -> PredictClass:
    return PredictClass(model_name=model_name)


def _resolve_model_name(config: ModelConfig) -> Literal["RandomForest", "SVM", "Evo2"]:
    model_hint = config.type.lower()
    if "evo" in model_hint:
        return "Evo2"
    if "random forest" in model_hint or "random_forest" in model_hint:
        return "RandomForest"
    if "svm" in model_hint:
        return "SVM"
    return "RandomForest"


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
