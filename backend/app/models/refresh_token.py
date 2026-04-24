from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, func
from ..database import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    jti = Column(String(36), primary_key=True)
    # SQLite doesn't enforce FK constraints by default
    # so you have to enable them per-connection with PRAGMA foreign_keys=ON.
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<RefreshToken jti={self.jti} user_id={self.user_id} revoked={self.revoked}>"
