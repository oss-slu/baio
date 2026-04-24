# Authentication

BAIO uses cookie-based JWT authentication with short-lived access tokens and rotating refresh tokens. This document describes the design, the flows, the security properties, and how to integrate with it from a frontend.

## TL;DR

- **Access token** — JWT, 15 min TTL, `httpOnly` cookie at `path=/`. Sent with every request.
- **Refresh token** — JWT + DB row, 7 day TTL, `httpOnly` cookie at `path=/auth`. Sent only to auth endpoints. Rotated on every use.
- **Reuse detection** — if a revoked refresh token is ever replayed, *all* of that user's refresh tokens are revoked and both cookies cleared. Triggers a forced re-login.
- **No localStorage tokens.** The frontend never sees or handles tokens directly — the browser manages cookies.

## Why this design

JWTs in `localStorage` are vulnerable to XSS — any script running on the page can exfiltrate them. `httpOnly` cookies remove the token from JavaScript's reach. The cost is that we need CSRF protection (handled by `SameSite=lax` on the cookies and the fact that all auth endpoints are `POST`).

Short access tokens (15 min) limit the blast radius of a leaked cookie. Refresh tokens (7 days) keep users logged in across sessions without repeated password entry. Rotation makes refresh tokens single-use: each `/auth/refresh` call returns a new pair and invalidates the old refresh token. Replay of an old refresh token is strong evidence of theft, which is why reuse detection revokes the whole session tree.

## Token types

Both tokens are JWTs signed with `HS256` using the `JWT_SECRET` env var. They are distinguished by a `typ` claim:

| Claim | Access | Refresh |
|---|---|---|
| `sub` | user id (string) | user id (string) |
| `typ` | `"access"` | `"refresh"` |
| `exp` | now + 15 min | now + 7 days |
| `jti` | — | UUID4 string, matches a row in `refresh_tokens` |

The `typ` claim is enforced at verification sites: `/auth/refresh` rejects a token with `typ != "refresh"`, `get_current_user` is concerned only with the access cookie. This prevents cross-use if the two cookies ever get swapped.

## Cookies

| Attribute | Access cookie | Refresh cookie |
|---|---|---|
| Name | `access_token` | `refresh_token` |
| `Path` | `/` | `/auth` |
| `HttpOnly` | yes | yes |
| `Secure` | controlled by `COOKIE_SECURE` env var | controlled by `COOKIE_SECURE` env var |
| `SameSite` | `lax` | `lax` |
| `Max-Age` | 900 (15 min) | 604800 (7 days) |

**Path scoping is security-relevant.** The refresh cookie is only sent to `/auth/*` endpoints, never to `/users/*`, `/classifications/*`, etc. This minimizes the paths that ever touch the high-value credential.

`SameSite=lax` blocks cross-site POSTs from carrying the cookies — this is the CSRF mitigation.

## Endpoints

All under prefix `/auth`. See [`app/routers/auth.py`](../backend/app/routers/auth.py).

### `POST /auth/register`

Create a new user account and auto-login.

```json
{ "name": "alice", "email": "alice@example.com", "password": "hunter22!" }
```

**Responses:**

- `201 Created` — returns `UserResponse` (id, name, email, is_admin, classifications). Sets `access_token` and `refresh_token` cookies.
- `409 Conflict` — email already registered.
- `422 Unprocessable Entity` — validation error (short password, bad email, etc.).

**Password rules** ([`app/schemas/auth.py`](../backend/app/schemas/auth.py)):

