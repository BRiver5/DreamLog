import { useMemo } from "react";

import type { RangeKey, StatsSummary } from "@/api/types";
import { computeSummary } from "@/lib/insights";
import { useEntriesStore } from "@/store/entriesStore";
import { useSettingsStore } from "@/store/settingsStore";

/**
 * Insights stats computed locally from the cached entries so the screen works
 * offline and updates instantly after a save. The identical aggregation runs
 * server-side (backend/app/services/stats.py) for future server-first use.
 */
export function useStats(range: RangeKey): {
  data: StatsSummary;
  loading: boolean;
  error: null;
  reload: () => void;
} {
  const byDate = useEntriesStore((s) => s.byDate);
  const goalMinutes = useSettingsStore((s) => s.settings.sleep_goal_minutes);

  const data = useMemo(
    () => computeSummary(Object.values(byDate), range, goalMinutes, new Date()),
    [byDate, range, goalMinutes]
  );

  return { data, loading: false, error: null, reload: () => undefined };
}
