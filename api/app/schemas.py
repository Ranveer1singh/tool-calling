"""Pydantic models shared across routers, tools and the store.

This is the port of web/lib/types.ts. Field names are snake_case in Python but
serialise as camelCase so the JSON matches what the frontend already expects.
"""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base for every API model: accepts and emits camelCase keys."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Task(CamelModel):
    id: str
    title: str
    done: bool
    due_date: str | None  # ISO date (YYYY-MM-DD) or None
    created_at: str  # ISO timestamp
