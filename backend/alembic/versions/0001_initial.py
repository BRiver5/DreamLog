"""initial schema: devices and sleep_entries

Revision ID: 0001_initial
Revises:
Create Date: 2026-07-01

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.models.types import GUID

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "devices",
        sa.Column("id", GUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("wake_reminder_time", sa.Time(), nullable=True),
        sa.Column("bed_reminder_time", sa.Time(), nullable=True),
        sa.Column("reminders_enabled", sa.Boolean(), nullable=False),
        sa.Column("sleep_goal_minutes", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "sleep_entries",
        sa.Column("id", GUID(), nullable=False),
        sa.Column("device_id", GUID(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("bedtime", sa.DateTime(timezone=True), nullable=False),
        sa.Column("wake_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("quality_rating", sa.Integer(), nullable=False),
        sa.Column("note", sa.String(length=280), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "quality_rating >= 1 AND quality_rating <= 5",
            name="ck_quality_rating_range",
        ),
        sa.ForeignKeyConstraint(["device_id"], ["devices.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("device_id", "date", name="uq_entry_device_date"),
    )
    op.create_index(
        "ix_entry_device_date", "sleep_entries", ["device_id", "date"], unique=False
    )
    op.create_index(
        op.f("ix_sleep_entries_date"), "sleep_entries", ["date"], unique=False
    )
    op.create_index(
        op.f("ix_sleep_entries_device_id"),
        "sleep_entries",
        ["device_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_sleep_entries_device_id"), table_name="sleep_entries")
    op.drop_index(op.f("ix_sleep_entries_date"), table_name="sleep_entries")
    op.drop_index("ix_entry_device_date", table_name="sleep_entries")
    op.drop_table("sleep_entries")
    op.drop_table("devices")
