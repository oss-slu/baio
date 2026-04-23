from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base
from ..utils.sql_type_decorator import PydanticJSONType
from ..schemas.classification import SequenceResult


class Classification(Base):
    __tablename__ = "classifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    classification = Column(PydanticJSONType(SequenceResult))

    # Many → One relationship
    user = relationship("User", back_populates="classifications")

    def __repr__(self):
        pred = self.classification.prediction if self.classification else "N/A"
        return f"<Classification id={self.id} user_id={self.user_id} classicfication={pred}>"
