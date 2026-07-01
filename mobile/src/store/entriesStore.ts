/**
 * Entries store: local map keyed by date, optimistic upserts, offline cache
 * (persisted to AsyncStorage), and a write-queue that retries failed saves.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import {
  deleteEntry as apiDelete,
  fetchEntries,
  upsertEntry,
} from "@/api/endpoints";
import type { EntryInput, SleepEntry } from "@/api/types";

const CACHE_KEY = "dreamlog_entries_cache";
const QUEUE_KEY = "dreamlog_write_queue";

interface QueuedWrite {
  kind: "upsert" | "delete";
  date: string;
  input?: EntryInput;
}

interface EntriesState {
  byDate: Record<string, SleepEntry>;
  loading: boolean;
  saving: boolean;
  error: string | null;
  queue: QueuedWrite[];

  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  saveEntry: (date: string, input: EntryInput, optimistic: SleepEntry) => Promise<boolean>;
  removeEntry: (date: string) => Promise<boolean>;
  flushQueue: () => Promise<void>;
  clearAll: () => Promise<void>;
  entriesSorted: () => SleepEntry[];
}

async function persistCache(byDate: Record<string, SleepEntry>) {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(byDate));
}
async function persistQueue(queue: QueuedWrite[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export const useEntriesStore = create<EntriesState>((set, get) => ({
  byDate: {},
  loading: false,
  saving: false,
  error: null,
  queue: [],

  hydrate: async () => {
    try {
      const [cacheRaw, queueRaw] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEY),
        AsyncStorage.getItem(QUEUE_KEY),
      ]);
      set({
        byDate: cacheRaw ? JSON.parse(cacheRaw) : {},
        queue: queueRaw ? JSON.parse(queueRaw) : [],
      });
    } catch {
      /* corrupt cache — start clean */
    }
    // Attempt to flush any queued writes, then refresh from server.
    await get().flushQueue();
    get().refresh().catch(() => undefined);
  },

  refresh: async () => {
    set({ loading: true });
    try {
      const list = await fetchEntries("all");
      // Merge server data over the local cache so entries that are still queued
      // (not yet synced) are never wiped by a refresh.
      const byDate: Record<string, SleepEntry> = { ...get().byDate };
      for (const e of list) byDate[e.date] = e;
      set({ byDate, loading: false });
      await persistCache(byDate);
    } catch {
      // Offline / backend unreachable: silently keep showing cached data.
      // Reads never surface a scary error because everything works locally.
      set({ loading: false });
    }
  },

  saveEntry: async (date, input, optimistic) => {
    // Optimistic update immediately.
    set((s) => ({
      byDate: { ...s.byDate, [date]: optimistic },
      saving: true,
      error: null,
    }));
    // Cache writes are fire-and-forget so a storage hiccup never gets
    // misreported as a failed save.
    persistCache(get().byDate).catch(() => undefined);
    try {
      const saved = await upsertEntry(date, input);
      // Server accepted it — reconcile and clear any stale error/queue entry
      // for this date.
      const queue = get().queue.filter(
        (q) => !(q.kind === "upsert" && q.date === date)
      );
      set((s) => ({
        byDate: { ...s.byDate, [date]: saved },
        saving: false,
        error: null,
        queue,
      }));
      persistCache(get().byDate).catch(() => undefined);
      persistQueue(queue).catch(() => undefined);
      return true;
    } catch (e) {
      // Genuine network failure: keep the optimistic value visible and queue a
      // retry (deduped per date).
      const queue = [
        ...get().queue.filter(
          (q) => !(q.kind === "upsert" && q.date === date)
        ),
        { kind: "upsert" as const, date, input },
      ];
      // The entry is already saved locally and will sync when the backend is
      // reachable — keep the message calm and honest, not alarming.
      set({ saving: false, error: "Saved on device — will sync when online", queue });
      await persistQueue(queue);
      return false;
    }
  },

  removeEntry: async (date) => {
    const prev = get().byDate[date];
    set((s) => {
      const byDate = { ...s.byDate };
      delete byDate[date];
      return { byDate };
    });
    await persistCache(get().byDate);
    try {
      await apiDelete(date);
      return true;
    } catch {
      const queue = [...get().queue, { kind: "delete" as const, date }];
      set({ queue, error: "Removed on device — will sync when online" });
      // Restore optimistic value so the UI reflects unsynced state honestly.
      if (prev) set((s) => ({ byDate: { ...s.byDate, [date]: prev } }));
      await persistQueue(queue);
      return false;
    }
  },

  flushQueue: async () => {
    const queue = get().queue;
    if (queue.length === 0) return;
    const remaining: QueuedWrite[] = [];
    for (const item of queue) {
      try {
        if (item.kind === "upsert" && item.input) {
          const saved = await upsertEntry(item.date, item.input);
          set((s) => ({ byDate: { ...s.byDate, [item.date]: saved } }));
        } else if (item.kind === "delete") {
          await apiDelete(item.date);
        }
      } catch {
        remaining.push(item);
      }
    }
    set({ queue: remaining, error: remaining.length ? get().error : null });
    await persistQueue(remaining);
    await persistCache(get().byDate);
  },

  clearAll: async () => {
    set({ byDate: {}, queue: [], error: null });
    await AsyncStorage.multiRemove([CACHE_KEY, QUEUE_KEY]);
  },

  entriesSorted: () => {
    return Object.values(get().byDate).sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : 0
    );
  },
}));
