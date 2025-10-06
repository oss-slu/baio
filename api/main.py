from fastapi import FastAPI
from typing import Dict, Any

app = FastAPI()


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "healthy"}


@app.post("/run_pipeline")
async def run_pipeline() -> Dict[str, Any]:
    return {"result": "success"}
