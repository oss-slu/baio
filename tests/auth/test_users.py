"""Tests for /users/{user_id} permission logic (Step 6).

Auth is currently Bearer-in-Authorization-header; these tests will need their
_auth_headers helper replaced once Step 7 moves to cookie auth. The permission
logic (self/admin/deny) is unchanged by that refactor.
"""


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_no_token_returns_401(client) -> None:
    resp = client.get("/users/1")
    assert resp.status_code == 401


def test_bad_token_returns_401(client) -> None:
    client.cookies.set("access_token", "garbage")
    resp = client.get("/users/1")
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Could not validate credentials"


def test_self_read_returns_user(client, register_user, login_user) -> None:
    register_user(email="alice@example.com")
    token = login_user(email="alice@example.com")

    resp = client.get("/users/1", headers=_auth_headers(token))

    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == "alice@example.com"
    assert body["is_admin"] is False


def test_non_admin_cross_read_returns_403(client, register_user, login_user) -> None:
    register_user(email="alice@example.com")
    register_user(email="bob@example.com")
    bob_token = login_user(email="bob@example.com")

    resp = client.get("/users/1", headers=_auth_headers(bob_token))

    assert resp.status_code == 403
    assert resp.json()["detail"] == "Insufficient privileges"


def test_admin_cross_read_returns_200(
    client, register_user, login_user, promote_admin
) -> None:
    register_user(email="alice@example.com")
    register_user(email="bob@example.com")
    promote_admin("alice@example.com")
    alice_token = login_user(email="alice@example.com")

    resp = client.get("/users/2", headers=_auth_headers(alice_token))

    assert resp.status_code == 200
    assert resp.json()["email"] == "bob@example.com"


def test_admin_missing_id_returns_404(
    client, register_user, login_user, promote_admin
) -> None:
    register_user(email="alice@example.com")
    promote_admin("alice@example.com")
    token = login_user(email="alice@example.com")

    resp = client.get("/users/999", headers=_auth_headers(token))

    assert resp.status_code == 404
    assert resp.json()["detail"] == "User not found"


def test_admin_read_shows_is_admin_true(
    client, register_user, login_user, promote_admin
) -> None:
    """An admin reading their own record sees is_admin=true in the response."""
    register_user(email="alice@example.com")
    promote_admin("alice@example.com")
    token = login_user(email="alice@example.com")

    resp = client.get("/users/1", headers=_auth_headers(token))

    assert resp.status_code == 200
    assert resp.json()["is_admin"] is True


def test_non_admin_cross_delete_returns_403(client, register_user, login_user) -> None:
    register_user(email="alice@example.com")
    register_user(email="bob@example.com")
    bob_token = login_user(email="bob@example.com")

    resp = client.delete("/users/1", headers=_auth_headers(bob_token))

    assert resp.status_code == 403


def test_admin_cross_delete_returns_204(
    client, register_user, login_user, promote_admin
) -> None:
    register_user(email="alice@example.com")
    register_user(email="bob@example.com")
    promote_admin("alice@example.com")
    alice_token = login_user(email="alice@example.com")

    resp = client.delete("/users/2", headers=_auth_headers(alice_token))

    assert resp.status_code == 204


def test_self_delete_invalidates_own_token(client, register_user, login_user) -> None:
    """After self-delete, the JWT is still cryptographically valid but its user
    no longer exists — get_current_user raises 401."""
    register_user(email="alice@example.com")
    token = login_user(email="alice@example.com")

    delete_resp = client.delete("/users/1", headers=_auth_headers(token))
    assert delete_resp.status_code == 204

    follow_up = client.get("/users/1", headers=_auth_headers(token))
    assert follow_up.status_code == 401
