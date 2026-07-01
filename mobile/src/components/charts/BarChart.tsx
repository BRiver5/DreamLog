import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { colors, fonts, gradientStops, radii } from "@/theme";

export interface BarDatum {
  label: string;
  hours: number | null; // null = no entry that day
}

const AXIS_W = 30;

/**
 * 7 weekly bars with a labelled hours Y-axis, gridlines, a dashed goal line,
 * per-bar value labels, and an animated grow-from-baseline effect.
 */
export function BarChart({
  data,
  goalHours,
  height = 170,
  maxHours = 10,
}: {
  data: BarDatum[];
  goalHours: number;
  height?: number;
  maxHours?: number;
}) {
  const ceil = Math.max(maxHours, Math.ceil(goalHours + 1));
  const goalRatio = goalHours / ceil;

  // Y-axis ticks every 2 hours (0, 2, 4 … ceil).
  const ticks: number[] = [];
  for (let h = 0; h <= ceil; h += 2) ticks.push(h);

  return (
    <View>
      <View style={styles.chartRow}>
        {/* Y axis: hour labels */}
        <View style={{ width: AXIS_W, height }}>
          {ticks.map((t) => (
            <Text key={t} style={[styles.axisLabel, { bottom: (t / ceil) * height - 7 }]}>
              {t}h
            </Text>
          ))}
        </View>

        {/* Plot area */}
        <View style={{ flex: 1, height }}>
          {ticks.map((t) => (
            <View key={t} style={[styles.grid, { bottom: (t / ceil) * height }]} />
          ))}
          {/* Goal line */}
          <View style={[styles.goalLine, { bottom: goalRatio * height }]} />
          <View style={styles.bars}>
            {data.map((d, i) => (
              <Bar
                key={i}
                hours={d.hours}
                ratio={d.hours == null ? 0 : Math.min(1, d.hours / ceil)}
                index={i}
                height={height}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Day labels (aligned with plot, offset past the axis) */}
      <View style={styles.labelsRow}>
        <View style={{ width: AXIS_W }} />
        <View style={styles.labels}>
          {data.map((d, i) => (
            <Text key={i} style={styles.dayLabel}>
              {d.label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function Bar({
  hours,
  ratio,
  index,
  height,
}: {
  hours: number | null;
  ratio: number;
  index: number;
  height: number;
}) {
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = withDelay(index * 60, withTiming(ratio * height, { duration: 500 }));
  }, [ratio, height]);

  const style = useAnimatedStyle(() => ({ height: Math.max(h.value, hours == null ? 4 : 6) }));

  return (
    <View style={styles.barSlot}>
      {hours != null && (
        <Text style={styles.barValue}>{formatHours(hours)}</Text>
      )}
      <Animated.View style={[styles.bar, style]}>
        {hours == null ? (
          <View style={styles.emptyBar} />
        ) : (
          <LinearGradient
            colors={gradientStops as unknown as string[]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        )}
      </Animated.View>
    </View>
  );
}

/** "7.5" style compact hours label for above a bar. */
function formatHours(hours: number): string {
  const rounded = Math.round(hours * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

const styles = StyleSheet.create({
  chartRow: { flexDirection: "row" },
  axisLabel: {
    position: "absolute",
    right: 4,
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.textMuted,
  },
  grid: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 0,
    borderTopWidth: 1,
    borderColor: colors.divider,
    opacity: 0.5,
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: "100%",
  },
  barSlot: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  barValue: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 3,
  },
  bar: {
    width: 18,
    borderRadius: radii.button,
    overflow: "hidden",
    backgroundColor: colors.bgElevated,
  },
  emptyBar: { flex: 1, backgroundColor: colors.bgElevated },
  goalLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 0,
    borderTopWidth: 1,
    borderColor: colors.accentGlow,
    borderStyle: "dashed",
    opacity: 0.7,
  },
  labelsRow: { flexDirection: "row", marginTop: 6 },
  labels: { flex: 1, flexDirection: "row", justifyContent: "space-between" },
  dayLabel: {
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
  },
});
