import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

import { colors, gradientStops } from "@/theme";

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Smooth gradient line chart of a numeric series (e.g. minutes/night). */
export function LineChart({
  values,
  width = 320,
  height = 160,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  const pad = 8;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = pad + (values.length === 1 ? w / 2 : (i / (values.length - 1)) * w);
    const y = pad + h - ((v - min) / range) * h;
    return { x, y };
  });

  const linePath = smoothPath(points);
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${pad + h} L ${points[0].x} ${
          pad + h
        } Z`
      : "";

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [values.length]);

  const totalLen = estimateLength(points);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: totalLen * (1 - progress.value),
  }));

  return (
    <View>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={gradientStops[0]} />
            <Stop offset="0.5" stopColor={gradientStops[1]} />
            <Stop offset="1" stopColor={gradientStops[2]} />
          </LinearGradient>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={gradientStops[1]} stopOpacity="0.28" />
            <Stop offset="1" stopColor={gradientStops[1]} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {areaPath ? <Path d={areaPath} fill="url(#areaGrad)" /> : null}
        <AnimatedPath
          d={linePath}
          stroke="url(#lineGrad)"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={totalLen}
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
}

/** Catmull-Rom -> cubic bezier smoothing. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

function estimateLength(pts: { x: number; y: number }[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return len || 1;
}
