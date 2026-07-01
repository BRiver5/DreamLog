"""Sleep entry CRUD (upsert on PUT) endpoints."""
from datetime import date as date_type
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_session
from app.deps import get_device
from app.models.device import Device
from app.models.sleep_entry import SleepEntry
from app.schemas.entry import EntryIn, EntryOut
from app.services.scoring import compute_duration
from app.services.stats import range_to_days

router = APIRouter(prefix="/entries", tags=["entries"])


@router.get("", response_model=list[EntryOut])
async def list_entries(
    range: str | None = Query(default=None, pattern="^(7d|30d|90d|all)$"),
    start: date_type | None = None,
    end: date_type | None = None,
    device: Device = Depends(get_device),
    session: AsyncSession = Depends(get_session),
) -> list[SleepEntry]:
    stmt = select(SleepEntry).where(SleepEntry.device_id == device.id)

    if range and range != "all":
        days = range_to_days(range)
        if days is not None:
            cutoff = date_type.today() - timedelta(days=days - 1)
            stmt = stmt.where(SleepEntry.date >= cutoff)
    if start is not None:
        stmt = stmt.where(SleepEntry.date >= start)
    if end is not None:
        stmt = stmt.where(SleepEntry.date <= end)

    stmt = stmt.order_by(SleepEntry.date.desc())
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def _get_entry(
    session: AsyncSession, device_id, target: date_type
) -> SleepEntry | None:
    stmt = select(SleepEntry).where(
        SleepEntry.device_id == device_id, SleepEntry.date == target
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


@router.get("/{entry_date}", response_model=EntryOut)
async def get_entry(
    entry_date: date_type,
    device: Device = Depends(get_device),
    session: AsyncSession = Depends(get_session),
) -> SleepEntry:
    entry = await _get_entry(session, device.id, entry_date)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No entry for that date"
        )
    return entry


@router.put("/{entry_date}", response_model=EntryOut)
async def upsert_entry(
    entry_date: date_type,
    payload: EntryIn,
    device: Device = Depends(get_device),
    session: AsyncSession = Depends(get_session),
) -> SleepEntry:
    duration = compute_duration(payload.bedtime, payload.wake_time)
    entry = await _get_entry(session, device.id, entry_date)

    if entry is None:
        entry = SleepEntry(
            device_id=device.id,
            date=entry_date,
            bedtime=payload.bedtime,
            wake_time=payload.wake_time,
            duration_minutes=duration,
            quality_rating=payload.quality_rating,
            note=payload.note,
        )
        session.add(entry)
    else:
        entry.bedtime = payload.bedtime
        entry.wake_time = payload.wake_time
        entry.duration_minutes = duration
        entry.quality_rating = payload.quality_rating
        entry.note = payload.note

    await session.flush()
    await session.refresh(entry)
    return entry


@router.delete("/{entry_date}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    entry_date: date_type,
    device: Device = Depends(get_device),
    session: AsyncSession = Depends(get_session),
) -> None:
    entry = await _get_entry(session, device.id, entry_date)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No entry for that date"
        )
    await session.delete(entry)
