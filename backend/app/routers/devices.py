"""Device registration and settings endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_session
from app.deps import get_device
from app.models.device import Device
from app.schemas.device import DeviceOut, SettingsIn, SettingsOut

router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("/register", response_model=DeviceOut)
async def register_device(device: Device = Depends(get_device)) -> Device:
    """Explicit first-launch registration. Idempotent — returns the device."""
    return device


settings_router = APIRouter(prefix="/settings", tags=["settings"])


@settings_router.get("", response_model=SettingsOut)
async def get_settings(device: Device = Depends(get_device)) -> Device:
    return device


@settings_router.put("", response_model=SettingsOut)
async def update_settings(
    payload: SettingsIn,
    device: Device = Depends(get_device),
    session: AsyncSession = Depends(get_session),
) -> Device:
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(device, field, value)
    session.add(device)
    await session.flush()
    return device
