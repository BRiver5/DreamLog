import { getOrCreateDeviceId } from "@/api/device";
import { registerDevice } from "@/api/endpoints";
import { useEntriesStore } from "@/store/entriesStore";
import { useSettingsStore } from "@/store/settingsStore";

/**
 * Called by onboarding's "Get Started": create the anonymous device identity,
 * register it with the backend, then hydrate local stores.
 */
export async function completeDeviceSetup(): Promise<void> {
  await getOrCreateDeviceId();
  await registerDevice().catch(() => undefined);
  await useSettingsStore.getState().hydrate();
  await useEntriesStore.getState().hydrate();
}
