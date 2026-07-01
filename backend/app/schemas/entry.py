"""Pydantic schemas for sleep entries."""
import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class EntryIn(BaseModel):
    bedtime: datetime
    wake_time: datetime
    quality_rating: int = Field(..., ge=1, le=5)
    note: str | None = Field(default=None, max_length=280)

    @model_validator(mode="after")
    def validate_times(self) -> "EntryIn":
        if self.wake_time <= self.bedtime:
            raise ValueError("wake_time must be after bedtime")
        return self


class EntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    date: date
    bedtime: datetime
    wake_time: datetime
    duration_minutes: int
    quality_rating: int
    note: str | None
    created_at: datetime
    updated_at: datetime
