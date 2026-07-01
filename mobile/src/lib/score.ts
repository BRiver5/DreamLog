/**
 * Sleep score + duration — MIRROR of backend/app/services/scoring.py.
 * Keep the math identical so optimistic client scores match the server's
 * reconciled value. If you change it here, change it there too.
 */

export function computeDurationMinutes(bedtime: Date, wakeTime: Date): number {
  const ms = wakeTime.getTime() - bedtime.getTime();
  return Math.max(0, Math.floor(ms / 60000));
}

export function computeScore(
  durationMinutes: number,
  qualityRating: number,
  goalMinutes: number
): number {
  const goal = goalMinutes > 0 ? goalMinutes : 480;
  const durationRatio = Math.min(1, durationMinutes / goal);
  const qualityRatio = Math.max(0, Math.min(1, (qualityRating - 1) / 4));
  const score = (durationRatio * 0.7 + qualityRatio * 0.3) * 100;
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function scoreBand(score: number): string {
  if (score >= 80) return "Nailed it!";
  if (score >= 55) return "Not bad";
  return "Rough night";
}
