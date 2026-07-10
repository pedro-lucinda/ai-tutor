import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


def normalize_async_url(url: str) -> str:
    """Ensure the URL uses the asyncpg driver.

    Managed providers (e.g. Render) expose DATABASE_URL as ``postgresql://`` or
    ``postgres://``, which SQLAlchemy maps to the sync psycopg2 driver. The async
    engine requires the ``postgresql+asyncpg://`` scheme.
    """
    if url.startswith("postgresql+asyncpg://"):
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


_engine = None
_session_local = None


def _get_engine():
    global _engine
    if _engine is None:
        url = normalize_async_url(os.environ["DATABASE_URL"])
        _engine = create_async_engine(url, echo=False)
    return _engine


def _get_session_local():
    global _session_local
    if _session_local is None:
        _session_local = async_sessionmaker(
            _get_engine(), expire_on_commit=False, class_=AsyncSession
        )
    return _session_local


async def get_db() -> AsyncSession:  # type: ignore[return]
    async with _get_session_local()() as session:
        yield session
