from pydantic import BaseModel, Field
from typing import List


# Create Lists
class UserCreate(BaseModel):
    name: str
    email: str


class ClassificationCreate(BaseModel):
    sequence: str
    classification: str


# Response Checks


class ClassificationResponse(BaseModel):
    id: int
    sequence: str
    classification: str

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    classifications: List[ClassificationResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
