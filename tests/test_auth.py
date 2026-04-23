import os
from datetime import timedelta

import pytest

os.environ.setdefault(
    "JWT_SECRET",
    "test-secret-at-least-32-bytes-long-xxxxxxxxxx",
)

from backend.app.services.auth import (  # noqa: E402
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)
import jwt  # noqa: E402


def test_hash_password_returns_bcrypt_string() -> None:
    hashed = hash_password("correct horse battery staple")

    assert isinstance(hashed, str)
    assert hashed.startswith("$2b$")


def test_hash_password_uses_fresh_salt() -> None:
    first = hash_password("same-password")
    second = hash_password("same-password")

    assert first != second


def test_verify_password_accepts_correct_password() -> None:
    hashed = hash_password("correct horse battery staple")

    assert verify_password("correct horse battery staple", hashed) is True


def test_verify_password_rejects_wrong_password() -> None:
    hashed = hash_password("correct horse battery staple")

    assert verify_password("wrong password", hashed) is False


def test_create_and_decode_token_roundtrip() -> None:
    token = create_access_token({"sub": "1"})
    payload = decode_token(token)

    assert payload["sub"] == "1"
    assert "exp" in payload


def test_decode_expired_token_raises() -> None:
    expired = create_access_token({"sub": "1"}, expires_delta=timedelta(seconds=-1))

    with pytest.raises(jwt.ExpiredSignatureError):
        decode_token(expired)


def test_decode_tampered_token_raises() -> None:
    token = create_access_token({"sub": "1"})
    tampered = token[:-4] + "XXXX"

    with pytest.raises(jwt.InvalidSignatureError):
        decode_token(tampered)
