from typing import List
from pydantic import BaseModel, ConfigDict, Field

from .classification import SequenceResult


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    is_admin: bool = False
    classifications: List[SequenceResult] = Field(default_factory=list)
