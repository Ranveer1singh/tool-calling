"""FastAPI dependencies: things routes ask for by type instead of constructing.

Using Depends() means a test can swap the real store for one backed by a temp
file without touching route code.
"""

from functools import lru_cache
from typing import Annotated

from fastapi import Depends

from app.config import get_settings
from app.store import TaskStore


@lru_cache
def get_store() -> TaskStore:
    return TaskStore(get_settings().data_file)


StoreDep = Annotated[TaskStore, Depends(get_store)]
