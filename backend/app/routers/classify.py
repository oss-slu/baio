from fastapi import APIRouter, HTTPException
from typing import Dict

# Import models and logic
from ..services.classification import run_classification, get_predictor
from ..schemas.routers import ClassificationRequest, ClassificationResponse, ModelConfig

router = APIRouter(prefix="/classify", tags=["Classifications"])


@router.post("", response_model=ClassificationResponse)
async def classify(request: ClassificationRequest) -> ClassificationResponse:
    if not request.sequences:
        raise HTTPException(status_code=400, detail="No sequences provided.")

    config = request.config or ModelConfig()
    source = request.source or f"{len(request.sequences)}_sequences"
    return run_classification(request.sequences, config, source)


@router.post("/reload_models")
async def reload_models() -> Dict[str, str]:
    """Clear model cache to reload updated models."""
    get_predictor.cache_clear()
    return {"status": "model cache cleared"}
