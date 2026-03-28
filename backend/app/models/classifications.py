from sqlalchemy import Column, String
from ..database import Base


class Classifications(Base):
    __tablename__ = "classifications"

    user = Column(String, primary_key=True)
    sequence = Column(String)
    classification = Column(String)