- Minimum 8 characters
- Maximum 72 bytes (bcrypt's hard limit)

### `POST /auth/login`

Verify credentials and issue fresh cookies.

```json
{ "email": "alice@example.com", "password": "hunter22!" }
```

**Responses:**

- `200 OK` — returns `UserResponse`. Sets `access_token` and `refresh_token` cookies.
- `401 Unauthorized` — `{"detail": "Incorrect email or password"}` (same response for unknown email or wrong password, to avoid leaking account existence).

Login always issues a new refresh token row — existing refresh tokens are left alone, allowing multi-device sessions.

### `POST /auth/logout`

Revoke the current session and clear cookies. Idempotent.

**Responses:**

- `204 No Content` — always, regardless of cookie state.

Behavior:

- If the refresh cookie is present and valid, the corresponding `refresh_tokens` row is marked `revoked=True`.
- If the refresh cookie is missing, malformed, or expired, the endpoint still returns 204.
- Both cookies are cleared on the response.

Logout does **not** require authentication (no `Depends(get_current_user)`). This is deliberate — if the access token has just expired, the user must still be able to log out cleanly.

### `POST /auth/refresh`

Rotate the token pair. Requires a valid refresh cookie.

**Responses:**

- `204 No Content` — success. Sets new `access_token` and `refresh_token` cookies; the old refresh token's `jti` is now marked revoked.
- `401 Unauthorized` — `{"detail": "Could not validate credentials"}`. Covers: missing cookie, bad signature, expired JWT, wrong `typ`, unknown `jti`, and reuse detection.

On success, the endpoint:

1. Marks the submitted `jti` revoked in the DB.
2. Creates a new `refresh_tokens` row with a fresh UUID4 `jti`.
3. Issues a new access JWT and refresh JWT.
4. Sets both cookies on the response.

## Refresh rotation and reuse detection

The rotation flow is the security core of this design:

```
Client                    Server                           DB
  |                         |                               |
  |--- POST /auth/refresh -->|                               |
  |    (refresh_token=R0)   |                               |
  |                         |--- SELECT jti=J0 ------------->|
  |                         |<-- {revoked: false} -----------|
  |                         |--- UPDATE jti=J0 SET revoked=True
  |                         |--- INSERT jti=J1 ------------->|
  |<--- 204 (cookies=A1,R1)-|                               |
```

If the **same R0 is replayed later** (after R1 has been issued), the server sees `revoked=True` on J0 and triggers reuse detection:

```
Client                    Server                           DB
  |                         |                               |
  |--- POST /auth/refresh -->|                               |
  |    (refresh_token=R0)   |                               |
  |                         |--- SELECT jti=J0 ------------->|
  |                         |<-- {revoked: true} ------------|
  |                         |--- UPDATE user_id=X SET revoked=True
  |<--- 401 (cookies cleared)-|                             |
```

### Why revoke every token for the user?

A replayed revoked refresh token means one of two things:

1. The legitimate user already refreshed (making R0 revoked), and now an attacker is trying to use a copy of R0 they stole.
2. The attacker refreshed first (stealing R1), and the legitimate user is now replaying R0 from their browser.

We can't distinguish the two — so we assume compromise and force everyone with valid tokens for that user back to the login page. This is the pattern recommended by OAuth 2.1 / RFC 6819.

### Known limitation

Two concurrent refresh requests with the same valid `jti` can race — both may pass the "is revoked?" check before either writes. Both rotate successfully, issuing two new token pairs. A solo user won't hit this; an attacker racing a legitimate user is an edge case we don't currently handle.

Proper fix: row-level locking (`SELECT ... FOR UPDATE`), which SQLite doesn't support meaningfully. In production Postgres this is a one-line change.

## Password hashing

bcrypt with per-password salt. See [`app/services/auth.py`](../backend/app/services/auth.py).

- Hash produced by `bcrypt.hashpw(password, bcrypt.gensalt())`.
- 72-byte input limit (bcrypt truncates silently beyond this; we enforce the limit at the schema layer so users know).
- Stored as a `String(72)` on the User model — which is the bcrypt hash length, not the password length.
- Login always runs bcrypt against *something*: if the email doesn't exist, we verify against a pre-computed `_DUMMY_HASH`. This prevents timing attacks that distinguish "unknown user" from "wrong password."

## Database

### `users` ([`app/models/user.py`](../backend/app/models/user.py))

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `name` | String(20) | |
| `email` | String(100) unique | |
| `hashed_password` | String(72) | bcrypt hash |
| `is_admin` | Boolean | defaults false; promoted via SQL, not the API |
| `created_at` | DateTime(tz) | |

### `refresh_tokens` ([`app/models/refresh_token.py`](../backend/app/models/refresh_token.py))

| Column | Type | Notes |
|---|---|---|
| `jti` | String(36) PK | UUID4, matches the JWT's `jti` claim |
| `user_id` | Integer FK (CASCADE) indexed | |
| `expires_at` | DateTime(tz) | operational (cleanup queries); JWT `exp` enforces expiry at verification |
| `revoked` | Boolean | flipped on rotation or reuse-detection sweep |
| `created_at` | DateTime(tz) | |

Deleting a user cascades to their refresh tokens (ORM-level via `User.refresh_tokens`, DB-level via `ondelete="CASCADE"`). SQLite does not enforce FK constraints by default — the ORM cascade does the real work in dev. Postgres enforces natively.

## Environment variables

See [`.env.example`](../.env.example).

| Var | Required? | Purpose |
|---|---|---|
| `JWT_SECRET` | yes, fail-loud | HS256 signing key for JWTs |
| `CORS_ORIGINS` | yes, fail-loud | comma-separated list of origins allowed to send credentials |
| `COOKIE_SECURE` | optional (default `false`) | set `true` in production to require HTTPS |

Token lifetimes are constants in [`app/services/auth.py`](../backend/app/services/auth.py) (`ACCESS_TOKEN_EXPIRE_MINUTES = 15`, `REFRESH_TOKEN_EXPIRE_DAYS = 7`) — promote to env vars if per-environment tuning becomes necessary.

## Frontend integration

Two requirements:

1. **`credentials: 'include'`** on every `fetch` / axios request. Without this, the browser withholds cookies on cross-origin requests, and auth silently fails.
2. **Origin must be in `CORS_ORIGINS`.** The FastAPI CORS middleware rejects credentialed requests from unlisted origins. Dev defaults: `http://localhost:5173` (Vite dev) and `http://localhost:4173` (Vite preview / docker).

Refresh flow from a frontend:

```ts
// On 401 from any non-auth endpoint, call /auth/refresh once
async function refresh() {
  const r = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!r.ok) {
    // reuse detection or expired — force re-login
    window.location.href = "/login";
    return false;
  }
  return true;
}
```

The cookies are set automatically by the browser on the `Set-Cookie` response; no client-side token handling needed.

## Permission model

See [`app/utils/user.py`](../backend/app/utils/user.py).

Two layered dependencies:

- **`get_current_user`** — reads the access cookie, decodes the JWT, looks up the user. Raises 401 on missing/invalid cookie or deleted user.
- **`authorize_user_target(user_id, current_user, db)`** — enforces self-or-admin access to `/users/{user_id}` endpoints. Non-admin reading another user → 403. Admin reading a missing user → 404.

Admin promotion is done out-of-band (SQL or tests only); no API endpoint can set `is_admin=True`.

## Testing

Auth tests live under [`tests/auth/`](../tests/auth/):

- [`test_auth_endpoints.py`](../tests/auth/test_auth_endpoints.py) — register, login, logout happy paths and error cases
- [`test_refresh.py`](../tests/auth/test_refresh.py) — rotation, reuse detection, all 5 rejection paths
- [`test_users.py`](../tests/auth/test_users.py) — permission logic for `/users/{id}`
- [`test_permissions.py`](../tests/auth/test_permissions.py) — unit-level tests of `authorize_user_target` and `get_admin_user`
- [`test_schemas.py`](../tests/auth/test_schemas.py) — Pydantic validation

Key fixtures in [`tests/conftest.py`](../tests/conftest.py):

| Fixture | What it does |
|---|---|
| `test_db` | In-memory SQLite, shared across connections via `StaticPool`, fresh per test |
| `client` | `TestClient` with `get_db` overridden to point at `test_db` |
| `register_user` | Factory that POSTs to `/auth/register`; cookies land in the TestClient jar |
| `login_user` | Factory that POSTs to `/auth/login`; same cookie jar behavior |
| `promote_admin` | Factory that flips `is_admin=True` directly in the DB (simulates the SQL bootstrap) |

### Forging JWTs in tests

For negative cases (expired tokens, wrong `typ`, unknown jti), construct JWTs directly rather than going through the service functions — `test_refresh.py::_forge_refresh` is the pattern:

```python
def _forge_refresh(user_id=1, jti="unknown-jti", typ="refresh", exp_delta=timedelta(days=7)):
    payload = {
        "sub": str(user_id),
        "jti": jti,
        "typ": typ,
        "exp": datetime.now(timezone.utc) + exp_delta,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
```

### Cookie-jar gotchas in httpx-based TestClient

`client.cookies.set(name, value, path=...)` without a `domain` does **not** overwrite cookies set by the server (those have `domain="testserver"`). You end up with two cookies at the same `(name, path)` — the server's delete-cookie clears only one. When testing cookie clearing, prefer asserting on response `Set-Cookie` headers directly:

```python
set_cookie_headers = resp.headers.get_list("set-cookie")
assert any(h.startswith("refresh_token=") and "Max-Age=0" in h for h in set_cookie_headers)
```

This tests the server's behavior (what we care about) independent of the client's jar state.

## Threat model (what this protects and doesn't)

**Protects against:**

- XSS-based token theft (cookies are `httpOnly`)
- CSRF (cookies are `SameSite=lax`, all auth endpoints are POST)
- Credential stuffing via timing side-channels (bcrypt dummy hash on unknown-user login)
- Replay of a rotated refresh token (reuse detection)
- Database enumeration of email existence (login returns the same error for unknown user and wrong password)

**Does not protect against:**

- Compromise of `JWT_SECRET` (full access — the secret is the root of trust)
- Concurrent refresh race (two simultaneous refreshes with the same valid jti both succeed)
- Brute-force login attempts (no rate limiting currently)
- Session hijacking via malicious browser extensions or compromised client machines
- Server-side bugs that leak cookies in logs or error pages (operational concern)

Rate limiting and audit logging are natural next steps but are out of scope for the current design.
