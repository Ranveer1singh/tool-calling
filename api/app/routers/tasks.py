from fastapi import APIRouter, HTTPException, status

from app.deps import StoreDep
from app.schemas import Task, TaskCreate, TaskUpdate
from app.store import UNSET

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("")
def list_tasks(store: StoreDep) -> list[Task]:
    """All tasks, for the UI's task list. Same as GET /api/tasks in web/."""
    return store.list_tasks()


@router.post("", status_code=status.HTTP_201_CREATED)
def create_task(body: TaskCreate, store: StoreDep) -> Task:
    """Create a task. The body is validated against TaskCreate before this runs."""
    return store.add_task(body.title, due_date=body.due_date)


@router.patch("/{task_id}")
def update_task(task_id: str, body: TaskUpdate, store: StoreDep) -> Task:
    """Change only the fields that were sent. 404 if the id is unknown."""
    sent = body.model_fields_set
    task = store.edit_task(
        task_id,
        title=body.title,
        done=body.done,
        due_date=body.due_date if "due_date" in sent else UNSET,
    )
    if task is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"No task with id {task_id}")
    return task


@router.delete("/{task_id}")
def delete_task(task_id: str, store: StoreDep) -> Task:
    """Delete a task and return it, so the caller can show what was removed."""
    task = store.delete_task(task_id)
    if task is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"No task with id {task_id}")
    return task
