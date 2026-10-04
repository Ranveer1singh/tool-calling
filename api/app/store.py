"""JSON-file task store, the port of web/lib/store.ts.

Simple and inspectable; swap for a database later. The store is a class that
takes its file path so tests can point it at a temporary file instead of the
real data/tasks.json.
"""

import json
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from app.schemas import Task


class _Unset:
    """Sentinel type: 'this argument was not passed'."""


UNSET = _Unset()


class TaskStore:
    def __init__(self, path: Path) -> None:
        self.path = path

    # --- file access -------------------------------------------------------

    def _read_all(self) -> list[Task]:
        try:
            raw = self.path.read_text(encoding="utf-8")
        except FileNotFoundError:
            return []
        return [Task.model_validate(item) for item in json.loads(raw)]

    def _write_all(self, tasks: list[Task]) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        data = [t.model_dump(by_alias=True) for t in tasks]
        self.path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    # --- operations --------------------------------------------------------

    def list_tasks(self) -> list[Task]:
        return self._read_all()

    def add_task(self, title: str, due_date: str | None = None) -> Task:
        tasks = self._read_all()
        task = Task(
            id=uuid4().hex[:8],
            title=title.strip(),
            done=False,
            due_date=due_date,
            created_at=_now_iso(),
        )
        tasks.append(task)
        self._write_all(tasks)
        return task

    def edit_task(
        self,
        task_id: str,
        *,
        title: str | None = None,
        done: bool | None = None,
        due_date: str | None | _Unset = UNSET,
    ) -> Task | None:
        """Update only the provided fields. Returns None if the id is unknown.

        due_date is special: None is a real value (clear the date), so an
        internal sentinel distinguishes "not provided" from "set to None".
        """
        tasks = self._read_all()
        task = next((t for t in tasks if t.id == task_id), None)
        if task is None:
            return None
        if title is not None:
            task.title = title.strip()
        if done is not None:
            task.done = done
        if not isinstance(due_date, _Unset):
            task.due_date = due_date
        self._write_all(tasks)
        return task

    def delete_task(self, task_id: str) -> Task | None:
        tasks = self._read_all()
        task = next((t for t in tasks if t.id == task_id), None)
        if task is None:
            return None
        tasks.remove(task)
        self._write_all(tasks)
        return task


def _now_iso() -> str:
    """Current UTC time as an ISO string with a Z suffix, matching JS toISOString()."""
    return datetime.now(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")
