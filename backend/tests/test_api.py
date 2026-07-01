import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.db.base as db_base
from app.db.base import Base
from app.deps import get_device  # noqa: F401
from app.main import app

DEVICE_ID = str(uuid.uuid4())
HEADERS = {"X-Device-Id": DEVICE_ID}


@pytest_asyncio.fixture
async def client(tmp_path, monkeypatch):
    # Isolated in-memory-ish sqlite file per test session.
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{tmp_path/'test.db'}", future=True
    )
    testing_session = async_sessionmaker(
        bind=engine, expire_on_commit=False, autoflush=False
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def override_get_session():
        async with testing_session() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    # Neutralise the lifespan init_db (it would use the app engine).
    monkeypatch.setattr("app.main.init_db", lambda: _noop())
    app.dependency_overrides[db_base.get_session] = override_get_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()
    await engine.dispose()


async def _noop():
    return None


@pytest.mark.asyncio
async def test_malformed_device_id_returns_400(client):
    resp = await client.get(
        "/api/v1/entries", headers={"X-Device-Id": "not-a-uuid"}
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_missing_entry_returns_404(client):
    resp = await client.get("/api/v1/entries/2026-07-01", headers=HEADERS)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_upsert_creates_then_updates(client):
    body = {
        "bedtime": "2026-06-30T22:00:00",
        "wake_time": "2026-07-01T06:00:00",
        "quality_rating": 4,
        "note": "slept well",
    }
    r1 = await client.put("/api/v1/entries/2026-07-01", json=body, headers=HEADERS)
    assert r1.status_code == 200
    data1 = r1.json()
    assert data1["duration_minutes"] == 480
    first_id = data1["id"]

    # Same date PUT should update in place, not duplicate.
    body["quality_rating"] = 5
    r2 = await client.put("/api/v1/entries/2026-07-01", json=body, headers=HEADERS)
    assert r2.status_code == 200
    assert r2.json()["id"] == first_id
    assert r2.json()["quality_rating"] == 5

    listed = await client.get("/api/v1/entries", headers=HEADERS)
    assert len(listed.json()) == 1


@pytest.mark.asyncio
async def test_stats_summary_shape(client):
    body = {
        "bedtime": "2026-06-30T22:00:00",
        "wake_time": "2026-07-01T06:00:00",
        "quality_rating": 5,
    }
    await client.put("/api/v1/entries/2026-07-01", json=body, headers=HEADERS)
    resp = await client.get("/api/v1/stats/summary?range=7d", headers=HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert data["entry_count"] == 1
    assert "current_streak" in data
    assert set(data["quality_distribution"].keys()) == {"1", "2", "3", "4", "5"}
