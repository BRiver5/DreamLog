import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { haptics } from "@/hooks/useHaptics";
import { QUALITY_SCALE } from "@/lib/quality";
import { colors, fonts, qualityColor, radii, spacing } from "@/theme";

export function EmojiRating({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.row}>
      {QUALITY_SCALE.map((q) => (
        <EmojiPill
          key={q.value}
          emoji={q.emoji}
          label={q.label}
          active={value === q.value}
          color={qualityColor[q.value]}
          onPress={() => {
            haptics.light();
            onChange(q.value);
          }}
        />
      ))}
    </View>
  );
}

function EmojiPill({
  emoji,
  label,
  active,
  color,
  onPress,
}: {
  emoji: string;
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(active ? 1.12 : 1, { damping: 12 });
  }, [active]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable style={styles.pillWrap} onPress={onPress}>
      <Animated.View
        style={[
          styles.pill,
          animStyle,
          active && { borderColor: color, backgroundColor: colors.bgElevated },
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
      </Animated.View>
      <Text style={[styles.label, active && { color }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between" },
  pillWrap: { alignItems: "center", flex: 1 },
  pill: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.bgSecondary,
    borderWidth: 2,
    borderColor: colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 26 },
  label: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
