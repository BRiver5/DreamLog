"""Data export and reset endpoints."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_session
from app.deps import get_device
from app.models.device import Device
from app.models.sleep_entry import SleepEntry
from app.schemas.entry import EntryOut

router = APIRouter(tags=["data"])


@router.get("/export")
async def export_data(
    device: Device = Depends(get_device),
    session: AsyncSession = Depends(get_session),
) -> dict:
    stmt = (
        select(SleepEntry)
        .where(SleepEntry.device_id == device.id)
        .order_by(SleepEntry.date.desc())
    )
    result = await session.execute(stmt)
    entries = list(result.scalars().all())
    return {
        "device_id": str(device.id),
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "sleep_goal_minutes": device.sleep_goal_minutes,
        "entries": [EntryOut.model_validate(e).model_dump(mode="json") for e in entries],
    }


@router.delete("/data", status_code=status.HTTP_204_NO_CONTENT)
async def reset_data(
    device: Device = Depends(get_device),
    session: AsyncSession = Depends(get_session),
) -> None:
    """Delete all of this device's sleep entries (destructive reset)."""
    await session.execute(
        delete(SleepEntry).where(SleepEntry.device_id == device.id)
    )
