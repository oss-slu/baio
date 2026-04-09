"""
BAIO Modal Deployment
---------------------
Deploys the BAIO FastAPI backend on Modal with:
  - CPU container for RandomForest / SVM classification (always available)
  - GPU container (A10G) for Evo2 inference (spins up on demand)

Deploy:
    modal deploy modal_app.py

Run locally (for testing):
    modal serve modal_app.py
"""

import modal

# ---------------------------------------------------------------------------
# Container image
# ---------------------------------------------------------------------------
# Mirrors what the Dockerfile does, but as a Modal image definition.
image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("curl", "gcc", "g++")
    .env({"PIP_EXTRA_INDEX_URL": "https://download.pytorch.org/whl/cu121"})
    .pip_install_from_pyproject("pyproject.toml")
    .pip_install(
        "fastapi", "uvicorn[standard]", "pydantic", "sqlalchemy", "python-multipart"
    )
)

# ---------------------------------------------------------------------------
# Modal app
# ---------------------------------------------------------------------------
app = modal.App("baio", image=image)

# ---------------------------------------------------------------------------
# Secrets  (set these via: modal secret create baio-secrets KEY=value ...)
# ---------------------------------------------------------------------------
secrets = [modal.Secret.from_name("baio-secrets")]

# ---------------------------------------------------------------------------
# Persistent volume for SQLite DB
# ---------------------------------------------------------------------------
db_volume = modal.Volume.from_name("baio-db", create_if_missing=True)
DB_MOUNT_PATH = "/data/db"

# ---------------------------------------------------------------------------
# Model weights volume  (upload once with: modal volume put baio-weights ...)
# ---------------------------------------------------------------------------
weights_volume = modal.Volume.from_name("baio-weights", create_if_missing=True)
WEIGHTS_MOUNT_PATH = "/data/weights"


# ---------------------------------------------------------------------------
# CPU endpoint — RandomForest / SVM classification + chat
# Scales to zero when idle, cold start ~5s
# ---------------------------------------------------------------------------
@app.function(
    secrets=secrets,
    volumes={
        DB_MOUNT_PATH: db_volume,
        WEIGHTS_MOUNT_PATH: weights_volume,
    },
    # Keep one warm container to avoid cold starts on first request
    keep_warm=1,
    # Max 10 concurrent containers
    max_containers=10,
    timeout=120,
)
@modal.asgi_app()
def fastapi_app():
    import os
    import sys

    # Add project root to path so backend can find binary_classifiers, etc.
    sys.path.insert(0, "/app")

    # Point SQLite DB to the persistent volume
    os.environ["DB_PATH"] = f"{DB_MOUNT_PATH}/app.db"
    os.environ["WEIGHTS_DIR"] = WEIGHTS_MOUNT_PATH

    from backend.app.main import app as _app

    return _app


# ---------------------------------------------------------------------------
# GPU endpoint — Evo2 inference only
# Spins up an A10G on demand, scales to zero when idle
# cold start ~60-90s (model download first time, ~30s after cached)
# ---------------------------------------------------------------------------
@app.function(
    gpu="A10G",
    secrets=secrets,
    volumes={
        WEIGHTS_MOUNT_PATH: weights_volume,
    },
    # Do NOT keep warm — GPU is expensive; spin up on demand only
    keep_warm=0,
    timeout=300,
    # Cache the Evo2 model weights on the volume between requests
    container_idle_timeout=60,
)
def run_evo2_inference(sequence: str, model_size: str = "7b") -> dict:
    """
    Run Evo2 inference on a single DNA sequence.
    Called by the CPU endpoint when model type is Evo2.

    Returns a dict with keys: embedding (list[float]), success (bool), error (str|None)
    """
    import os
    import sys

    sys.path.insert(0, "/app")
    os.environ["WEIGHTS_DIR"] = WEIGHTS_MOUNT_PATH

    try:
        from binary_classifiers.evo2_embedder import Evo2Embedder

        embedder = Evo2Embedder(model_size=model_size, device="cuda")
        embedding = embedder.get_embedding(sequence)
        if embedding is None:
            return {
                "success": False,
                "error": "Embedding returned None",
                "embedding": [],
            }
        return {"success": True, "error": None, "embedding": embedding.tolist()}
    except Exception as e:
        return {"success": False, "error": str(e), "embedding": []}
