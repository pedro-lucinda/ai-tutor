# AI Tutor Backend

FastAPI backend for the AI Tutor application.

## Requirements

- Python 3.14+
- PostgreSQL

## Local setup

### Install dependencies

**With uv (preferred):**

```bash
uv sync
```

**With pip:**

```bash
pip install -r requirements.txt
```

Regenerate `requirements.txt` after changing `pyproject.toml` or `uv.lock`:

```bash
uv export --no-dev --no-emit-project -o requirements.txt
```

### Environment variables

Copy `.env.example` to `.env` and fill in values:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL URL using the async driver, e.g. `postgresql+asyncpg://user:password@localhost:5432/ai_tutor` |
| `OPENAI_API_KEY` | OpenAI API key |
| `TAVILY_API_KEY` | Tavily API key for web search |

### Run locally

```bash
alembic upgrade head && fastapi run app/main.py --host 0.0.0.0 --port 8000
```

With uv:

```bash
uv run alembic upgrade head && uv run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

## Deploy on Render

Create a **Web Service** with **Root Directory** set to `backend` and runtime **Python**.

| Setting | Value |
| --- | --- |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `alembic upgrade head && fastapi run app/main.py --host 0.0.0.0 --port $PORT` |

Use `$PORT` — Render assigns the port dynamically. Do not hardcode `8000`.

### Environment variables on Render

Set these in the Render dashboard:

- `DATABASE_URL` — from a Render Postgres instance, rewritten to `postgresql+asyncpg://...`
- `OPENAI_API_KEY`
- `TAVILY_API_KEY`
- `PYTHON_VERSION=3.14.3` (optional; `.python-version` already pins 3.14)

### Alternative: uv on Render

If you prefer uv instead of pip, Render supports it when `uv.lock` is present:

| Setting | Value |
| --- | --- |
| Build Command | `uv sync --no-dev --no-install-project` |
| Start Command | `uv run alembic upgrade head && uv run fastapi run app/main.py --host 0.0.0.0 --port $PORT` |
