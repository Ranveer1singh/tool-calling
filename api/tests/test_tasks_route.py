from fastapi.testclient import TestClient

from app.store import TaskStore


def test_empty(client: TestClient) -> None:
    assert client.get("/tasks").json() == []


def test_returns_camel_case_json(client: TestClient, store: TaskStore) -> None:
    store.add_task("Ship it", due_date="2026-10-03")
    body = client.get("/tasks").json()
    assert len(body) == 1
    assert body[0]["title"] == "Ship it"
    assert body[0]["dueDate"] == "2026-10-03"
    assert "createdAt" in body[0]
