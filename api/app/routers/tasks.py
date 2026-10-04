from fastapi import APIRouter

from app.deps import StoreDep
from app.schemas import Task

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("")
def list_tasks(store: StoreDep) -> list[Task]:
    """All tasks, for the UI's task list. Same as GET /api/tasks in web/."""
    return store.list_tasks()
