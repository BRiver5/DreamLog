import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";

import type { SeriesPoint } from "@/api/types";
import { colors, fonts } from "@/theme";

/**
 * Bedtime consistency scatter. Y axis = clock time (minutes of day, wrapped so
 * evening hours sit at the top), X axis = day index.
 */
export function ScatterChart({
  points,
  width = 320,
  height = 160,
}: {
  points: SeriesPoint[];
  width?: number;
  height?: number;
}) {
  const pad = 28;
  const w = width - pad;
  const h = height - pad;

  // Map minutes-of-day so 18:00 (1080) is near the top and 09:00 (540) is low.
  // Shift by 12h: a bedtime of 22:00 -> 10:00 on the shifted axis.
  const shift = (m: number) => (m + 720) % 1440;

  const vals = points.map((p) => shift(p.minutes_of_day ?? 0));
  const min = Math.min(...vals, 0);
  const max = Math.max(...vals, 1440);

  const yFor = (m: number) => pad / 2 + h - ((shift(m) - min) / (max - min || 1)) * h;
  const xFor = (i: number) =>
    pad + (points.length <= 1 ? w / 2 : (i / (points.length - 1)) * (w - pad));

  // Gridlines at a few reference bedtimes.
  const refs = [
    { label: "8pm", m: 20 * 60 },
    { label: "12am", m: 0 },
    { label: "4am", m: 4 * 60 },
  ];

  return (
    <View>
      <Svg width={width} height={height}>
        {refs.map((rf) => {
          const y = yFor(rf.m);
          return (
            <Line
              key={rf.label}
              x1={pad}
              y1={y}
              x2={width}
              y2={y}
              stroke={colors.divider}
              strokeWidth={1}
              strokeDasharray="3 4"
            />
          );
        })}
        {points.map((p, i) => (
          <Circle
            key={p.date}
            cx={xFor(i)}
            cy={yFor(p.minutes_of_day ?? 0)}
            r={5}
            fill={colors.accentGlow}
            opacity={0.9}
          />
        ))}
      </Svg>
      <View style={styles.axis} pointerEvents="none">
        {refs.map((rf) => (
          <Text
            key={rf.label}
            style={[styles.axisLabel, { top: yFor(rf.m) - 8 }]}
          >
            {rf.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  axis: { ...StyleSheet.absoluteFillObject },
  axisLabel: {
    position: "absolute",
    left: 0,
    fontFamily: fonts.regular,
    fontSize: 9,
    color: colors.textMuted,
  },
});
