"""Tests for auth endpoints: register, login, logout."""

import jwt

from backend.app.models.refresh_token import RefreshToken
from backend.app.services.auth import JWT_ALGORITHM, JWT_SECRET


def test_register_success(register_user) -> None:
    resp = register_user(name="alice", email="alice@example.com", password="hunter22!")
    assert resp.status_code == 201
    body = resp.json()
    assert body["id"] > 0
    assert body["name"] == "alice"
    assert body["email"] == "alice@example.com"
    assert body["is_admin"] is False


def test_register_never_returns_hashed_password(register_user) -> None:
    resp = register_user()
    assert resp.status_code == 201
    body = resp.json()
    assert "hashed_password" not in body
    assert "password" not in body


def test_register_duplicate_email_returns_409(register_user) -> None:
    first = register_user()
    assert first.status_code == 201

    duplicate = register_user()
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"] == "Email already registered"


def test_register_rejects_short_password(register_user) -> None:
    resp = register_user(password="short")
    assert resp.status_code == 422


def test_register_rejects_oversized_password(register_user) -> None:
    resp = register_user(password="x" * 73)
    assert resp.status_code == 422


def test_register_rejects_bad_email(register_user) -> None:
    resp = register_user(email="not-an-email")
    assert resp.status_code == 422


def test_register_ignores_attempt_to_set_is_admin(client) -> None:
    """Extra fields in the request body are dropped — no privilege escalation."""
    resp = client.post(
        "/auth/register",
        json={
            "name": "alice",
            "email": "alice@example.com",
            "password": "hunter22!",
            "is_admin": True,
        },
    )
    assert resp.status_code == 201
    assert resp.json()["is_admin"] is False


def test_logout_returns_204(client, register_user, login_user) -> None:
    register_user()
    login_user()
    resp = client.post("/auth/logout")
    assert resp.status_code == 204
    assert resp.content == b""


def test_logout_clears_access_cookie(client, register_user, login_user) -> None:
    register_user()
    login_user()
    assert client.get("/users/1").status_code == 200

    client.post("/auth/logout")

    assert client.get("/users/1").status_code == 401


def test_logout_without_cookie_is_idempotent(client) -> None:
    resp = client.post("/auth/logout")
    assert resp.status_code == 204


def test_logout_revokes_refresh_jti(client, register_user, test_db) -> None:
    register_user()
    cookie = client.cookies.get("refresh_token")
    jti = jwt.decode(cookie, JWT_SECRET, algorithms=[JWT_ALGORITHM])["jti"]

    client.post("/auth/logout")

    db = test_db()
    try:
        row = db.query(RefreshToken).filter_by(jti=jti).first()
        assert row is not None
        assert row.revoked is True
    finally:
        db.close()


def test_logout_clears_refresh_cookie(client, register_user) -> None:
    register_user()
    assert client.cookies.get("refresh_token") is not None

    client.post("/auth/logout")

    assert client.cookies.get("refresh_token") is None


def test_logout_with_malformed_refresh_cookie_is_idempotent(client) -> None:
    client.cookies.set("refresh_token", "garbage", path="/auth")
    resp = client.post("/auth/logout")
    assert resp.status_code == 204
