from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import system, classification, chat

app = FastAPI()

# Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the grouped routes
app.include_router(system.router)
app.include_router(classification.router)
app.include_router(chat.router)
