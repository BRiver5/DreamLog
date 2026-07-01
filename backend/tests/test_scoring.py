from datetime import datetime

from app.services.scoring import compute_duration, compute_score, score_band


def test_compute_duration_basic():
    bed = datetime(2026, 6, 30, 22, 0)
    wake = datetime(2026, 7, 1, 6, 30)
    assert compute_duration(bed, wake) == 510  # 8h30m


def test_compute_duration_never_negative():
    bed = datetime(2026, 7, 1, 6, 0)
    wake = datetime(2026, 7, 1, 5, 0)
    assert compute_duration(bed, wake) == 0


def test_compute_score_perfect_night():
    # Meets 8h goal exactly with top quality -> 100
    assert compute_score(480, 5, 480) == 100


def test_compute_score_worst_night():
    assert compute_score(0, 1, 480) == 0


def test_compute_score_blend():
    # Half the goal duration, mid quality (3)
    # duration_ratio=0.5 -> 0.35 ; quality_ratio=0.5 -> 0.15 ; total 0.5 -> 50
    assert compute_score(240, 3, 480) == 50


def test_compute_score_caps_over_goal():
    # Sleeping past goal does not exceed the duration ceiling
    assert compute_score(600, 5, 480) == 100


def test_score_bands():
    assert score_band(92) == "Nailed it!"
    assert score_band(60) == "Not bad"
    assert score_band(30) == "Rough night"
