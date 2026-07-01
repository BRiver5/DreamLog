// SDK 54 introduced a new expo-file-system API; the classic file helpers used
// here (cacheDirectory, writeAsStringAsync) live under the /legacy entrypoint.
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { exportData } from "@/api/endpoints";
import type { SleepEntry } from "@/api/types";
import { entriesToCsv } from "./csv";

/** Fetch all data and share it as a JSON or CSV file (spec §7.4 / §9). */
export async function shareExport(format: "json" | "csv"): Promise<void> {
  const data = (await exportData()) as {
    entries: SleepEntry[];
    [k: string]: unknown;
  };

  const isCsv = format === "csv";
  const contents = isCsv
    ? entriesToCsv(data.entries ?? [])
    : JSON.stringify(data, null, 2);

  const filename = `dreamlog-export.${isCsv ? "csv" : "json"}`;
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, contents);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: isCsv ? "text/csv" : "application/json",
      dialogTitle: "Export DreamLog data",
    });
  }
}
