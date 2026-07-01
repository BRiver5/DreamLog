import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, spacing } from "@/theme";

export function EmptyState({
  emoji = "🌙",
  title,
  message,
}: {
  emoji?: string;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emoji: { fontSize: 44, marginBottom: spacing.md },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
