"""Tests for POST /auth/refresh: rotation, reuse detection, rejection paths."""

from datetime import datetime, timedelta, timezone

import jwt

from backend.app.models.refresh_token import RefreshToken
from backend.app.services.auth import JWT_ALGORITHM, JWT_SECRET


def _forge_refresh(
    user_id: int = 1,
    jti: str = "unknown-jti",
    typ: str = "refresh",
    exp_delta: timedelta = timedelta(days=7),
) -> str:
    """Build a JWT with arbitrary claims, signed with the real secret."""
    payload = {
        "sub": str(user_id),
        "jti": jti,
        "typ": typ,
        "exp": datetime.now(timezone.utc) + exp_delta,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _active_token_count(test_db, user_id: int) -> int:
    db = test_db()
    try:
        return (
            db.query(RefreshToken)
            .filter(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked.is_(False),
            )
            .count()
        )
    finally:
        db.close()


def test_refresh_rotates_tokens(client, register_user, test_db) -> None:
    register_user()
    original_cookie = client.cookies.get("refresh_token")

    resp = client.post("/auth/refresh")
    assert resp.status_code == 204

    new_cookie = client.cookies.get("refresh_token")
    assert new_cookie is not None
    assert new_cookie != original_cookie

    old_jti = jwt.decode(original_cookie, JWT_SECRET, algorithms=[JWT_ALGORITHM])["jti"]
    new_jti = jwt.decode(new_cookie, JWT_SECRET, algorithms=[JWT_ALGORITHM])["jti"]

    db = test_db()
    try:
        assert db.query(RefreshToken).filter_by(jti=old_jti).first().revoked is True
        assert db.query(RefreshToken).filter_by(jti=new_jti).first().revoked is False
    finally:
        db.close()


def test_refresh_without_cookie_returns_401(client) -> None:
    resp = client.post("/auth/refresh")
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Could not validate credentials"


def test_refresh_with_malformed_token_returns_401(client) -> None:
    client.cookies.set("refresh_token", "garbage", path="/auth")
    resp = client.post("/auth/refresh")
    assert resp.status_code == 401


def test_refresh_with_expired_token_returns_401(client, register_user) -> None:
    register_user()
    expired = _forge_refresh(exp_delta=timedelta(seconds=-10))
    client.cookies.set("refresh_token", expired, path="/auth")
    resp = client.post("/auth/refresh")
    assert resp.status_code == 401


def test_refresh_with_access_typ_returns_401(client, register_user) -> None:
    register_user()
    fake = _forge_refresh(typ="access")
    client.cookies.set("refresh_token", fake, path="/auth")
    resp = client.post("/auth/refresh")
    assert resp.status_code == 401


def test_refresh_with_unknown_jti_returns_401(client, register_user) -> None:
    register_user()
    rogue = _forge_refresh(jti="does-not-exist-in-db")
    client.cookies.set("refresh_token", rogue, path="/auth")
    resp = client.post("/auth/refresh")
    assert resp.status_code == 401


def test_refresh_replay_revokes_all_user_tokens(client, register_user, test_db) -> None:
    """Replaying a rotated refresh token revokes every RefreshToken row for the user
    and instructs the client to clear both cookies."""
    register_user()
    old_cookie = client.cookies.get("refresh_token")

    assert client.post("/auth/refresh").status_code == 204
    assert _active_token_count(test_db, user_id=1) == 1

    client.cookies.set("refresh_token", old_cookie, path="/auth")
    resp = client.post("/auth/refresh")
    assert resp.status_code == 401

    assert _active_token_count(test_db, user_id=1) == 0

    set_cookie_headers = resp.headers.get_list("set-cookie")
    assert any(
        h.startswith("access_token=") and "Max-Age=0" in h for h in set_cookie_headers
    )
    assert any(
        h.startswith("refresh_token=") and "Max-Age=0" in h for h in set_cookie_headers
    )


def test_refresh_new_access_token_authenticates(client, register_user) -> None:
    register_user()
    client.post("/auth/refresh")

    resp = client.get("/users/1")
    assert resp.status_code == 200
