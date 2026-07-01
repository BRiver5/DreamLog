"""Device model — the anonymous per-install identity."""
import uuid
from datetime import datetime, time

from sqlalchemy import Boolean, DateTime, Integer, Time, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.types import GUID

DEFAULT_SLEEP_GOAL_MINUTES = 480  # 8 hours


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    wake_reminder_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    bed_reminder_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    reminders_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    sleep_goal_minutes: Mapped[int] = mapped_column(
        Integer, default=DEFAULT_SLEEP_GOAL_MINUTES
    )

    entries: Mapped[list["SleepEntry"]] = relationship(  # noqa: F821
        back_populates="device",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
