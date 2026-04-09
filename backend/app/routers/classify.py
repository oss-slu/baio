from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

# Import models and logic
from ..database import get_db
from ..services.classification import run_classification
from ..schemas.routers import (
    ClassificationRequest,
    ClassificationResponse,
    ModelConfig,
    SequenceResult,
)
from ..models import Classification, User

# Import utilities
from ..utils.user import get_current_user

router = APIRouter(prefix="/classifications", tags=["Classifications"])


@router.post("/classify", response_model=ClassificationResponse)
async def classify(request: ClassificationRequest) -> ClassificationResponse:
    if not request.sequences:
        raise HTTPException(status_code=400, detail="No sequences provided.")

    config = request.config or ModelConfig()
    source = request.source or f"{len(request.sequences)}_sequences"
    return run_classification(request.sequences, config, source)


@router.post("/save")
async def save_classification(
    payload: SequenceResult,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    if not payload:
        raise HTTPException(status_code=400, detail="No results provided.")

    result = Classification(user_id=current_user.id, classification=payload)

    db.add(result)
    db.commit()
