"""Shared FastAPI dependencies."""
import uuid

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_session
from app.models.device import Device


async def get_device(
    x_device_id: str = Header(..., alias="X-Device-Id"),
    session: AsyncSession = Depends(get_session),
) -> Device:
    """Resolve the Device for the incoming X-Device-Id header.

    - Rejects a malformed UUID with 400.
    - Creates the Device row on first sight (implicit registration).
    """
    try:
        device_uuid = uuid.UUID(str(x_device_id))
    except (ValueError, AttributeError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Device-Id must be a well-formed UUID",
        )

    device = await session.get(Device, device_uuid)
    if device is None:
        device = Device(id=device_uuid)
        session.add(device)
        await session.flush()
    return device
