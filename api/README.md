# Taskflow API

Python backend for the tool-calling agent. Being built step by step to replace
the route handlers in `web/app/api`.

## Setup

```bash
uv sync                  # creates .venv and installs everything
cp .env.example .env     # add your LLM_API_KEY
uv run fastapi dev       # http://localhost:8000, docs at /docs
```

## Checks

```bash
uv run pytest            # tests
uv run ruff check .      # lint
uv run ruff format .     # format
uv run pyright           # type check
```

## Layout

| Path | Role |
| --- | --- |
| `app/main.py` | App factory, registers routers |
| `app/config.py` | Settings from environment / `.env` |
| `app/routers/` | One file per API area |
| `tests/` | pytest, uses FastAPI's in-process test client |
