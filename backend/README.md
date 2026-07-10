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
| `TAVILY_API_KEY` | Tavily API key for curriculum web search |
| `AUTH0_DOMAIN` | Auth0 tenant domain |
| `AUTH0_AUDIENCE` | Auth0 API identifier |
| `AUTH0_ISSUER` | Auth0 issuer URL |
| `APP_ENCRYPTION_KEY` | 32-byte base64 key for encrypting user OpenAI keys at rest |

OpenAI keys are **per-user (BYOK)** — users add their own key in the app Settings page, not via env vars.

#### LangSmith tracing (optional)

LangChain/LangGraph auto-instruments all DeepAgents flows (course creation, lesson, quiz, final test) when these are set:

| Variable | Description |
| --- | --- |
| `LANGSMITH_TRACING` | Set `true` to enable tracing |
| `LANGSMITH_API_KEY` | LangSmith API key |
| `LANGSMITH_PROJECT` | Project name in LangSmith (e.g. `ai-tutor`) |
| `LANGSMITH_ENDPOINT` | Optional; defaults to `https://api.smith.langchain.com` |

With Docker Compose, `backend/.env` is loaded via `env_file` on the backend service.

### Run locally

```bash
alembic upgrade head && fastapi run app/main.py --host 0.0.0.0 --port 8000
```

With uv:

```bash
uv run alembic upgrade head && uv run fastapi run app/main.py --host 0.0.0.0 --port 8000
```
