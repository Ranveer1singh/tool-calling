import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def client() -> TestClient:
    """A test client that calls the app in-process, no server needed."""
    return TestClient(create_app())
