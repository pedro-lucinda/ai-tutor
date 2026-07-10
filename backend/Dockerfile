FROM python:3.14-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency files first for layer caching
COPY pyproject.toml .
COPY uv.lock* .

# Install dependencies (no dev deps, no project itself yet)
RUN uv sync --no-dev --no-install-project 2>/dev/null || uv sync --no-dev

# Copy the rest of the application
COPY . .

# Run Alembic migrations then start the server
CMD ["sh", "-c", "uv run alembic upgrade head && uv run fastapi run app/main.py --host 0.0.0.0 --port 8000"]
