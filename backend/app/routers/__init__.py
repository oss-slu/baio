from fastapi import APIRouter

from .chat import router as chat_router
from .classify import router as classification_router
from .system import router as system_router

api_router = APIRouter()

api_router.include_router(chat_router)
api_router.include_router(classification_router)
api_router.include_router(system_router)
