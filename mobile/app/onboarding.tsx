import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GradientButton } from "@/components/GradientButton";
import { completeDeviceSetup } from "@/lib/bootstrap";
import { useUIStore } from "@/store/uiStore";
import { colors, fonts, spacing } from "@/theme";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    emoji: "🌙",
    title: "Welcome to DreamLog",
    body: "A manual sleep diary. No wearables, no motion sensors, no background tracking — just you, logging your nights.",
  },
  {
    emoji: "⭐",
    title: "Log in two taps",
    body: "Pick tonight's rating on the 5-emoji scale and hit Save. Smart default times mean most nights take seconds.",
  },
  {
    emoji: "🔒",
    title: "Your data stays yours",
    body: "No email, no account. We create an anonymous ID on this device. Uninstalling the app clears your data — that's it.",
  },
];

export default function Onboarding() {
  const router = useRouter();
  const completeOnboarding = useUIStore((s) => s.completeOnboarding);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const goNext = () => {
    if (index < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
    }
  };

  const finish = async () => {
    setBusy(true);
    await completeDeviceSetup();
    await completeOnboarding();
    router.replace("/");
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topRow}>
        {!isLast ? (
          <Pressable onPress={finish}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
      >
        {SLIDES.map((s) => (
          <View key={s.title} style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{s.emoji}</Text>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <GradientButton
          label={isLast ? "Get Started" : "Next"}
          onPress={isLast ? finish : goNext}
          loading={busy}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  topRow: {
    height: 44,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: spacing.xl,
  },
  skip: { fontFamily: fonts.medium, fontSize: 15, color: colors.textSecondary },
  slide: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  emoji: { fontSize: 88, marginBottom: spacing.xl },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bgElevated,
  },
  dotActive: { backgroundColor: colors.accentPrimary, width: 22 },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
