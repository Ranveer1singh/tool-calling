"""Pydantic models shared across routers, tools and the store.

This is the port of web/lib/types.ts. Field names are snake_case in Python but
serialise as camelCase so the JSON matches what the frontend already expects.
"""

from pydantic import BaseModel, ConfigDict, Field
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


# --- request bodies ---------------------------------------------------------

DUE_DATE_PATTERN = r"^\d{4}-\d{2}-\d{2}$"


class TaskCreate(CamelModel):
    title: str = Field(min_length=1, description="Short description of the task")
    due_date: str | None = Field(
        default=None, pattern=DUE_DATE_PATTERN, description="YYYY-MM-DD, or null if none"
    )


class TaskUpdate(CamelModel):
    """Partial update: only fields present in the request body change.

    Every field defaults to None, so the router must look at
    `model_fields_set` to tell "not sent" apart from "sent as null".
    """

    title: str | None = Field(default=None, min_length=1)
    done: bool | None = None
    due_date: str | None = Field(default=None, pattern=DUE_DATE_PATTERN)
