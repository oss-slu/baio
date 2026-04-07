from pydantic import BaseModel, Field
from typing import List
from .routers import SequenceResult


# Create Lists
class UserCreate(BaseModel):
    name: str
    email: str


# Storing Sequences
class ClassificationRead(BaseModel):
    id: int
    sequence: str
    classification: SequenceResult

    class Config:
        from_attributes = True


# Response Check
class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    classifications: List[SequenceResult] = Field(default_factory=list)

    class Config:
        from_attributes = True
