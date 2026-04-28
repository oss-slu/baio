# BAIO Backend

FastAPI service for BAIO: DNA classification, chat assistant, user accounts, and cookie-based authentication.

## Running

### With docker-compose (from repo root)

```bash
docker compose up api
```

Service listens on `http://localhost:8080` (set via `API_PORT`).

### Locally

Requires the project installed (`pip install -e .` from repo root) and a populated `.env` (copy `.env.example`).

```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8080 --reload
```

## API reference

OpenAPI / Swagger UI is served automatically:

- `GET /docs` — interactive Swagger UI
- `GET /redoc` — ReDoc view
- `GET /openapi.json` — machine-readable schema

## Routers

| Prefix | Purpose | Source |
|---|---|---|
| `/auth` | Register, login, logout, refresh | [`app/routers/auth.py`](app/routers/auth.py) |
| `/users` | User read / delete, permission checks | [`app/routers/user.py`](app/routers/user.py) |
| `/classifications` | DNA sequence classification | [`app/routers/classify.py`](app/routers/classify.py) |
| `/chat` | LLM-backed chat (OpenRouter / Gemini) | [`app/routers/chat.py`](app/routers/chat.py) |
| `/system` | Healthchecks and runtime info | [`app/routers/system.py`](app/routers/system.py) |

## Layout

```
backend/app/
  main.py            FastAPI app, CORS, DB bootstrap
  database.py        SQLAlchemy engine, session, Base
  models/            ORM models (User, Classification, RefreshToken)
  schemas/           Pydantic request/response models
  routers/           HTTP endpoints (see table above)
  services/          Business logic (auth, classification, llm_client)
  utils/             Cross-cutting helpers (cookies, user deps, validation)
```

## Environment variables

See [`.env.example`](../.env.example) at the repo root. Required vars fail-loud at startup:

- `JWT_SECRET` — signing key for JWTs (generate with `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
- `CORS_ORIGINS` — comma-separated list of origins allowed to send credentials

Optional:

- `COOKIE_SECURE` — `true` in production (HTTPS only); defaults to `false` for local dev
- `OPENROUTER_API_KEY`, `GEMINI_API_KEY` — LLM providers for `/chat` (chatbot falls back to mock responses if unset)

## Authentication

Cookie-based JWTs with refresh-token rotation and reuse detection. See [`docs/AUTHENTICATION.md`](../docs/AUTHENTICATION.md) for the full design.

## Tests

From the repo root:

```bash
pytest tests/
```

Auth tests live under [`tests/auth/`](../tests/auth/). The test harness uses an in-memory SQLite via the `test_db` fixture in [`tests/conftest.py`](../tests/conftest.py).
