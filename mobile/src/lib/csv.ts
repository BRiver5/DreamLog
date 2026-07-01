import type { SleepEntry } from "@/api/types";
import { formatDuration } from "./date";

/** Convert entries to a real CSV string (no placeholder). */
export function entriesToCsv(entries: SleepEntry[]): string {
  const header = [
    "date",
    "bedtime",
    "wake_time",
    "duration_minutes",
    "duration_readable",
    "quality_rating",
    "note",
  ];
  const rows = entries.map((e) => [
    e.date,
    e.bedtime,
    e.wake_time,
    String(e.duration_minutes),
    formatDuration(e.duration_minutes),
    String(e.quality_rating),
    escapeCsv(e.note ?? ""),
  ]);
  return [header, ...rows].map((r) => r.join(",")).join("\n");
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
