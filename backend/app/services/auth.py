import os
import bcrypt

JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET required. Generate with: "
        "python -c 'import secrets; print(secrets.token_urlsafe(32))'"
    )

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def hash_password(plain: str) -> str:
    pw_bytes = plain.encode("utf-8")
    hashed = bcrypt.hashpw(pw_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    pw_bytes = plain.encode("utf-8")
    hash_bytes = hashed.encode("utf-8")
    return bcrypt.checkpw(pw_bytes, hash_bytes)
