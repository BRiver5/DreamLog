/**
 * Client-side stats — mirror of backend/app/services/stats.py so the Insights
 * screen works fully offline from the local entries cache (no server round-trip
 * required). Produces the same StatsSummary shape the UI already consumes.
 */
import type { RangeKey, SleepEntry, StatsSummary } from "@/api/types";
import { addDays, fromDateKey, toDateKey } from "./date";
import { computeScore } from "./score";

const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

function rangeToDays(range: RangeKey): number | null {
  return range === "all" ? null : (RANGE_DAYS[range] ?? 30);
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}

function minutesOfDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function computeStreaks(
  entries: SleepEntry[],
  today: Date
): { current: number; longest: number } {
  if (entries.length === 0) return { current: 0, longest: 0 };
  const keys = Array.from(new Set(entries.map((e) => e.date))).sort();
  const set = new Set(keys);

  let longest = 1;
  let run = 1;
  for (let i = 1; i < keys.length; i++) {
    const prev = fromDateKey(keys[i - 1]);
    const cur = fromDateKey(keys[i]);
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    run = diff === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  let current = 0;
  let cursor = today;
  if (!set.has(toDateKey(cursor))) cursor = addDays(cursor, -1);
  while (set.has(toDateKey(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  return { current, longest };
}

export function computeSummary(
  all: SleepEntry[],
  range: RangeKey,
  goalMinutes: number,
  today: Date
): StatsSummary {
  const days = rangeToDays(range);

  const window =
    days == null
      ? all.slice()
      : all.filter((e) => e.date >= toDateKey(addDays(today, -(days - 1))));
  const windowSorted = [...window].sort((a, b) => (a.date < b.date ? -1 : 1));

  const durations = window.map((e) => e.duration_minutes);
  const qualities = window.map((e) => e.quality_rating);
  const scores = window.map((e) =>
    computeScore(e.duration_minutes, e.quality_rating, goalMinutes)
  );

  let prev: SleepEntry[] = [];
  if (days != null) {
    const prevStart = toDateKey(addDays(today, -(2 * days - 1)));
    const prevEnd = toDateKey(addDays(today, -days));
    prev = all.filter((e) => e.date >= prevStart && e.date <= prevEnd);
  }
  const prevAvgDuration = avg(prev.map((e) => e.duration_minutes));
  const prevAvgQuality = avg(prev.map((e) => e.quality_rating));

  const avgDuration = avg(durations);
  const avgQuality = avg(qualities);

  const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  for (const e of window) {
    const k = String(e.quality_rating);
    distribution[k] = (distribution[k] ?? 0) + 1;
  }

  const { current, longest } = computeStreaks(all, today);

  return {
    range,
    entry_count: window.length,
    avg_duration_minutes: avgDuration,
    avg_quality: avgQuality,
    avg_score: avg(scores),
    duration_trend: {
      value: avgDuration,
      previous: prevAvgDuration,
      delta: Math.round((avgDuration - prevAvgDuration) * 100) / 100,
    },
    quality_trend: {
      value: avgQuality,
      previous: prevAvgQuality,
      delta: Math.round((avgQuality - prevAvgQuality) * 100) / 100,
    },
    current_streak: current,
    longest_streak: longest,
    quality_distribution: distribution,
    duration_series: windowSorted.map((e) => ({
      date: e.date,
      minutes: e.duration_minutes,
      score: computeScore(e.duration_minutes, e.quality_rating, goalMinutes),
    })),
    bedtime_series: windowSorted.map((e) => ({
      date: e.date,
      minutes_of_day: minutesOfDay(e.bedtime),
    })),
  };
}
