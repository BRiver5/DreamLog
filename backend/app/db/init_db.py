"""Create tables for local/dev use (Alembic manages production migrations)."""
from app.db.base import Base, engine
from app.models import Device, SleepEntry  # noqa: F401  (register metadata)


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
