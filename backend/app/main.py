import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from .routers import api_router  # noqa: E402
from .database import Base, engine  # noqa: E402

_raw = os.environ.get("CORS_ORIGINS")
if not _raw:
    raise RuntimeError("CORS_ORIGINS env var is required. See .env.example for format.")
CORS_ORIGINS = [o.strip() for o in _raw.split(",")]


app = FastAPI()

# Create tables
Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(api_router)

# Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
