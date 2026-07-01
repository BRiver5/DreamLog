import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ArcGauge } from "@/components/ArcGauge";
import { DayStrip } from "@/components/DayStrip";
import { EmptyState } from "@/components/EmptyState";
import { ProgressBar } from "@/components/ProgressBar";
import { StatPill } from "@/components/StatPill";
import { haptics } from "@/hooks/useHaptics";
import {
  formatClock,
  formatDuration,
  formatLongDate,
  greeting,
  todayKey,
} from "@/lib/date";
import { computeScore } from "@/lib/score";
import { useEntriesStore } from "@/store/entriesStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useUIStore } from "@/store/uiStore";
import { colors, fonts, gradientStops, radii, spacing } from "@/theme";

export default function TodayScreen() {
  const byDate = useEntriesStore((s) => s.byDate);
  const error = useEntriesStore((s) => s.error);
  const goalMinutes = useSettingsStore((s) => s.settings.sleep_goal_minutes);
  const openLogSheet = useUIStore((s) => s.openLogSheet);

  const key = todayKey();
  const entry = byDate[key];
  const now = new Date();

  const score = entry
    ? computeScore(entry.duration_minutes, entry.quality_rating, goalMinutes)
    : 0;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.greeting}>{greeting(now)}</Text>
          <Text style={styles.date}>{formatLongDate(now)}</Text>
        </Animated.View>

        {error && (
          <View style={styles.offline}>
            <Text style={styles.offlineText}>{error}</Text>
          </View>
        )}

        {entry ? (
          <>
            <Animated.View
              entering={FadeInDown.delay(80).duration(500)}
              style={styles.gaugeWrap}
            >
              <ArcGauge score={score} />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(160).duration(500)}
              style={styles.statRow}
            >
              <StatPill
                icon={<Text style={styles.pillIcon}>😴</Text>}
                label="Time asleep"
                value={formatDuration(entry.duration_minutes)}
              />
              <StatPill
                icon={<Text style={styles.pillIcon}>🎯</Text>}
                label="Sleep goal"
                value={formatDuration(goalMinutes)}
              />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(220).duration(500)}
              style={styles.bedWake}
            >
              <View style={styles.bedWakeItem}>
                <Text style={styles.pillIcon}>🌙</Text>
                <Text style={styles.bedWakeText}>
                  {formatClock(new Date(entry.bedtime))}
                </Text>
              </View>
              <View style={styles.bedWakeDivider} />
              <View style={styles.bedWakeItem}>
                <Text style={styles.pillIcon}>☀️</Text>
                <Text style={styles.bedWakeText}>
                  {formatClock(new Date(entry.wake_time))}
                </Text>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(280).duration(500)}
              style={styles.progressSection}
            >
              <ProgressBar progress={entry.duration_minutes / goalMinutes} />
              <Text style={styles.progressLabel}>
                {entry.duration_minutes >= goalMinutes
                  ? "You reached your sleep goal 🎉"
                  : `${formatDuration(
                      Math.max(0, goalMinutes - entry.duration_minutes)
                    )} below your goal`}
              </Text>
            </Animated.View>
          </>
        ) : (
          <Animated.View
            entering={FadeInDown.delay(80).duration(500)}
            style={styles.emptyWrap}
          >
            <EmptyState
              title="No sleep logged yet"
              message="Tap the button below to log last night's sleep in two taps."
            />
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInDown.delay(340).duration(500)}
          style={styles.strip}
        >
          <Text style={styles.sectionTitle}>This week</Text>
          <DayStrip
            byDate={byDate}
            goalMinutes={goalMinutes}
            onSelect={(dateKey) => {
              const e = byDate[dateKey];
              haptics.light();
              openLogSheet(e ? { entry: e } : { date: dateKey });
            }}
          />
        </Animated.View>

        {/* Clearance so the last row scrolls above the floating FAB + tab bar. */}
        <View style={{ height: 210 }} />
      </ScrollView>

      {/* Floating "Log Sleep" FAB overlapping the tab bar. */}
      <Animated.View entering={FadeInDown.delay(400)} style={styles.fabWrap}>
        <LinearGradient
          colors={gradientStops as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Text
            style={styles.fabText}
            onPress={() => {
              haptics.medium();
              openLogSheet(entry ? { entry } : { date: key });
            }}
          >
            🌙  Log Sleep
          </Text>
        </LinearGradient>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  greeting: { fontFamily: fonts.bold, fontSize: 30, color: colors.textPrimary },
  date: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 2,
  },
  offline: {
    marginTop: spacing.lg,
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.button,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  offlineText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary },
  gaugeWrap: { alignItems: "center", marginTop: spacing.xl },
  statRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl },
  pillIcon: { fontSize: 16 },
  bedWake: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  bedWakeItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  bedWakeText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.textPrimary },
  bedWakeDivider: { width: 1, height: 24, backgroundColor: colors.divider },
  progressSection: { marginTop: spacing.xl },
  progressLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  emptyWrap: { marginTop: spacing.xl },
  strip: { marginTop: spacing.xxl },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  fabWrap: {
    position: "absolute",
    bottom: 124,
    alignSelf: "center",
  },
  fab: {
    borderRadius: radii.pill,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxl,
  },
  fabText: { fontFamily: fonts.semibold, fontSize: 16, color: "#FFFFFF" },
});
