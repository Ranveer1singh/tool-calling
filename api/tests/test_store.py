from pathlib import Path

from app.store import TaskStore


def test_missing_file_is_empty_list(store: TaskStore) -> None:
    assert store.list_tasks() == []


def test_add_then_list(store: TaskStore) -> None:
    task = store.add_task("  Review proposal  ", due_date="2026-10-03")
    assert task.title == "Review proposal"  # trimmed
    assert task.done is False
    assert len(task.id) == 8
    assert task.created_at.endswith("Z")
    assert store.list_tasks() == [task]


def test_file_uses_camel_case_keys(store: TaskStore) -> None:
    store.add_task("x", due_date="2026-10-03")
    text = Path(store.path).read_text()
    assert '"dueDate"' in text and '"createdAt"' in text
    assert "due_date" not in text


def test_edit_only_changes_given_fields(store: TaskStore) -> None:
    task = store.add_task("Write tests", due_date="2026-10-03")
    edited = store.edit_task(task.id, done=True)
    assert edited is not None
    assert edited.done is True
    assert edited.title == "Write tests"
    assert edited.due_date == "2026-10-03"


def test_edit_can_clear_due_date(store: TaskStore) -> None:
    task = store.add_task("x", due_date="2026-10-03")
    edited = store.edit_task(task.id, due_date=None)
    assert edited is not None and edited.due_date is None


def test_edit_unknown_id_returns_none(store: TaskStore) -> None:
    assert store.edit_task("nope", done=True) is None


def test_delete(store: TaskStore) -> None:
    task = store.add_task("x")
    assert store.delete_task(task.id) == task
    assert store.list_tasks() == []
    assert store.delete_task(task.id) is None
