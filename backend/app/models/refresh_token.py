from sqlalchemy import Column, Integer, DateTime, Boolean, ForeignKey, func
from ..database import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    jti = Column(Integer, primary_key=True)
    # SQLite doesn't enforce FK constraints by default
    # so you have to enable them per-connection with PRAGMA foreign_keys=ON.
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<User id={self.id} name={self.name} email={self.email}>"
