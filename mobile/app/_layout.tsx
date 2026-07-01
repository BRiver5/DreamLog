import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { peekDeviceId } from "@/api/device";
import { LogSheet } from "@/components/LogSheet";
import { useEntriesStore } from "@/store/entriesStore";
import { usePrefsStore } from "@/store/prefsStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useUIStore } from "@/store/uiStore";
import { colors } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const onboarded = useUIStore((s) => s.onboarded);
  const hydrateOnboarding = useUIStore((s) => s.hydrateOnboarding);
  const hydrateEntries = useEntriesStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydratePrefs = usePrefsStore((s) => s.hydrate);

  const router = useRouter();
  const segments = useSegments();

  // Boot: load onboarding flag; if a device already exists, hydrate data.
  useEffect(() => {
    (async () => {
      await hydratePrefs();
      await hydrateOnboarding();
      const id = await peekDeviceId();
      if (id) {
        await hydrateEntries();
        await hydrateSettings();
      }
    })();
  }, []);

  useEffect(() => {
    if (fontsLoaded && onboarded !== null) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, onboarded]);

  // Route guard: send un-onboarded users to onboarding, and onboarded
  // users away from it.
  useEffect(() => {
    if (onboarded === null) return;
    const inOnboarding = segments[0] === "onboarding";
    if (!onboarded && !inOnboarding) {
      router.replace("/onboarding");
    } else if (onboarded && inOnboarding) {
      router.replace("/");
    }
  }, [onboarded, segments]);

  if (!fontsLoaded || onboarded === null) {
    return <View style={{ flex: 1, backgroundColor: colors.bgPrimary }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bgPrimary },
            animation: "fade",
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
        </Stack>
        <LogSheet />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
