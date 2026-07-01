"""Duration and sleep-score computation.

SINGLE SOURCE OF TRUTH for the sleep score. The identical formula is mirrored
in the mobile client at `mobile/src/lib/score.ts` so that optimistic client
scores match the server's reconciled value. If you change the math here, change
it there too.
"""
from datetime import datetime


def compute_duration(bedtime: datetime, wake_time: datetime) -> int:
    """Minutes between bedtime and wake time (wake must be after bedtime)."""
    delta = wake_time - bedtime
    return max(0, int(delta.total_seconds() // 60))


def compute_score(
    duration_minutes: int, quality_rating: int, goal_minutes: int
) -> int:
    """Blend duration-vs-goal (70%) with quality rating (30%) into a 0-100 score.

    - Duration component: ratio of actual to goal, capped at 1.0 (sleeping past
      the goal does not push the score above the duration ceiling).
    - Quality component: the 1-5 rating normalised to 0-1.
    """
    goal = goal_minutes if goal_minutes > 0 else 480
    duration_ratio = min(1.0, duration_minutes / goal)
    quality_ratio = max(0.0, min(1.0, (quality_rating - 1) / 4))

    score = (duration_ratio * 0.7 + quality_ratio * 0.3) * 100
    return int(round(max(0, min(100, score))))


def score_band(score: int) -> str:
    """Human-readable status label for a score, matching the Today screen."""
    if score >= 80:
        return "Nailed it!"
    if score >= 55:
        return "Not bad"
    return "Rough night"
