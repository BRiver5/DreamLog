import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import type { SleepEntry } from "@/api/types";
import { BarChart, BarDatum } from "@/components/charts/BarChart";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { haptics } from "@/hooks/useHaptics";
import {
  addDays,
  DAYS,
  formatDuration,
  formatClock,
  MONTHS,
  toDateKey,
} from "@/lib/date";
import { qualityFor } from "@/lib/quality";
import { useEntriesStore } from "@/store/entriesStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useUIStore } from "@/store/uiStore";
import { colors, fonts, qualityColor, radii, spacing } from "@/theme";

export default function HistoryScreen() {
  const byDate = useEntriesStore((s) => s.byDate);
  const entriesSorted = useEntriesStore((s) => s.entriesSorted);
  const goalMinutes = useSettingsStore((s) => s.settings.sleep_goal_minutes);
  const openLogSheet = useUIStore((s) => s.openLogSheet);

  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [weekOffset, setWeekOffset] = useState(0);

  const entries = entriesSorted();

  const openDay = (dateKey: string) => {
    haptics.light();
    const e = byDate[dateKey];
    openLogSheet(e ? { entry: e } : { date: dateKey });
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>History</Text>

        {/* Month calendar */}
        <Card style={{ marginTop: spacing.lg }}>
          <View style={styles.monthNav}>
            <Pressable onPress={() => setMonthCursor(shiftMonth(monthCursor, -1))}>
              <Text style={styles.navArrow}>‹</Text>
            </Pressable>
            <Text style={styles.monthTitle}>
              {MONTHS[monthCursor.getMonth()]} {monthCursor.getFullYear()}
            </Text>
            <Pressable onPress={() => setMonthCursor(shiftMonth(monthCursor, 1))}>
              <Text style={styles.navArrow}>›</Text>
            </Pressable>
          </View>
          <MonthGrid
            month={monthCursor}
            byDate={byDate}
            goalMinutes={goalMinutes}
            onSelect={openDay}
          />
        </Card>

        {/* Weekly bar chart with goal line */}
        <Text style={styles.sectionTitle}>Hours per night</Text>
        <Card>
          <View style={styles.weekNav}>
            <Pressable onPress={() => setWeekOffset((w) => w - 1)}>
              <Text style={styles.navArrow}>‹</Text>
            </Pressable>
            <Text style={styles.weekLabel}>
              {weekOffset === 0 ? "This week" : `${-weekOffset} week(s) ago`}
            </Text>
            <Pressable
              onPress={() => setWeekOffset((w) => Math.min(0, w + 1))}
              disabled={weekOffset === 0}
            >
              <Text
                style={[styles.navArrow, weekOffset === 0 && styles.navDisabled]}
              >
                ›
              </Text>
            </Pressable>
          </View>
          <BarChart
            data={buildWeekBars(byDate, weekOffset)}
            goalHours={goalMinutes / 60}
          />
        </Card>

        {/* Recent entries list */}
        <Text style={styles.sectionTitle}>Recent entries</Text>
        {entries.length === 0 ? (
          <EmptyState
            title="No entries yet"
            message="Your logged nights will appear here."
          />
        ) : (
          entries.slice(0, 30).map((e, i) => (
            <Animated.View
              key={e.date}
              entering={FadeInDown.delay(i * 40).duration(400)}
            >
              <EntryRow entry={e} onPress={() => openDay(e.date)} />
            </Animated.View>
          ))
        )}

        <View style={{ height: 150 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function EntryRow({
  entry,
  onPress,
}: {
  entry: SleepEntry;
  onPress: () => void;
}) {
  const q = qualityFor(entry.quality_rating);
  const [y, m, d] = entry.date.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.dot, { backgroundColor: qualityColor[entry.quality_rating] }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowDate}>
          {DAYS[date.getDay()]} {date.getDate()} {MONTHS[date.getMonth()]}
        </Text>
        <Text style={styles.rowSub}>
          {formatClock(new Date(entry.bedtime))} →{" "}
          {formatClock(new Date(entry.wake_time))}
        </Text>
      </View>
      <Text style={styles.rowEmoji}>{q.emoji}</Text>
      <Text style={styles.rowDuration}>{formatDuration(entry.duration_minutes)}</Text>
    </Pressable>
  );
}

function MonthGrid({
  month,
  byDate,
  goalMinutes,
  onSelect,
}: {
  month: Date;
  byDate: Record<string, SleepEntry>;
  goalMinutes: number;
  onSelect: (key: string) => void;
}) {
  const year = month.getFullYear();
  const mo = month.getMonth();
  const firstDow = (new Date(year, mo, 1).getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, mo + 1, 0).getDate();
  const todayK = toDateKey(new Date());

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toDateKey(new Date(year, mo, d)));
  }

  return (
    <View>
      <View style={styles.dowRow}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <Text key={i} style={styles.dowLabel}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((key, i) => {
          if (!key) return <View key={`e${i}`} style={styles.cell} />;
          const entry = byDate[key];
          const day = Number(key.split("-")[2]);
          return (
            <Pressable key={key} style={styles.cell} onPress={() => onSelect(key)}>
              <View
                style={[
                  styles.cellInner,
                  key === todayK && styles.cellToday,
                  entry && {
                    backgroundColor: qualityColor[entry.quality_rating] + "33",
                  },
                ]}
              >
                <Text style={styles.cellText}>{day}</Text>
                {entry && (
                  <View
                    style={[
                      styles.cellDot,
                      { backgroundColor: qualityColor[entry.quality_rating] },
                    ]}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function shiftMonth(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function buildWeekBars(
  byDate: Record<string, SleepEntry>,
  weekOffset: number
): BarDatum[] {
  const today = new Date();
  const dowIndex = (today.getDay() + 6) % 7;
  const monday = addDays(today, -dowIndex + weekOffset * 7);
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  return Array.from({ length: 7 }, (_, i) => {
    const key = toDateKey(addDays(monday, i));
    const entry = byDate[key];
    return {
      label: labels[i],
      hours: entry ? entry.duration_minutes / 60 : null,
    };
  });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  header: { fontFamily: fonts.bold, fontSize: 28, color: colors.textPrimary },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  monthTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.textPrimary },
  navArrow: { fontSize: 24, color: colors.textSecondary, paddingHorizontal: spacing.md },
  navDisabled: { opacity: 0.3 },
  dowRow: { flexDirection: "row", marginBottom: spacing.sm },
  dowLabel: {
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3 },
  cellInner: {
    flex: 1,
    borderRadius: radii.button,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  cellToday: { borderWidth: 1, borderColor: colors.accentGlow },
  cellText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  cellDot: { width: 4, height: 4, borderRadius: 2 },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  weekLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.textPrimary },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowDate: { fontFamily: fonts.semibold, fontSize: 15, color: colors.textPrimary },
  rowSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  rowEmoji: { fontSize: 20 },
  rowDuration: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
});
