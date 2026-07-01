/** Shared API types mirroring the backend Pydantic schemas. */

export interface SleepEntry {
  id: string;
  date: string; // YYYY-MM-DD
  bedtime: string; // ISO datetime
  wake_time: string; // ISO datetime
  duration_minutes: number;
  quality_rating: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntryInput {
  bedtime: string;
  wake_time: string;
  quality_rating: number;
  note?: string | null;
}

export interface Settings {
  sleep_goal_minutes: number;
  reminders_enabled: boolean;
  wake_reminder_time: string | null; // HH:MM:SS
  bed_reminder_time: string | null;
}

export interface SettingsInput {
  sleep_goal_minutes?: number;
  reminders_enabled?: boolean;
  wake_reminder_time?: string | null;
  bed_reminder_time?: string | null;
}

export interface TrendValue {
  value: number;
  previous: number;
  delta: number;
}

export interface SeriesPoint {
  date: string;
  minutes?: number;
  score?: number;
  minutes_of_day?: number;
}

export interface StatsSummary {
  range: string;
  entry_count: number;
  avg_duration_minutes: number;
  avg_quality: number;
  avg_score: number;
  duration_trend: TrendValue;
  quality_trend: TrendValue;
  current_streak: number;
  longest_streak: number;
  quality_distribution: Record<string, number>;
  duration_series: SeriesPoint[];
  bedtime_series: SeriesPoint[];
}

export type RangeKey = "7d" | "30d" | "90d" | "all";
