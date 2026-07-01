"""Aggregate statistics computed server-side for the Insights screen."""
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from datetime import date, timedelta

from app.models.sleep_entry import SleepEntry
from app.services.scoring import compute_score

RANGE_DAYS = {"7d": 7, "30d": 30, "90d": 90}


def range_to_days(range_key: str) -> int | None:
    """Return the day-count for a range key, or None for 'all'."""
    if range_key == "all":
        return None
    return RANGE_DAYS.get(range_key, 30)


@dataclass
class TrendValue:
    value: float
    previous: float
    delta: float  # value - previous (positive == improvement)


@dataclass
class StatsSummary:
    range: str
    entry_count: int
    avg_duration_minutes: float
    avg_quality: float
    avg_score: float
    duration_trend: TrendValue
    quality_trend: TrendValue
    current_streak: int
    longest_streak: int
    quality_distribution: dict[int, int]  # rating -> count
    duration_series: list[dict] = field(default_factory=list)  # {date, minutes, score}
    bedtime_series: list[dict] = field(default_factory=list)  # {date, minutes_of_day}


def _filter_range(entries: list[SleepEntry], days: int | None, today: date) -> list[SleepEntry]:
    if days is None:
        return entries
    cutoff = today - timedelta(days=days - 1)
    return [e for e in entries if e.date >= cutoff]


def _avg(values: list[float]) -> float:
    return round(sum(values) / len(values), 2) if values else 0.0


def _compute_streaks(entries: list[SleepEntry], today: date) -> tuple[int, int]:
    """Current streak (consecutive days ending today/yesterday) and longest ever."""
    if not entries:
        return 0, 0

    logged = sorted({e.date for e in entries})
    logged_set = set(logged)

    # Longest streak: walk sorted unique dates.
    longest = 1
    run = 1
    for i in range(1, len(logged)):
        if (logged[i] - logged[i - 1]).days == 1:
            run += 1
        else:
            run = 1
        longest = max(longest, run)

    # Current streak: count back from today (or yesterday if today not logged).
    current = 0
    cursor = today
    if cursor not in logged_set:
        cursor = today - timedelta(days=1)
    while cursor in logged_set:
        current += 1
        cursor -= timedelta(days=1)

    return current, longest


def build_summary(
    entries: list[SleepEntry],
    range_key: str,
    goal_minutes: int,
    today: date,
) -> StatsSummary:
    days = range_to_days(range_key)
    window = _filter_range(entries, days, today)
    window_sorted = sorted(window, key=lambda e: e.date)

    durations = [e.duration_minutes for e in window]
    qualities = [float(e.quality_rating) for e in window]
    scores = [
        compute_score(e.duration_minutes, e.quality_rating, goal_minutes)
        for e in window
    ]

    # Previous-period comparison window for trend arrows.
    if days is not None:
        prev = [
            e
            for e in entries
            if today - timedelta(days=2 * days - 1)
            <= e.date
            <= today - timedelta(days=days)
        ]
    else:
        prev = []
    prev_durations = [e.duration_minutes for e in prev]
    prev_qualities = [float(e.quality_rating) for e in prev]

    avg_duration = _avg(durations)
    avg_quality = _avg(qualities)
    prev_avg_duration = _avg(prev_durations)
    prev_avg_quality = _avg(prev_qualities)

    current_streak, longest_streak = _compute_streaks(entries, today)

    distribution = Counter(e.quality_rating for e in window)
    quality_distribution = {r: distribution.get(r, 0) for r in range(1, 6)}

    duration_series = [
        {
            "date": e.date.isoformat(),
            "minutes": e.duration_minutes,
            "score": compute_score(e.duration_minutes, e.quality_rating, goal_minutes),
        }
        for e in window_sorted
    ]
    bedtime_series = [
        {
            "date": e.date.isoformat(),
            "minutes_of_day": e.bedtime.hour * 60 + e.bedtime.minute,
        }
        for e in window_sorted
    ]

    return StatsSummary(
        range=range_key,
        entry_count=len(window),
        avg_duration_minutes=avg_duration,
        avg_quality=avg_quality,
        avg_score=_avg([float(s) for s in scores]),
        duration_trend=TrendValue(
            value=avg_duration,
            previous=prev_avg_duration,
            delta=round(avg_duration - prev_avg_duration, 2),
        ),
        quality_trend=TrendValue(
            value=avg_quality,
            previous=prev_avg_quality,
            delta=round(avg_quality - prev_avg_quality, 2),
        ),
        current_streak=current_streak,
        longest_streak=longest_streak,
        quality_distribution=quality_distribution,
        duration_series=duration_series,
        bedtime_series=bedtime_series,
    )
