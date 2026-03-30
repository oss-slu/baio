from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class Classification(Base):
    __tablename__ = "classifications"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    sequence = Column(String)
    classification = Column(String)

    # Many → One relationship
    user = relationship("User", back_populates="classifications")

    def __repr__(self):
        return f"<Classification id={self.id} user_id={self.user_id} classification={self.classification}>"
