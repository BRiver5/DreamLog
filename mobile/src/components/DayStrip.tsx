import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import type { SleepEntry } from "@/api/types";
import { computeScore } from "@/lib/score";
import { addDays, toDateKey } from "@/lib/date";
import { colors, fonts, scoreColor } from "@/theme";

const DOW = ["M", "T", "W", "T", "F", "S", "S"];

/** 7-day strip ending today. Each circle shows that day's score fill. */
export function DayStrip({
  byDate,
  goalMinutes,
  onSelect,
}: {
  byDate: Record<string, SleepEntry>;
  goalMinutes: number;
  onSelect: (dateKey: string) => void;
}) {
  const today = new Date();
  // Build Monday..Sunday of the current week.
  const dowIndex = (today.getDay() + 6) % 7; // Mon=0
  const monday = addDays(today, -dowIndex);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i);
    const key = toDateKey(d);
    const entry = byDate[key];
    const score = entry
      ? computeScore(entry.duration_minutes, entry.quality_rating, goalMinutes)
      : null;
    const isToday = key === toDateKey(today);
    return { key, label: DOW[i], score, isToday };
  });

  return (
    <View style={styles.row}>
      {days.map((d) => (
        <Pressable key={d.key} style={styles.cell} onPress={() => onSelect(d.key)}>
          <DayCircle score={d.score} highlighted={d.isToday} />
          <Text style={[styles.label, d.isToday && styles.labelToday]}>
            {d.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function DayCircle({
  score,
  highlighted,
}: {
  score: number | null;
  highlighted: boolean;
}) {
  const size = 34;
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  const pct = score == null ? 0 : score / 100;

  return (
    <View>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={highlighted ? colors.accentGlow : colors.bgElevated}
          strokeWidth={2}
          fill="none"
        />
        {score != null && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={scoreColor(score)}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between" },
  cell: { alignItems: "center", gap: 6 },
  label: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  labelToday: { color: colors.textPrimary },
});
