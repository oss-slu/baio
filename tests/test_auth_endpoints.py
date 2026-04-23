"""Tests for auth endpoints (Step 4, register only — login deferred to Step 7)."""


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
