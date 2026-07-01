/**
 * Anonymous device identity. Generated once on first launch, stored in
 * expo-secure-store (falls back to AsyncStorage if secure store is
 * unavailable, per spec §2).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const KEY = "dreamlog_device_id";

let cachedId: string | null = null;

async function secureAvailable(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function readStored(): Promise<string | null> {
  if (await secureAvailable()) {
    try {
      return await SecureStore.getItemAsync(KEY);
    } catch {
      /* fall through to AsyncStorage */
    }
  }
  return AsyncStorage.getItem(KEY);
}

async function writeStored(value: string): Promise<void> {
  if (await secureAvailable()) {
    try {
      await SecureStore.setItemAsync(KEY, value);
      return;
    } catch {
      /* fall through to AsyncStorage */
    }
  }
  await AsyncStorage.setItem(KEY, value);
}

/** Return the persisted device id, or null if none has been created yet. */
export async function peekDeviceId(): Promise<string | null> {
  if (cachedId) return cachedId;
  cachedId = await readStored();
  return cachedId;
}

/** Return the existing device id, creating + persisting one if absent. */
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await peekDeviceId();
  if (existing) return existing;
  const id = Crypto.randomUUID();
  await writeStored(id);
  cachedId = id;
  return id;
}
