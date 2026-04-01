from fastapi import APIRouter, HTTPException

# Import models and logic
from ..services.classification import run_classification
from ..schemas.routers import ClassificationRequest, ClassificationResponse, ModelConfig

router = APIRouter(prefix="/classify", tags=["Classifications"])


@router.post("", response_model=ClassificationResponse)
async def classify(request: ClassificationRequest) -> ClassificationResponse:
    if not request.sequences:
        raise HTTPException(status_code=400, detail="No sequences provided.")

    config = request.config or ModelConfig()
    source = request.source or f"{len(request.sequences)}_sequences"
    return run_classification(request.sequences, config, source)
