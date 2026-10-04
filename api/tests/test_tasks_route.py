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


# --- POST /tasks -------------------------------------------------------------


def test_create_returns_201_and_task(client: TestClient) -> None:
    res = client.post("/tasks", json={"title": "Ship it", "dueDate": "2026-10-05"})
    assert res.status_code == 201
    body = res.json()
    assert body["title"] == "Ship it"
    assert body["dueDate"] == "2026-10-05"
    assert body["done"] is False
    assert client.get("/tasks").json() == [body]


def test_create_rejects_empty_title(client: TestClient) -> None:
    res = client.post("/tasks", json={"title": ""})
    assert res.status_code == 422


def test_create_rejects_bad_date_format(client: TestClient) -> None:
    res = client.post("/tasks", json={"title": "x", "dueDate": "tomorrow"})
    assert res.status_code == 422


# --- PATCH /tasks/{id} ---------------------------------------------------------


def test_patch_changes_only_sent_fields(client: TestClient, store: TaskStore) -> None:
    task = store.add_task("Write tests", due_date="2026-10-05")
    res = client.patch(f"/tasks/{task.id}", json={"done": True})
    assert res.status_code == 200
    body = res.json()
    assert body["done"] is True
    assert body["title"] == "Write tests"
    assert body["dueDate"] == "2026-10-05"  # untouched because it was not sent


def test_patch_can_clear_due_date_with_null(client: TestClient, store: TaskStore) -> None:
    task = store.add_task("x", due_date="2026-10-05")
    res = client.patch(f"/tasks/{task.id}", json={"dueDate": None})
    assert res.status_code == 200
    assert res.json()["dueDate"] is None


def test_patch_unknown_id_is_404(client: TestClient) -> None:
    res = client.patch("/tasks/nope", json={"done": True})
    assert res.status_code == 404
    assert "nope" in res.json()["detail"]


# --- DELETE /tasks/{id} --------------------------------------------------------


def test_delete_returns_task_and_removes_it(client: TestClient, store: TaskStore) -> None:
    task = store.add_task("x")
    res = client.delete(f"/tasks/{task.id}")
    assert res.status_code == 200
    assert res.json()["id"] == task.id
    assert client.get("/tasks").json() == []


def test_delete_unknown_id_is_404(client: TestClient) -> None:
    assert client.delete("/tasks/nope").status_code == 404
