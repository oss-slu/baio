"""Direct unit tests for permission helpers (Step 6).

Covers the decision logic in `authorize_user_target` and `get_admin_user`
directly — complementary to the endpoint tests in test_users.py which exercise
the same functions through HTTP.
"""

import pytest
from fastapi import HTTPException

from backend.app.models.user import User
from backend.app.utils.user import authorize_user_target, get_admin_user


def _make_user(
    db_session, email: str, is_admin: bool = False, name: str = "test"
) -> User:
    user = User(
        name=name,
        email=email,
        hashed_password="$2b$12$" + "x" * 53,  # placeholder; not validated here
        is_admin=is_admin,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_authorize_self_returns_current_user(test_db) -> None:
    db = test_db()
    try:
        alice = _make_user(db, "alice@example.com")

        result = authorize_user_target(user_id=alice.id, current_user=alice, db=db)

        assert result.id == alice.id
    finally:
        db.close()


def test_authorize_admin_reading_other_returns_target(test_db) -> None:
    db = test_db()
    try:
        admin = _make_user(db, "admin@example.com", is_admin=True)
        target = _make_user(db, "target@example.com")

        result = authorize_user_target(user_id=target.id, current_user=admin, db=db)

        assert result.id == target.id
        assert result.email == "target@example.com"
    finally:
        db.close()


def test_authorize_admin_reading_missing_raises_404(test_db) -> None:
    db = test_db()
    try:
        admin = _make_user(db, "admin@example.com", is_admin=True)

        with pytest.raises(HTTPException) as excinfo:
            authorize_user_target(user_id=999, current_user=admin, db=db)

        assert excinfo.value.status_code == 404
        assert excinfo.value.detail == "User not found"
    finally:
        db.close()


def test_authorize_non_admin_reading_other_raises_403(test_db) -> None:
    db = test_db()
    try:
        alice = _make_user(db, "alice@example.com")
        bob = _make_user(db, "bob@example.com")

        with pytest.raises(HTTPException) as excinfo:
            authorize_user_target(user_id=bob.id, current_user=alice, db=db)

        assert excinfo.value.status_code == 403
        assert excinfo.value.detail == "Insufficient privileges"
    finally:
        db.close()


def test_get_admin_user_allows_admin(test_db) -> None:
    db = test_db()
    try:
        admin = _make_user(db, "admin@example.com", is_admin=True)

        result = get_admin_user(current_user=admin)

        assert result.id == admin.id
    finally:
        db.close()


def test_get_admin_user_rejects_non_admin(test_db) -> None:
    db = test_db()
    try:
        alice = _make_user(db, "alice@example.com")

        with pytest.raises(HTTPException) as excinfo:
            get_admin_user(current_user=alice)

        assert excinfo.value.status_code == 403
        assert excinfo.value.detail == "Insufficient privileges"
    finally:
        db.close()
