import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

import { scoreBand } from "@/lib/score";
import { colors, fonts, gradientStops, scoreColor } from "@/theme";

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** 270° arc (from 135° to 405°), gradient stroke, animates 0 -> score. */
export function ArcGauge({
  score,
  size = 220,
  strokeWidth = 16,
  label,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = 135;
  const sweep = 270;

  const bgPath = describeArc(cx, cy, radius, startAngle, startAngle + sweep);
  const fullLen = (sweep / 360) * 2 * Math.PI * radius;

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(Math.max(0, Math.min(100, score)) / 100, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: fullLen * (1 - progress.value),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={gradientStops[0]} />
            <Stop offset="0.5" stopColor={gradientStops[1]} />
            <Stop offset="1" stopColor={gradientStops[2]} />
          </LinearGradient>
        </Defs>
        <Path
          d={bgPath}
          stroke={colors.bgElevated}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        <AnimatedPath
          d={bgPath}
          stroke="url(#arcGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={fullLen}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.score}>{Math.round(score)}</Text>
        <Text style={styles.caption}>Sleep score</Text>
        <Text style={[styles.band, { color: scoreColor(score) }]}>
          {(label ?? scoreBand(score)).toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  score: { fontFamily: fonts.bold, fontSize: 52, color: colors.textPrimary },
  caption: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  band: { fontFamily: fonts.bold, fontSize: 13, letterSpacing: 1, marginTop: 4 },
});
