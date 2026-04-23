"""Tests for auth schemas (Step 3)."""

import os

os.environ.setdefault(
    "JWT_SECRET",
    "test-secret-at-least-32-bytes-long-xxxxxxxxxx",
)

import pytest  # noqa: E402
from pydantic import ValidationError  # noqa: E402

from backend.app.schemas.auth import (  # noqa: E402
    Token,
    TokenPayload,
    UserCreate,
    UserLogin,
)


class TestUserCreate:
    def test_valid(self) -> None:
        uc = UserCreate(name="alice", email="alice@example.com", password="hunter22!")
        assert uc.name == "alice"
        assert uc.email == "alice@example.com"
        assert uc.password == "hunter22!"

    def test_rejects_short_password(self) -> None:
        with pytest.raises(ValidationError):
            UserCreate(name="alice", email="a@b.com", password="short")

    def test_rejects_oversized_password(self) -> None:
        # bcrypt truncates inputs at 72 bytes; max_length=72 prevents silent collisions
        with pytest.raises(ValidationError):
            UserCreate(name="alice", email="a@b.com", password="x" * 73)

    def test_rejects_oversized_name(self) -> None:
        with pytest.raises(ValidationError):
            UserCreate(name="a" * 21, email="a@b.com", password="hunter22!")

    def test_rejects_invalid_email(self) -> None:
        with pytest.raises(ValidationError):
            UserCreate(name="alice", email="not-an-email", password="hunter22!")


class TestUserLogin:
    def test_valid(self) -> None:
        ul = UserLogin(email="alice@example.com", password="hunter22!")
        assert ul.email == "alice@example.com"

    def test_rejects_invalid_email(self) -> None:
        with pytest.raises(ValidationError):
            UserLogin(email="not-an-email", password="whatever")

    def test_password_has_no_length_constraint(self) -> None:
        # Login must accept any password; length rules live only at registration.
        UserLogin(email="a@b.com", password="x")
        UserLogin(email="a@b.com", password="x" * 500)


class TestToken:
    def test_default_token_type(self) -> None:
        t = Token(access_token="abc")
        assert t.token_type == "bearer"

    def test_serializes_to_oauth2_shape(self) -> None:
        t = Token(access_token="abc")
        assert t.model_dump() == {"access_token": "abc", "token_type": "bearer"}


class TestTokenPayload:
    def test_valid(self) -> None:
        tp = TokenPayload(sub="1")
        assert tp.sub == "1"

    def test_rejects_missing_sub(self) -> None:
        with pytest.raises(ValidationError):
            TokenPayload()
