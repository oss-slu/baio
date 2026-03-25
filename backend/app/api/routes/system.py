from fastapi import APIRouter
from typing import Dict

# Import the predictor function relevant to this router
# Note: In a real app, 'get_predictor' might live in a shared 'services' file
from ..main import get_predictor

router = APIRouter(prefix="/system", tags=["System"])


@router.post("/reload_models")
async def reload_models() -> Dict[str, str]:
    """Clear model cache to reload updated models."""
    get_predictor.cache_clear()
    return {"status": "model cache cleared"}


@router.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "healthy"}
