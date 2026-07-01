import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { colors, fonts } from "@/theme";

/** Brief checkmark burst shown after a successful save (spec §6). */
export function SaveSuccess({ onDone }: { onDone: () => void }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.15, { damping: 8 }),
      withSpring(1, { damping: 12 })
    );
    opacity.value = withTiming(0, { duration: 900 });
    const t = setTimeout(onDone, 950);
    return () => clearTimeout(t);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[styles.badge, style]}>
        <Text style={styles.check}>✓</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  check: { fontSize: 52, color: "#0B2C1E", fontFamily: fonts.bold },
});
