/**
 * Local scheduled reminders via expo-notifications (no server push).
 * Permission is requested contextually — only when the user enables a
 * reminder, per spec §11.
 */
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const BED_ID = "bedtime-reminder";
const LOG_ID = "log-reminder";

export async function ensurePermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function ensureAndroidChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/** Parse "HH:MM" or "HH:MM:SS" into {hour, minute}. */
function parseTime(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(":").map(Number);
  return { hour: h, minute: m };
}

export async function scheduleBedtimeReminder(time: string): Promise<void> {
  await ensureAndroidChannel();
  await Notifications.cancelScheduledNotificationAsync(BED_ID).catch(() => undefined);
  const { hour, minute } = parseTime(time);
  await Notifications.scheduleNotificationAsync({
    identifier: BED_ID,
    content: {
      title: "Time to wind down 🌙",
      body: "Bedtime is coming up — start getting ready for a good night.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: "reminders",
    },
  });
}

export async function scheduleLogReminder(time: string): Promise<void> {
  await ensureAndroidChannel();
  await Notifications.cancelScheduledNotificationAsync(LOG_ID).catch(() => undefined);
  const { hour, minute } = parseTime(time);
  await Notifications.scheduleNotificationAsync({
    identifier: LOG_ID,
    content: {
      title: "How did you sleep? ⭐",
      body: "Tap to log last night in two taps.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: "reminders",
    },
  });
}

export async function cancelBedtimeReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(BED_ID).catch(() => undefined);
}
export async function cancelLogReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(LOG_ID).catch(() => undefined);
}

export async function cancelAllReminders(): Promise<void> {
  await Promise.all([cancelBedtimeReminder(), cancelLogReminder()]);
}
