from fastapi import APIRouter
from typing import Dict, Any

# Import the predictor function relevant to this router
# Note: In a real app, 'get_predictor' might live in a shared 'services' file
from ..services.classification import get_predictor

router = APIRouter(prefix="/system", tags=["System"])


@router.post("/reload_models")
def reload_models() -> Dict[str, str]:
    """Clear model cache to reload updated models."""
    get_predictor.cache_clear()
    return {"status": "model cache cleared"}


@router.get("/health")
def health() -> Dict[str, Any]:
    from binary_classifiers.evo2_embedder import check_evo2_requirements

    evo2 = check_evo2_requirements()
    return {
        "status": "healthy",
        "evo2_available": evo2["meets_requirements"],
        "gpu": evo2["gpu_name"],
        "gpu_memory_gb": evo2["gpu_memory_gb"],
    }


@router.post("/run_pipeline")
def run_pipeline() -> Dict[str, Any]:
    return {"result": "success"}
