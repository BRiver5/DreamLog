import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radii, spacing } from "@/theme";

export function StatPill({
  icon,
  label,
  value,
  onPress,
  chevron,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
  chevron?: boolean;
}) {
  const Wrapper: any = onPress ? Pressable : View;
  return (
    <Wrapper style={styles.pill} onPress={onPress}>
      <View style={styles.header}>
        {icon}
        <Text style={styles.label}>{label}</Text>
        {chevron && <Text style={styles.chevron}>›</Text>}
      </View>
      <Text style={styles.value}>{value}</Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  pill: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  chevron: { color: colors.textSecondary, fontSize: 16, marginLeft: "auto" },
  value: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.textPrimary,
    marginTop: 6,
    fontVariant: ["tabular-nums"],
  },
});
