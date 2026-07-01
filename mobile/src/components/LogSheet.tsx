import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { EntryInput, SleepEntry } from "@/api/types";
import { computeDurationMinutes } from "@/lib/score";
import {
  addDays,
  formatClock,
  formatDuration,
  fromDateKey,
  roundToNearest5,
  toDateKey,
} from "@/lib/date";
import { haptics } from "@/hooks/useHaptics";
import { useEntriesStore } from "@/store/entriesStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useUIStore } from "@/store/uiStore";
import { colors, fonts, radii, spacing } from "@/theme";

import { BottomSheet } from "./BottomSheet";
import { EmojiRating } from "./EmojiRating";
import { GradientButton } from "./GradientButton";
import { SaveSuccess } from "./SaveSuccess";
import { TimeWheelPicker } from "./TimeWheelPicker";

/** Remember last-used times so defaults get smarter over sessions. */
let lastBedHour = 22;
let lastBedMin = 0;

/**
 * Core 2-tap logging sheet. Opens with smart-default times so a normal night
 * needs only: (1) tap a rating, (2) tap Save.
 */
export function LogSheet() {
  const { logSheetOpen, editingEntry, editingDate, closeLogSheet } = useUIStore();
  const saveEntry = useEntriesStore((s) => s.saveEntry);
  const goalMinutes = useSettingsStore((s) => s.settings.sleep_goal_minutes);

  const [bedtime, setBedtime] = useState(new Date());
  const [wakeTime, setWakeTime] = useState(new Date());
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [picker, setPicker] = useState<null | "bed" | "wake">(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Initialise defaults each time the sheet opens.
  useEffect(() => {
    if (!logSheetOpen) return;
    if (editingEntry) {
      setBedtime(new Date(editingEntry.bedtime));
      setWakeTime(new Date(editingEntry.wake_time));
      setRating(editingEntry.quality_rating);
      setNote(editingEntry.note ?? "");
      setNoteOpen(!!editingEntry.note);
    } else {
      const now = new Date();
      const wake = roundToNearest5(now);
      // Bedtime default: yesterday at last-used bed time.
      const bed = addDays(new Date(now), -1);
      bed.setHours(lastBedHour, lastBedMin, 0, 0);
      setBedtime(bed);
      setWakeTime(wake);
      setRating(null);
      setNote("");
      setNoteOpen(false);
    }
    setPicker(null);
    setSuccess(false);
  }, [logSheetOpen, editingEntry]);

  const duration = useMemo(
    () => computeDurationMinutes(bedtime, wakeTime),
    [bedtime, wakeTime]
  );

  const targetDate = editingDate ?? toDateKey(wakeTime);
  const valid = rating != null && wakeTime > bedtime;

  const onSave = async () => {
    if (!valid || rating == null) return;
    setSaving(true);
    lastBedHour = bedtime.getHours();
    lastBedMin = bedtime.getMinutes();

    const input: EntryInput = {
      bedtime: bedtime.toISOString(),
      wake_time: wakeTime.toISOString(),
      quality_rating: rating,
      note: note.trim() ? note.trim() : null,
    };
    const optimistic: SleepEntry = {
      id: editingEntry?.id ?? `local-${targetDate}`,
      date: targetDate,
      bedtime: input.bedtime,
      wake_time: input.wake_time,
      duration_minutes: duration,
      quality_rating: rating,
      note: input.note ?? null,
      created_at: editingEntry?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await saveEntry(targetDate, input, optimistic);
    haptics.success();
    setSaving(false);
    setSuccess(true);
  };

  return (
    <BottomSheet visible={logSheetOpen} onClose={closeLogSheet}>
      {success && <SaveSuccess onDone={closeLogSheet} />}

      <Text style={styles.title}>
        {editingEntry ? "Edit sleep" : "Log sleep"}
      </Text>
      <Text style={styles.subtitle}>
        {editingDate
          ? fromDateKey(targetDate).toDateString()
          : "How did you sleep last night?"}
      </Text>

      {/* Time pills */}
      <View style={styles.timeRow}>
        <TimePill
          icon="🌙"
          label="Bedtime"
          time={formatClock(bedtime)}
          active={picker === "bed"}
          onPress={() => setPicker(picker === "bed" ? null : "bed")}
        />
        <TimePill
          icon="☀️"
          label="Wake"
          time={formatClock(wakeTime)}
          active={picker === "wake"}
          onPress={() => setPicker(picker === "wake" ? null : "wake")}
        />
      </View>
      <Text style={styles.duration}>{formatDuration(duration)} asleep</Text>

      {picker === "bed" && (
        <TimeWheelPicker value={bedtime} onChange={setBedtime} />
      )}
      {picker === "wake" && (
        <TimeWheelPicker value={wakeTime} onChange={setWakeTime} />
      )}

      {/* Rating */}
      <Text style={styles.sectionLabel}>Quality</Text>
      <EmojiRating value={rating} onChange={setRating} />

      {/* Optional note */}
      {noteOpen ? (
        <TextInput
          style={styles.note}
          placeholder="Add a note (optional)"
          placeholderTextColor={colors.textMuted}
          value={note}
          onChangeText={(t) => t.length <= 280 && setNote(t)}
          multiline
        />
      ) : (
        <Pressable onPress={() => setNoteOpen(true)} style={styles.addNote}>
          <Text style={styles.addNoteText}>＋ Add a note</Text>
        </Pressable>
      )}

      {!valid && rating == null && (
        <Text style={styles.hint}>Tap a rating to save</Text>
      )}

      <GradientButton
        label={editingEntry ? "Update" : "Save"}
        onPress={onSave}
        disabled={!valid}
        loading={saving}
        style={{ marginTop: spacing.lg }}
      />
    </BottomSheet>
  );
}

function TimePill({
  icon,
  label,
  time,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  time: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.timePill, active && styles.timePillActive]}
      onPress={onPress}
    >
      <Text style={styles.timeIcon}>{icon}</Text>
      <View>
        <Text style={styles.timeLabel}>{label}</Text>
        <Text style={styles.timeValue}>{time}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: 22, color: colors.textPrimary },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  timeRow: { flexDirection: "row", gap: spacing.md },
  timePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
  },
  timePillActive: { borderColor: colors.accentPrimary },
  timeIcon: { fontSize: 20 },
  timeLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  timeValue: { fontFamily: fonts.semibold, fontSize: 16, color: colors.textPrimary },
  duration: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginVertical: spacing.md,
  },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  note: {
    marginTop: spacing.lg,
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    minHeight: 60,
    textAlignVertical: "top",
  },
  addNote: { marginTop: spacing.lg, alignSelf: "flex-start" },
  addNoteText: { fontFamily: fonts.medium, fontSize: 14, color: colors.accentPrimary },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
