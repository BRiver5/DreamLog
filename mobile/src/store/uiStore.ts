/** UI/session store: onboarding completion + Log sheet state. */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import type { SleepEntry } from "@/api/types";

const ONBOARD_KEY = "dreamlog_onboarded";

interface UIState {
  onboarded: boolean | null; // null = still loading
  logSheetOpen: boolean;
  editingEntry: SleepEntry | null;
  editingDate: string | null;

  hydrateOnboarding: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  openLogSheet: (opts?: { entry?: SleepEntry; date?: string }) => void;
  closeLogSheet: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  onboarded: null,
  logSheetOpen: false,
  editingEntry: null,
  editingDate: null,

  hydrateOnboarding: async () => {
    const raw = await AsyncStorage.getItem(ONBOARD_KEY);
    set({ onboarded: raw === "true" });
  },

  completeOnboarding: async () => {
    await AsyncStorage.setItem(ONBOARD_KEY, "true");
    set({ onboarded: true });
  },

  openLogSheet: (opts) =>
    set({
      logSheetOpen: true,
      editingEntry: opts?.entry ?? null,
      editingDate: opts?.date ?? opts?.entry?.date ?? null,
    }),

  closeLogSheet: () =>
    set({ logSheetOpen: false, editingEntry: null, editingDate: null }),
}));
