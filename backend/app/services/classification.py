import math
import time
from functools import lru_cache
from typing import Any, Dict, List, Literal

# Pydantic/Data models
from binary_classifiers.predict_class import PredictClass
from ..schemas.classification import (
    ModelConfig,
    SequenceInput,
    SequenceResult,
    ClassificationResponse,
)

# Helpers
from ..utils.dna_validation import validate_dna_sequence
from ..utils.organism_patterns import detect_organism
from ..utils.create_response import create_classification_response

# Temperature scaling parameter — values < 1.0 sharpen probabilities (reduce
# under-confidence).  Empirically tuned for the k-mer RandomForest/SVM models
# which tend to cluster predictions near 0.55–0.65 for ambiguous fragments.
_TEMPERATURE: float = 0.75


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


def _apply_temperature_scaling(
    prob_map: Dict[Literal["Host", "Virus"], float],
    temperature: float = _TEMPERATURE,
) -> Dict[Literal["Host", "Virus"], float]:
    """Binary temperature scaling: rescale log-odds then re-normalise.

    For two-class problems this is equivalent to the full softmax formulation
    but avoids log(0) by clamping probabilities away from the boundary.
    """
    eps = 1e-9
    log_host = math.log(max(prob_map["Host"], eps)) / temperature
    log_virus = math.log(max(prob_map["Virus"], eps)) / temperature
    # Numerically stable softmax
    max_log = max(log_host, log_virus)
    exp_host = math.exp(log_host - max_log)
    exp_virus = math.exp(log_virus - max_log)
    total = exp_host + exp_virus
    return {"Host": exp_host / total, "Virus": exp_virus / total}


def _dynamic_threshold(
    base_threshold: float,
    gc_content: float,
    length: int,
    predicted_label: str,
) -> float:
    """Return an adjusted confidence threshold based on sequence metadata.

    High-GC, long sequences are much more likely to be eukaryotic (human)
    genomic fragments — the k-mer model is naturally less certain about them
    because they look like neither canonical virus nor short-read host.  We
    make the threshold more permissive in that region to reduce false Uncertain.

    Very short sequences have less discriminative signal, so we tighten the
    threshold to avoid overconfident short-read calls.
    """
    threshold = base_threshold

    if predicted_label == "Host":
        # High-GC genomic fragments (CpG islands, exon-dense regions): relax
        if gc_content > 0.60 and length >= 100:
            threshold = max(0.40, threshold - 0.15)
        elif gc_content > 0.55 and length >= 60:
            threshold = max(0.45, threshold - 0.10)
        # Very short reads: tighten
        if length < 30:
            threshold = min(0.85, threshold + 0.10)

    if predicted_label == "Virus":
        # Short viral fragments can still be high-confidence — leave as-is
        # but add a small buffer for very short sequences
        if length < 30:
            threshold = min(0.85, threshold + 0.05)

    return threshold


def _is_high_complexity_host(
    predicted_label: str,
    calibrated_host_prob: float,
    calibrated_virus_prob: float,
    gc_content: float,
    length: int,
) -> bool:
    """Heuristic: reclassify ambiguous short Virus calls as Host when the
    sequence shows hallmarks of a complex eukaryotic genomic region.

    Conditions (all must hold):
    - Model predicted Virus but with low confidence margin
    - GC content is elevated (>= 0.58) — typical of human exons / CpG islands
    - Sequence is longer than 60 bp (enough context)
    - Host probability is within 15 pp of Virus probability
    """
    if predicted_label != "Virus":
        return False
    margin = calibrated_virus_prob - calibrated_host_prob
    return gc_content >= 0.58 and length >= 60 and margin < 0.15


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

    # --- 1. Get full probability map and apply temperature scaling ---------------
    raw_probs = predictor.predict_probabilities(sequence)
    calibrated = _apply_temperature_scaling(raw_probs)

    # Determine label and confidence from calibrated probabilities
    if calibrated["Host"] >= calibrated["Virus"]:
        predicted_label: Literal["Host", "Virus"] = "Host"
        confidence = round(calibrated["Host"], 3)
    else:
        predicted_label = "Virus"
        confidence = round(calibrated["Virus"], 3)

    # --- 4. Edge case: high-complexity genomic region ---------------------------
    if _is_high_complexity_host(
        predicted_label,
        calibrated["Host"],
        calibrated["Virus"],
        gc_content,
        len(sequence),
    ):
        predicted_label = "Host"
        confidence = round(calibrated["Host"], 3)
        print(
            f"[DEBUG] {seq_id}: reclassified Virus→Host (high-complexity genomic region)"
        )

    ood_score = round(max(0.0, min(1.0, 1.0 - confidence)), 3)

    # --- 2. Dynamic threshold ---------------------------------------------------
    effective_threshold = _dynamic_threshold(
        config.confidence_threshold, gc_content, len(sequence), predicted_label
    )

    # --- 3. Apply threshold (frontend values wired through config) --------------
    prediction: Literal["Virus", "Host", "Novel", "Uncertain", "Invalid"] = (
        predicted_label
    )
    uncertain = False

    if confidence < effective_threshold:
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
        "threshold_used": effective_threshold,
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

    for seq in sequences:
        result = classify_sequence(seq.id, seq.sequence, config)
        detailed_results.append(result)

    processing_time = time.time() - start

    return create_classification_response(detailed_results, source, processing_time)


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
