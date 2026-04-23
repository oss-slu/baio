from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    hashed_password = Column(String(72), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    classifications = relationship(
        "Classification", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User id={self.id} name={self.name} email={self.email}>"
