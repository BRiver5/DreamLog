import { useEffect, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { haptics } from "@/hooks/useHaptics";
import type { RangeKey } from "@/api/types";
import { colors, fonts, radii, spacing } from "@/theme";

const OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "all", label: "All" },
];

export function RangeSelector({
  value,
  onChange,
}: {
  value: RangeKey;
  onChange: (r: RangeKey) => void;
}) {
  const [w, setW] = useState(0);
  const index = OPTIONS.findIndex((o) => o.key === value);
  const cellW = w / OPTIONS.length;
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withTiming(index * cellW, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [index, cellW]);

  const indicator = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    width: cellW,
  }));

  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  return (
    <View style={styles.track} onLayout={onLayout}>
      {w > 0 && <Animated.View style={[styles.indicator, indicator]} />}
      {OPTIONS.map((o) => (
        <Pressable
          key={o.key}
          style={styles.cell}
          onPress={() => {
            haptics.light();
            onChange(o.key);
          }}
        >
          <Text style={[styles.label, value === o.key && styles.labelActive]}>
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.pill,
    padding: 4,
    position: "relative",
  },
  indicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: colors.accentPrimary,
    borderRadius: radii.pill,
  },
  cell: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    zIndex: 1,
  },
  label: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary },
  labelActive: { color: "#FFFFFF", fontFamily: fonts.semibold },
});
