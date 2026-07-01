import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { colors, gradientStops, radii } from "@/theme";

export function ProgressBar({ progress }: { progress: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withTiming(Math.max(0, Math.min(1, progress)), { duration: 700 });
  }, [progress]);

  const style = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, style]}>
        <LinearGradient
          colors={gradientStops as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.bgElevated,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: radii.pill, overflow: "hidden" },
});
