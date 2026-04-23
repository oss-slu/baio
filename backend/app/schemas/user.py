from typing import List
from pydantic import BaseModel, Field

from .classification import SequenceResult


class UserCreate(BaseModel):
    name: str
    email: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    classifications: List[SequenceResult] = Field(default_factory=list)

    class Config:
        from_attributes = True
