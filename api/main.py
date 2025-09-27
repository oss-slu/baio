from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

class RunRequest(BaseModel):
    input_path: str

@app.post("/run")
def run_pipeline(req: RunRequest):
    # placeholder;
    return {"ok": True, "note": f"pretend we processed {req.input_path}"}
