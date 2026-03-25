from fastapi import APIRouter, HTTPException
from typing import Dict, Any

# Import models and logic
from ..models import ClassificationRequest, ClassificationResponse, ModelConfig
from ..services import run_classification

router = APIRouter(prefix="/classify", tags=["Bioinformatics"])


@router.post("/run_pipeline")
async def run_pipeline() -> Dict[str, Any]:
    return {"result": "success"}


@router.post("", response_model=ClassificationResponse)
async def classify(request: ClassificationRequest) -> ClassificationResponse:
    if not request.sequences:
        raise HTTPException(status_code=400, detail="No sequences provided.")

    config = request.config or ModelConfig()
    source = request.source or f"{len(request.sequences)}_sequences"
    return run_classification(request.sequences, config, source)
