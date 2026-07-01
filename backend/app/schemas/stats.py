"""Pydantic schemas for aggregate statistics."""
from pydantic import BaseModel


class TrendOut(BaseModel):
    value: float
    previous: float
    delta: float


class SeriesPointOut(BaseModel):
    date: str
    minutes: int | None = None
    score: int | None = None
    minutes_of_day: int | None = None


class StatsSummaryOut(BaseModel):
    range: str
    entry_count: int
    avg_duration_minutes: float
    avg_quality: float
    avg_score: float
    duration_trend: TrendOut
    quality_trend: TrendOut
    current_streak: int
    longest_streak: int
    quality_distribution: dict[int, int]
    duration_series: list[SeriesPointOut]
    bedtime_series: list[SeriesPointOut]
