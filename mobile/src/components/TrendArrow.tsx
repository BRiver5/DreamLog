import { StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/theme";

/** Small ↑/↓ trend indicator. `positiveIsGood` colors improvement green. */
export function TrendArrow({
  delta,
  suffix = "",
  positiveIsGood = true,
}: {
  delta: number;
  suffix?: string;
  positiveIsGood?: boolean;
}) {
  if (Math.abs(delta) < 0.01) {
    return (
      <View style={styles.row}>
        <Text style={[styles.text, { color: colors.textMuted }]}>— no change</Text>
      </View>
    );
  }
  const up = delta > 0;
  const good = up === positiveIsGood;
  const color = good ? colors.success : colors.danger;
  return (
    <View style={styles.row}>
      <Text style={[styles.text, { color }]}>
        {up ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}
        {suffix}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  text: { fontFamily: fonts.semibold, fontSize: 13 },
});
