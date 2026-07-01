import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { QUALITY_SCALE } from "@/lib/quality";
import { colors, fonts, qualityColor, spacing } from "@/theme";

/** Quality distribution donut. `distribution` maps rating(1-5) -> count. */
export function DonutChart({
  distribution,
  size = 150,
  strokeWidth = 20,
}: {
  distribution: Record<string, number>;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  let offset = 0;
  const segments =
    total > 0
      ? [1, 2, 3, 4, 5].map((rating) => {
          const count = distribution[String(rating)] ?? 0;
          const frac = count / total;
          const seg = {
            rating,
            color: qualityColor[rating],
            dash: frac * c,
            offset: offset,
            count,
          };
          offset += frac * c;
          return seg;
        })
      : [];

  return (
    <View style={styles.row}>
      <View>
        <Svg width={size} height={size}>
          <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={colors.bgElevated}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {segments.map((s) =>
              s.count > 0 ? (
                <Circle
                  key={s.rating}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke={s.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${s.dash} ${c - s.dash}`}
                  strokeDashoffset={-s.offset}
                />
              ) : null
            )}
          </G>
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.total}>{total}</Text>
          <Text style={styles.totalLabel}>nights</Text>
        </View>
      </View>
      <View style={styles.legend}>
        {QUALITY_SCALE.map((q) => {
          const count = distribution[String(q.value)] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <View key={q.value} style={styles.legendRow}>
              <Text style={styles.legendEmoji}>{q.emoji}</Text>
              <View
                style={[styles.dot, { backgroundColor: qualityColor[q.value] }]}
              />
              <Text style={styles.legendLabel}>{q.label}</Text>
              <Text style={styles.legendPct}>{pct}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  total: { fontFamily: fonts.bold, fontSize: 26, color: colors.textPrimary },
  totalLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary },
  legend: { flex: 1, gap: 6 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendEmoji: { fontSize: 14, width: 20 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  legendPct: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textPrimary },
});
