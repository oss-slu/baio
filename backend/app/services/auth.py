import os
import bcrypt
import jwt
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from ..models.refresh_token import RefreshToken

JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET required. Generate with: "
        "python -c 'import secrets; print(secrets.token_urlsafe(32))'"
    )

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7


def hash_password(plain: str) -> str:
    pw_bytes = plain.encode("utf-8")
    hashed = bcrypt.hashpw(pw_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    pw_bytes = plain.encode("utf-8")
    hash_bytes = hashed.encode("utf-8")
    return bcrypt.checkpw(pw_bytes, hash_bytes)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode["exp"] = expire
    to_encode["typ"] = "access"
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


def create_refresh_token(db: Session, user_id: int) -> str:
    jti = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    db.add(RefreshToken(jti=jti, user_id=user_id, expires_at=expires_at))
    db.commit()

    return jwt.encode(
        {"sub": str(user_id), "jti": jti, "typ": "refresh", "exp": expires_at},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )
