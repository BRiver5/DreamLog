/** Date helpers used across the app. All local-time based. */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** ISO date key (YYYY-MM-DD) in local time — the SleepEntry.date convention. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

/** "Wednesday, 22 Aug" style long date for headers. */
export function formatLongDate(d: Date): string {
  const weekday = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday",
  ][d.getDay()];
  return `${weekday}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatShortDate(key: string): string {
  const d = fromDateKey(key);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

// Global 12h/24h clock preference. Set from the prefs store on boot/change so
// every formatClock call reflects the user's choice without threading a prop
// through every component.
let clock24 = false;
export function setClockFormat(is24: boolean): void {
  clock24 = is24;
}
export function isClock24(): boolean {
  return clock24;
}

/** "10:37 pm" (12h) or "22:37" (24h) clock time, per the global preference. */
export function formatClock(d: Date): string {
  const m = String(d.getMinutes()).padStart(2, "0");
  if (clock24) {
    return `${String(d.getHours()).padStart(2, "0")}:${m}`;
  }
  let h = d.getHours();
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

/** "8h 26m" duration from minutes. */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

/** Round a date to the nearest 5 minutes (used for wake-time defaults). */
export function roundToNearest5(d: Date): Date {
  const copy = new Date(d);
  const mins = copy.getMinutes();
  copy.setMinutes(Math.round(mins / 5) * 5, 0, 0);
  return copy;
}

/** Time-aware greeting for the Today header. */
export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export { DAYS, MONTHS };
