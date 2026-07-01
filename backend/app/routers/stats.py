"""Server-computed aggregate statistics endpoint."""
from dataclasses import asdict
from datetime import date as date_type

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_session
from app.deps import get_device
from app.models.device import Device
from app.models.sleep_entry import SleepEntry
from app.schemas.stats import StatsSummaryOut
from app.services.stats import build_summary

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/summary", response_model=StatsSummaryOut)
async def stats_summary(
    range: str = Query(default="30d", pattern="^(7d|30d|90d|all)$"),
    device: Device = Depends(get_device),
    session: AsyncSession = Depends(get_session),
) -> StatsSummaryOut:
    stmt = select(SleepEntry).where(SleepEntry.device_id == device.id)
    result = await session.execute(stmt)
    entries = list(result.scalars().all())

    summary = build_summary(
        entries, range, device.sleep_goal_minutes, date_type.today()
    )
    return StatsSummaryOut(**asdict(summary))
