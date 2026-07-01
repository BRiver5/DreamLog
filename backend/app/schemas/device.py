"""Pydantic schemas for device identity and settings."""
import uuid
from datetime import datetime, time

from pydantic import BaseModel, ConfigDict, Field


class DeviceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    reminders_enabled: bool
    wake_reminder_time: time | None
    bed_reminder_time: time | None
    sleep_goal_minutes: int


class SettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sleep_goal_minutes: int
    reminders_enabled: bool
    wake_reminder_time: time | None
    bed_reminder_time: time | None


class SettingsIn(BaseModel):
    sleep_goal_minutes: int | None = Field(default=None, ge=180, le=900)
    reminders_enabled: bool | None = None
    wake_reminder_time: time | None = None
    bed_reminder_time: time | None = None
