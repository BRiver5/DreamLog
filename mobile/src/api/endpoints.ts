/** Typed endpoint wrappers over the axios client. */
import { api, toApiError } from "./client";
import type {
  EntryInput,
  RangeKey,
  Settings,
  SettingsInput,
  SleepEntry,
  StatsSummary,
} from "./types";

export async function registerDevice(): Promise<Settings> {
  try {
    const { data } = await api.post("/devices/register");
    return {
      sleep_goal_minutes: data.sleep_goal_minutes,
      reminders_enabled: data.reminders_enabled,
      wake_reminder_time: data.wake_reminder_time,
      bed_reminder_time: data.bed_reminder_time,
    };
  } catch (e) {
    throw toApiError(e);
  }
}

export async function fetchEntries(range?: RangeKey): Promise<SleepEntry[]> {
  try {
    const { data } = await api.get<SleepEntry[]>("/entries", {
      params: range ? { range } : undefined,
    });
    return data;
  } catch (e) {
    throw toApiError(e);
  }
}

export async function fetchEntry(date: string): Promise<SleepEntry | null> {
  try {
    const { data } = await api.get<SleepEntry>(`/entries/${date}`);
    return data;
  } catch (e) {
    const err = toApiError(e);
    if (err.status === 404) return null;
    throw err;
  }
}

export async function upsertEntry(
  date: string,
  input: EntryInput
): Promise<SleepEntry> {
  try {
    const { data } = await api.put<SleepEntry>(`/entries/${date}`, input);
    return data;
  } catch (e) {
    throw toApiError(e);
  }
}

export async function deleteEntry(date: string): Promise<void> {
  try {
    await api.delete(`/entries/${date}`);
  } catch (e) {
    throw toApiError(e);
  }
}

export async function fetchStats(range: RangeKey): Promise<StatsSummary> {
  try {
    const { data } = await api.get<StatsSummary>("/stats/summary", {
      params: { range },
    });
    return data;
  } catch (e) {
    throw toApiError(e);
  }
}

export async function fetchSettings(): Promise<Settings> {
  try {
    const { data } = await api.get<Settings>("/settings");
    return data;
  } catch (e) {
    throw toApiError(e);
  }
}

export async function updateSettings(input: SettingsInput): Promise<Settings> {
  try {
    const { data } = await api.put<Settings>("/settings", input);
    return data;
  } catch (e) {
    throw toApiError(e);
  }
}

export async function exportData(): Promise<unknown> {
  try {
    const { data } = await api.get("/export");
    return data;
  } catch (e) {
    throw toApiError(e);
  }
}

export async function resetData(): Promise<void> {
  try {
    await api.delete("/data");
  } catch (e) {
    throw toApiError(e);
  }
}
