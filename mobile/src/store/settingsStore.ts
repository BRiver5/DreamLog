/** Settings store: sleep goal + reminder prefs, cached locally and synced. */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import {
  fetchSettings,
  updateSettings as apiUpdate,
} from "@/api/endpoints";
import type { Settings, SettingsInput } from "@/api/types";

const CACHE_KEY = "dreamlog_settings_cache";

const DEFAULTS: Settings = {
  sleep_goal_minutes: 480,
  reminders_enabled: false,
  wake_reminder_time: null,
  bed_reminder_time: null,
};

interface SettingsState {
  settings: Settings;
  loaded: boolean;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  update: (input: SettingsInput) => Promise<void>;
  reset: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULTS,
  loaded: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) set({ settings: JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    set({ loaded: true });
    get().refresh().catch(() => undefined);
  },

  refresh: async () => {
    try {
      const s = await fetchSettings();
      set({ settings: s });
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(s));
    } catch {
      /* offline — keep cached settings */
    }
  },

  update: async (input) => {
    // Optimistic local update.
    const next = { ...get().settings, ...cleanInput(input) };
    set({ settings: next });
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next));
    try {
      const saved = await apiUpdate(input);
      set({ settings: saved });
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(saved));
    } catch {
      /* stays applied locally; will re-sync on next refresh */
    }
  },

  reset: async () => {
    set({ settings: DEFAULTS });
    await AsyncStorage.removeItem(CACHE_KEY);
  },
}));

function cleanInput(input: SettingsInput): Partial<Settings> {
  const out: Partial<Settings> = {};
  if (input.sleep_goal_minutes !== undefined)
    out.sleep_goal_minutes = input.sleep_goal_minutes;
  if (input.reminders_enabled !== undefined)
    out.reminders_enabled = input.reminders_enabled;
  if (input.wake_reminder_time !== undefined)
    out.wake_reminder_time = input.wake_reminder_time;
  if (input.bed_reminder_time !== undefined)
    out.bed_reminder_time = input.bed_reminder_time;
  return out;
}
