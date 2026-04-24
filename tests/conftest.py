"""Configuration for pytest tests."""

import os
import sys
from pathlib import Path

import pytest

# JWT_SECRET must be set before any test module imports backend.app.services.auth,
# which raises RuntimeError at import time if missing. Conftest runs before
# pytest imports any test modules, so setting it here is early enough.
os.environ.setdefault(
    "JWT_SECRET",
    "test-secret-at-least-32-bytes-long-xxxxxxxxxx",
)

# Add the project root to Python path so we can import our modules
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


@pytest.fixture
def sample_fasta_sequences():
    """Provide sample FASTA sequences for testing."""
    return [
        ("sequence_1", "ATCGATCGATCGATCG"),
        ("sequence_2", "GCTAGCTAGCTAGCTA"),
        ("sequence_3", "TTTTAAAACCCCGGGG"),
    ]


@pytest.fixture
def sample_classification_results():
    """Provide sample classification results for testing."""
    return {
        "total_sequences": 3,
        "virus_count": 1,
        "host_count": 2,
        "novel_count": 0,
        "detailed_results": [
            {
                "sequence_id": "seq1",
                "length": 16,
                "prediction": "Virus",
                "confidence": "0.85",
                "gc_content": "0.50",
                "sequence_preview": "ATCGATCGATCGATCG",
            },
            {
                "sequence_id": "seq2",
                "length": 16,
                "prediction": "Host",
                "confidence": "0.92",
                "gc_content": "0.50",
                "sequence_preview": "GCTAGCTAGCTAGCTA",
            },
            {
                "sequence_id": "seq3",
                "length": 16,
                "prediction": "Host",
                "confidence": "0.78",
                "gc_content": "0.50",
                "sequence_preview": "TTTTAAAACCCCGGGG",
            },
        ],
        "source": "test_file.fasta",
        "processing_time": 1.5,
        "timestamp": "2025-10-20T10:30:00",
    }


@pytest.fixture
def mock_uploaded_file():
    """Mock uploaded file object."""
    import unittest.mock

    mock_file = unittest.mock.MagicMock()
    mock_file.name = "test.fasta"
    mock_file.size = 1024
    mock_file.read.return_value.decode.return_value = (
        ">seq1\nATCGATCGATCG\n>seq2\nGCTAGCTAGCTA"
    )

    return mock_file


@pytest.fixture
def test_db():
    """Fresh in-memory SQLite DB per test, shared across connections via StaticPool."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    from backend.app.database import Base
    import backend.app.models  # noqa: F401 — registers User + Classification with Base

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    yield SessionLocal


@pytest.fixture
def client(test_db):
    """TestClient with get_db overridden to point at the test DB."""
    from fastapi.testclient import TestClient

    from backend.app.main import app
    from backend.app.database import get_db

    def override_get_db():
        db = test_db()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def register_user(client):
    """Factory: register a user via the test client, returns the raw Response."""

    def _register(
        name: str = "test",
        email: str = "test@example.com",
        password: str = "hunter22!",
    ):
        return client.post(
            "/auth/register",
            json={"name": name, "email": email, "password": password},
        )

    return _register


@pytest.fixture
def login_user(client):
    """Factory: log in a user. The cookie is stored on the client's cookie jar
    and auto-attached to subsequent requests; callers don't need a return value."""

    def _login(
        email: str = "test@example.com",
        password: str = "hunter22!",
    ) -> None:
        resp = client.post(
            "/auth/login",
            json={"email": email, "password": password},
        )
        assert resp.status_code == 200, f"login failed: {resp.status_code} {resp.text}"

    return _login


@pytest.fixture
def promote_admin(test_db):
    """Factory: mark a user as admin in the test DB (simulates the SQL bootstrap)."""

    def _promote(email: str) -> None:
        from backend.app.models.user import User

        db = test_db()
        try:
            user = db.query(User).filter(User.email == email).first()
            if user is None:
                raise ValueError(f"no user with email {email}")
            user.is_admin = True
            db.commit()
        finally:
            db.close()

    return _promote
