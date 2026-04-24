from fastapi import APIRouter

from .chat import router as chat_router
from .classify import router as classification_router
from .system import router as system_router
from .user import router as user_router
from .auth import router as auth_router

api_router = APIRouter()

api_router.include_router(chat_router)
api_router.include_router(classification_router)
api_router.include_router(system_router)
api_router.include_router(user_router)
api_router.include_router(auth_router)
