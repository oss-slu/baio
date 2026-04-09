from fastapi import APIRouter, HTTPException, Response, status, Depends
from sqlalchemy import select
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
from ..utils.create_response import create_classification_response

router = APIRouter(prefix="/classifications", tags=["Classifications"])


@router.post("/classify", response_model=ClassificationResponse)
def classify(request: ClassificationRequest) -> ClassificationResponse:
    if not request.sequences:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="No sequences provided."
        )

    config = request.config or ModelConfig()
    source = request.source or f"{len(request.sequences)}_sequences"
    return run_classification(request.sequences, config, source)


@router.post("/save")
def save_classification(
    payload: SequenceResult,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    if not payload:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="No results provided.")

    result = Classification(user_id=current_user.id, classification=payload)

    db.add(result)
    db.flush()

    payload.model_copy(update={"id": result.id})

    db.commit()


@router.get("/get", response_model=ClassificationResponse)
def get_user_classifications(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> ClassificationResponse:

    results = db.scalars(
        select(Classification.classification).where(
            Classification.user_id == current_user.id
        )
    ).all()

    return create_classification_response(results)


@router.delete("/delete", status_code=status.HTTP_204_NO_CONTENT)
def delete_classification(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:

    return Response(status.HTTP_204_NO_CONTENT)
