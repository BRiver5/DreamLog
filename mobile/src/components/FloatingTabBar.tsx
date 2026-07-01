import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { haptics } from "@/hooks/useHaptics";
import { colors, fonts, gradientStops, radii, spacing } from "@/theme";

const ICONS: Record<string, string> = {
  index: "🏠",
  history: "📅",
  insights: "📊",
  settings: "⚙️",
};
const LABELS: Record<string, string> = {
  index: "Today",
  history: "History",
  insights: "Insights",
  settings: "Settings",
};

/**
 * Floating rounded semi-transparent tab bar with a gradient circular highlight
 * that springs to the active tab (spec §3.3 / §10).
 */
export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { bottom: insets.bottom + spacing.md }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const onPress = () => {
            haptics.light();
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          return (
            <TabItem
              key={route.key}
              name={route.name}
              focused={focused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabItem({
  name,
  focused,
  onPress,
}: {
  name: string;
  focused: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(focused ? 1 : 0.9);
  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.9, { damping: 14 });
  }, [focused]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable style={styles.item} onPress={onPress}>
      <Animated.View style={[styles.iconWrap, animStyle]}>
        {focused ? (
          <LinearGradient
            colors={gradientStops as unknown as string[]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.activeCircle}
          >
            <Text style={styles.icon}>{ICONS[name] ?? "•"}</Text>
          </LinearGradient>
        ) : (
          <Text style={[styles.icon, styles.iconInactive]}>
            {ICONS[name] ?? "•"}
          </Text>
        )}
      </Animated.View>
      <Text style={[styles.label, focused && styles.labelActive]}>
        {LABELS[name] ?? name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: spacing.xl, right: spacing.xl },
  bar: {
    flexDirection: "row",
    backgroundColor: "rgba(30,26,46,0.92)",
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  item: { flex: 1, alignItems: "center", gap: 2, paddingVertical: 4 },
  iconWrap: { alignItems: "center", justifyContent: "center", height: 40 },
  activeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 18 },
  iconInactive: { opacity: 0.6 },
  label: { fontFamily: fonts.medium, fontSize: 10, color: colors.textMuted },
  labelActive: { color: colors.textPrimary, fontFamily: fonts.semibold },
});
