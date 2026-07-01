import Constants from "expo-constants";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { resetData } from "@/api/endpoints";
import { Card } from "@/components/Card";
import { TimeWheelPicker } from "@/components/TimeWheelPicker";
import { haptics } from "@/hooks/useHaptics";
import { formatDuration } from "@/lib/date";
import { shareExport } from "@/lib/exporter";
import {
  cancelBedtimeReminder,
  cancelLogReminder,
  ensurePermission,
  scheduleBedtimeReminder,
  scheduleLogReminder,
} from "@/notifications/reminders";
import { useEntriesStore } from "@/store/entriesStore";
import { usePrefsStore } from "@/store/prefsStore";
import { useSettingsStore } from "@/store/settingsStore";
import { colors, fonts, radii, spacing } from "@/theme";

const GOAL_MIN = 360; // 6h
const GOAL_MAX = 600; // 10h
const GOAL_STEP = 15;

export default function SettingsScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const resetSettings = useSettingsStore((s) => s.reset);
  const clearEntries = useEntriesStore((s) => s.clearAll);
  const use24Hour = usePrefsStore((s) => s.use24Hour);
  const setUse24Hour = usePrefsStore((s) => s.setUse24Hour);

  const [bedPickerOpen, setBedPickerOpen] = useState(false);
  const [logPickerOpen, setLogPickerOpen] = useState(false);

  const goal = settings.sleep_goal_minutes;

  const setGoal = (mins: number) => {
    const clamped = Math.max(GOAL_MIN, Math.min(GOAL_MAX, mins));
    haptics.light();
    update({ sleep_goal_minutes: clamped });
  };

  const toggleBedReminder = async (enabled: boolean) => {
    if (enabled) {
      const ok = await ensurePermission();
      if (!ok) {
        Alert.alert(
          "Notifications disabled",
          "Enable notifications in system settings to receive reminders."
        );
        return;
      }
      const time = settings.bed_reminder_time ?? "22:00:00";
      await scheduleBedtimeReminder(time);
      update({ reminders_enabled: true, bed_reminder_time: time });
    } else {
      await cancelBedtimeReminder();
      update({ bed_reminder_time: null });
    }
  };

  const toggleLogReminder = async (enabled: boolean) => {
    if (enabled) {
      const ok = await ensurePermission();
      if (!ok) {
        Alert.alert(
          "Notifications disabled",
          "Enable notifications in system settings to receive reminders."
        );
        return;
      }
      const time = settings.wake_reminder_time ?? "09:00:00";
      await scheduleLogReminder(time);
      update({ reminders_enabled: true, wake_reminder_time: time });
    } else {
      await cancelLogReminder();
      update({ wake_reminder_time: null });
    }
  };

  const onExport = () => {
    Alert.alert("Export data", "Choose a format", [
      { text: "JSON", onPress: () => runExport("json") },
      { text: "CSV", onPress: () => runExport("csv") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const runExport = async (format: "json" | "csv") => {
    try {
      await shareExport(format);
    } catch {
      Alert.alert("Export failed", "Couldn't export right now. Try again.");
    }
  };

  const onReset = () => {
    Alert.alert(
      "Reset all data?",
      "This permanently deletes every logged night on this device. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: async () => {
            try {
              await resetData();
            } catch {
              /* still clear locally */
            }
            await clearEntries();
            await resetSettings();
            haptics.warning();
          },
        },
      ]
    );
  };

  const timeFromString = (v: string | null, fallbackH: number): Date => {
    const d = new Date();
    if (v) {
      const [h, m] = v.split(":").map(Number);
      d.setHours(h, m, 0, 0);
    } else {
      d.setHours(fallbackH, 0, 0, 0);
    }
    return d;
  };

  const toTimeString = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}:00`;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Settings</Text>

        {/* Sleep goal */}
        <Text style={styles.sectionTitle}>Sleep goal</Text>
        <Card>
          <View style={styles.goalRow}>
            <Pressable
              style={styles.stepper}
              onPress={() => setGoal(goal - GOAL_STEP)}
            >
              <Text style={styles.stepperText}>−</Text>
            </Pressable>
            <View style={styles.goalValueWrap}>
              <Text style={styles.goalValue}>{formatDuration(goal)}</Text>
              <Text style={styles.goalHint}>target per night</Text>
            </View>
            <Pressable
              style={styles.stepper}
              onPress={() => setGoal(goal + GOAL_STEP)}
            >
              <Text style={styles.stepperText}>＋</Text>
            </Pressable>
          </View>
        </Card>

        {/* Reminders */}
        <Text style={styles.sectionTitle}>Reminders</Text>
        <Card>
          <ToggleRow
            label="Bedtime reminder"
            value={!!settings.bed_reminder_time}
            onValueChange={toggleBedReminder}
          />
          {!!settings.bed_reminder_time && (
            <Pressable
              style={styles.timeRow}
              onPress={() => setBedPickerOpen((v) => !v)}
            >
              <Text style={styles.timeRowLabel}>Time</Text>
              <Text style={styles.timeRowValue}>
                {settings.bed_reminder_time.slice(0, 5)}
              </Text>
            </Pressable>
          )}
          {bedPickerOpen && !!settings.bed_reminder_time && (
            <TimeWheelPicker
              value={timeFromString(settings.bed_reminder_time, 22)}
              onChange={(d) => {
                const ts = toTimeString(d);
                update({ bed_reminder_time: ts });
                scheduleBedtimeReminder(ts);
              }}
            />
          )}

          <View style={styles.divider} />

          <ToggleRow
            label="Log reminder"
            value={!!settings.wake_reminder_time}
            onValueChange={toggleLogReminder}
          />
          {!!settings.wake_reminder_time && (
            <Pressable
              style={styles.timeRow}
              onPress={() => setLogPickerOpen((v) => !v)}
            >
              <Text style={styles.timeRowLabel}>Time</Text>
              <Text style={styles.timeRowValue}>
                {settings.wake_reminder_time.slice(0, 5)}
              </Text>
            </Pressable>
          )}
          {logPickerOpen && !!settings.wake_reminder_time && (
            <TimeWheelPicker
              value={timeFromString(settings.wake_reminder_time, 9)}
              onChange={(d) => {
                const ts = toTimeString(d);
                update({ wake_reminder_time: ts });
                scheduleLogReminder(ts);
              }}
            />
          )}
        </Card>

        {/* Appearance */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <Card>
          <View style={styles.infoRow}>
            <Text style={styles.rowLabel}>Theme</Text>
            <Text style={styles.rowValueMuted}>Dark</Text>
          </View>
          <Text style={styles.rowNote}>
            DreamLog is dark-only for now. A light theme is planned for a future
            update.
          </Text>
          <View style={styles.divider} />
          <ToggleRow
            label="24-hour time"
            value={use24Hour}
            onValueChange={(v) => {
              haptics.light();
              setUse24Hour(v);
            }}
          />
          <Text style={styles.rowNote}>
            {use24Hour
              ? "Times are shown as 22:30."
              : "Times are shown as 10:30 pm."}
          </Text>
        </Card>

        {/* Data */}
        <Text style={styles.sectionTitle}>Data</Text>
        <Card>
          <Pressable style={styles.actionRow} onPress={onExport}>
            <Text style={styles.rowLabel}>Export my data</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.actionRow} onPress={onReset}>
            <Text style={[styles.rowLabel, { color: colors.danger }]}>
              Reset all data
            </Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </Card>

        {/* About */}
        <Text style={styles.sectionTitle}>About</Text>
        <Card>
          <View style={styles.infoRow}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValueMuted}>
              {Constants.expoConfig?.version ?? "1.0.0"}
            </Text>
          </View>
          <Text style={styles.tagline}>"Five stars for your dreams."</Text>
        </Card>

        <View style={{ height: 150 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.bgElevated, true: colors.accentPrimary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  header: { fontFamily: fonts.bold, fontSize: 28, color: colors.textPrimary },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  goalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepper: {
    width: 48,
    height: 48,
    borderRadius: radii.button,
    backgroundColor: colors.bgElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperText: { fontFamily: fonts.bold, fontSize: 24, color: colors.textPrimary },
  goalValueWrap: { alignItems: "center" },
  goalValue: { fontFamily: fonts.bold, fontSize: 26, color: colors.textPrimary },
  goalHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  timeRowLabel: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  timeRowValue: { fontFamily: fonts.semibold, fontSize: 16, color: colors.accentPrimary },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  rowLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.textPrimary },
  rowValueMuted: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary },
  rowNote: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  chevron: { fontSize: 20, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.sm },
  tagline: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.accentGlow,
    marginTop: spacing.sm,
    fontStyle: "italic",
  },
});
