/** Local-only display preferences (not synced to the backend). */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import { setClockFormat } from "@/lib/date";

const KEY = "dreamlog_prefs";

interface PrefsState {
  use24Hour: boolean;
  hydrate: () => Promise<void>;
  setUse24Hour: (v: boolean) => Promise<void>;
}

export const usePrefsStore = create<PrefsState>((set) => ({
  use24Hour: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const use24 = raw ? JSON.parse(raw).use24Hour === true : false;
      setClockFormat(use24);
      set({ use24Hour: use24 });
    } catch {
      /* keep default */
    }
  },

  setUse24Hour: async (v) => {
    setClockFormat(v);
    set({ use24Hour: v });
    await AsyncStorage.setItem(KEY, JSON.stringify({ use24Hour: v }));
  },
}));
