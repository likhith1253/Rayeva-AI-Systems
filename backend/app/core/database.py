"""
SQLAlchemy async database setup with SQLite for development.
Auto-creates all tables on startup.
"""
import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from backend.app.core.config import get_settings


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


settings = get_settings()

# Convert sqlite:/// to sqlite+aiosqlite:/// if needed
db_url = settings.DATABASE_URL
if db_url.startswith("sqlite:///") and "aiosqlite" not in db_url:
    db_url = db_url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)

engine = create_async_engine(
    db_url,
    echo=settings.DEBUG,
    future=True,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    """FastAPI dependency that yields an async database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Create all database tables. Called on application startup."""
    # Import all models so they are registered with Base.metadata
    import backend.app.core.logger  # noqa: F401 — registers PromptLog
    import backend.app.modules.catalog.models  # noqa: F401 — registers CatalogEntry
    import backend.app.modules.proposals.models  # noqa: F401 — registers Proposal

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
