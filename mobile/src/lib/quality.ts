/** The 5-emoji quality scale, per spec §5.2. */
export interface QualityOption {
  value: number;
  emoji: string;
  label: string;
}

export const QUALITY_SCALE: QualityOption[] = [
  { value: 1, emoji: "😩", label: "Terrible" },
  { value: 2, emoji: "😕", label: "Poor" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "🤩", label: "Amazing" },
];

export function qualityFor(value: number): QualityOption {
  return QUALITY_SCALE[Math.max(0, Math.min(4, value - 1))];
}
