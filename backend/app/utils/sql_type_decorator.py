from typing import Any, Type
from pydantic import BaseModel
from sqlalchemy import JSON, TypeDecorator


class PydanticJSONType(TypeDecorator):
    impl = JSON
    cache_ok = True

    def __init__(self, pydantic_model: Type[BaseModel], *args, **kwargs):
        self.pydantic_model = pydantic_model
        super().__init__(*args, **kwargs)

    def process_bind_param(self, value: Any, dialect) -> Any:
        # Python -> Database: Convert Pydantic model to dict
        if value is None:
            return None
        # If it's already a dict, validate it, otherwise dump the model
        if isinstance(value, self.pydantic_model):
            return value.model_dump()
        return value

    def process_result_value(self, value: Any, dialect) -> Any:
        # Database -> Python: Convert dict to Pydantic model
        if value is None:
            return None
        return self.pydantic_model.model_validate(value)
