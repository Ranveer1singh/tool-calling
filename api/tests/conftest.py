from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.deps import get_store
from app.main import create_app
from app.store import TaskStore


@pytest.fixture
def store(tmp_path: Path) -> TaskStore:
    """A store backed by a temp file that pytest deletes after the test."""
    return TaskStore(tmp_path / "tasks.json")


@pytest.fixture
def client(store: TaskStore) -> TestClient:
    """In-process client whose routes use the temp store, not data/tasks.json."""
    app = create_app()
    app.dependency_overrides[get_store] = lambda: store
    return TestClient(app)
