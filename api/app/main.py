"""FastAPI application factory.

Routers are registered here; each router lives in app/routers and owns one
part of the API, the same way web/app/api has one folder per route.
"""

from fastapi import FastAPI

from app.routers import health, tasks


def create_app() -> FastAPI:
    app = FastAPI(title="Taskflow API", version="0.1.0")
    app.include_router(health.router)
    app.include_router(tasks.router)
    return app


app = create_app()
