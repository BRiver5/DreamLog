/**
 * DreamLog color tokens — see spec §3.1. Dark, cosmic-purple system.
 */
export const colors = {
  bgPrimary: "#14101F",
  bgSecondary: "#1E1A2E",
  bgElevated: "#292440",

  gradientStart: "#6C63F7",
  gradientMid: "#A25FE0",
  gradientEnd: "#E667B8",

  accentPrimary: "#8B7CF6",
  accentGlow: "#B98CFF",

  textPrimary: "#F5F3FA",
  textSecondary: "#A9A3C2",
  textMuted: "#6E6889",

  success: "#4ADE9C",
  warning: "#F5B860",
  danger: "#F2607A",

  borderSubtle: "rgba(255,255,255,0.06)",
  divider: "rgba(255,255,255,0.10)",
} as const;

/** 135° gradient stops used for the arc, CTAs, active tab, chart strokes. */
export const gradientStops = [
  colors.gradientStart,
  colors.gradientMid,
  colors.gradientEnd,
] as const;

/** Quality rating (1–5) -> semantic color, per spec §5.2. */
export const qualityColor: Record<number, string> = {
  1: colors.danger,
  2: colors.warning,
  3: colors.textSecondary,
  4: colors.accentPrimary,
  5: colors.success,
};

/** Score band -> color, mirrors backend services/scoring.py. */
export function scoreColor(score: number): string {
  if (score >= 80) return colors.success;
  if (score >= 55) return colors.accentPrimary;
  return colors.danger;
}
