from datetime import date, datetime, timedelta

from app.services.stats import build_summary


class FakeEntry:
    def __init__(self, d: date, duration: int, rating: int, bedhour: int = 22):
        self.date = d
        self.duration_minutes = duration
        self.quality_rating = rating
        self.bedtime = datetime(d.year, d.month, d.day, bedhour, 0)


def _consecutive(today: date, n: int) -> list[FakeEntry]:
    return [FakeEntry(today - timedelta(days=i), 480, 4) for i in range(n)]


def test_current_and_longest_streak():
    today = date(2026, 7, 1)
    entries = _consecutive(today, 5)
    summary = build_summary(entries, "all", 480, today)
    assert summary.current_streak == 5
    assert summary.longest_streak == 5


def test_broken_streak_resets_current():
    today = date(2026, 7, 1)
    entries = _consecutive(today, 3)
    # A gap, then an older run of 4
    entries += [FakeEntry(today - timedelta(days=i), 480, 4) for i in range(5, 9)]
    summary = build_summary(entries, "all", 480, today)
    assert summary.current_streak == 3
    assert summary.longest_streak == 4


def test_quality_distribution_and_averages():
    today = date(2026, 7, 1)
    entries = [
        FakeEntry(today, 480, 5),
        FakeEntry(today - timedelta(days=1), 420, 3),
        FakeEntry(today - timedelta(days=2), 360, 1),
    ]
    summary = build_summary(entries, "7d", 480, today)
    assert summary.entry_count == 3
    assert summary.quality_distribution == {1: 1, 2: 0, 3: 1, 4: 0, 5: 1}
    assert summary.avg_quality == 3.0
    assert summary.avg_duration_minutes == 420.0
    assert len(summary.duration_series) == 3
    assert len(summary.bedtime_series) == 3


def test_empty_data_no_crash():
    today = date(2026, 7, 1)
    summary = build_summary([], "30d", 480, today)
    assert summary.entry_count == 0
    assert summary.current_streak == 0
    assert summary.avg_score == 0.0
