import { useMemo, useRef } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { haptics } from "@/hooks/useHaptics";
import { usePrefsStore } from "@/store/prefsStore";
import { colors, fonts, radii } from "@/theme";

const ITEM_H = 44;
const VISIBLE = 5;

/**
 * iOS-style scroll-wheel time picker with hour / minute / AM-PM columns,
 * matching the reference "Bedtime/Alarm" screens.
 */
export function TimeWheelPicker({
  value,
  onChange,
}: {
  value: Date;
  onChange: (d: Date) => void;
}) {
  const use24 = usePrefsStore((s) => s.use24Hour);
  const hour24 = value.getHours();
  const isPm = hour24 >= 12;
  const hour12 = ((hour24 + 11) % 12) + 1;

  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);
  const hours12 = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const hours24 = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const meridiem = ["AM", "PM"];

  const setHour24 = (h: number, m: number) => {
    const next = new Date(value);
    next.setHours(h, m, 0, 0);
    onChange(next);
  };
  const setTime12 = (h12: number, m: number, pm: boolean) => {
    let h = h12 % 12;
    if (pm) h += 12;
    setHour24(h, m);
  };

  return (
    <View style={styles.container}>
      <View style={styles.selectionBand} pointerEvents="none" />
      {use24 ? (
        <>
          <WheelColumn
            data={hours24.map((h) => String(h).padStart(2, "0"))}
            selectedIndex={hour24}
            onSelect={(i) => setHour24(hours24[i], value.getMinutes())}
          />
          <Text style={styles.colon}>:</Text>
          <WheelColumn
            data={minutes.map((m) => String(m).padStart(2, "0"))}
            selectedIndex={value.getMinutes()}
            onSelect={(i) => setHour24(hour24, minutes[i])}
          />
        </>
      ) : (
        <>
          <WheelColumn
            data={hours12.map((h) => String(h))}
            selectedIndex={hour12 - 1}
            onSelect={(i) => setTime12(hours12[i], value.getMinutes(), isPm)}
          />
          <Text style={styles.colon}>:</Text>
          <WheelColumn
            data={minutes.map((m) => String(m).padStart(2, "0"))}
            selectedIndex={value.getMinutes()}
            onSelect={(i) => setTime12(hour12, minutes[i], isPm)}
          />
          <WheelColumn
            data={meridiem}
            selectedIndex={isPm ? 1 : 0}
            onSelect={(i) => setTime12(hour12, value.getMinutes(), i === 1)}
            width={64}
          />
        </>
      )}
    </View>
  );
}

function WheelColumn({
  data,
  selectedIndex,
  onSelect,
  width = 56,
}: {
  data: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  width?: number;
}) {
  const ref = useRef<ScrollView>(null);
  const lastIndex = useRef(selectedIndex);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    if (clamped !== lastIndex.current) {
      lastIndex.current = clamped;
      haptics.light();
      onSelect(clamped);
    }
  };

  return (
    <ScrollView
      ref={ref}
      style={{ width, height: ITEM_H * VISIBLE }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      contentOffset={{ x: 0, y: selectedIndex * ITEM_H }}
      contentContainerStyle={{ paddingVertical: ITEM_H * ((VISIBLE - 1) / 2) }}
      onMomentumScrollEnd={onMomentumEnd}
    >
      {data.map((d, i) => (
        <View key={d} style={styles.item}>
          <Text
            style={[
              styles.itemText,
              i === selectedIndex && styles.itemTextActive,
            ]}
          >
            {d}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  selectionBand: {
    position: "absolute",
    left: 12,
    right: 12,
    height: ITEM_H,
    top: ITEM_H * 2,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.button,
  },
  colon: { fontFamily: fonts.bold, fontSize: 22, color: colors.textPrimary },
  item: { height: ITEM_H, alignItems: "center", justifyContent: "center" },
  itemText: { fontFamily: fonts.regular, fontSize: 20, color: colors.textMuted },
  itemTextActive: { fontFamily: fonts.bold, color: colors.textPrimary },
});
