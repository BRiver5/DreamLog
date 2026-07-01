import { useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RangeKey } from "@/api/types";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { RangeSelector } from "@/components/RangeSelector";
import { TrendArrow } from "@/components/TrendArrow";
import { DonutChart } from "@/components/charts/DonutChart";
import { LineChart } from "@/components/charts/LineChart";
import { ScatterChart } from "@/components/charts/ScatterChart";
import { useStats } from "@/hooks/useStats";
import { formatDuration } from "@/lib/date";
import { colors, fonts, spacing } from "@/theme";

const CHART_W = Dimensions.get("window").width - spacing.xl * 2 - spacing.lg * 2;

export default function InsightsScreen() {
  const [range, setRange] = useState<RangeKey>("30d");
  const { data, loading } = useStats(range);

  const hasData = (data?.entry_count ?? 0) > 0;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Insights</Text>

        <View style={{ marginTop: spacing.lg }}>
          <RangeSelector value={range} onChange={setRange} />
        </View>

        {!hasData ? (
          <View style={{ marginTop: spacing.xxl }}>
            <EmptyState
              title={loading ? "Loading…" : "Not enough data yet"}
              message="Log a few nights to unlock your averages, trends, streaks and charts."
            />
          </View>
        ) : (
          <>
            {/* Average cards */}
            <View style={styles.cardRow}>
              <Card style={styles.halfCard}>
                <Text style={styles.cardLabel}>Avg duration</Text>
                <Text style={styles.cardBig}>
                  {formatDuration(Math.round(data!.avg_duration_minutes))}
                </Text>
                <TrendArrow
                  delta={data!.duration_trend.delta / 60}
                  suffix="h"
                  positiveIsGood
                />
              </Card>
              <Card style={styles.halfCard}>
                <Text style={styles.cardLabel}>Avg quality</Text>
                <Text style={styles.cardBig}>
                  {data!.avg_quality.toFixed(1)}
                  <Text style={styles.cardBigSuffix}> / 5</Text>
                </Text>
                <TrendArrow delta={data!.quality_trend.delta} positiveIsGood />
              </Card>
            </View>

            {/* Streak card */}
            <Card style={{ marginTop: spacing.md }}>
              <View style={styles.streakRow}>
                <Text style={styles.flame}>🔥</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardLabel}>Current streak</Text>
                  <Text style={styles.cardBig}>
                    {data!.current_streak}{" "}
                    <Text style={styles.cardBigSuffix}>
                      day{data!.current_streak === 1 ? "" : "s"}
                    </Text>
                  </Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>Longest</Text>
                  <Text style={styles.streakLongest}>{data!.longest_streak}d</Text>
                </View>
              </View>
            </Card>

            {/* Duration trend line */}
            <Text style={styles.sectionTitle}>Duration trend</Text>
            <Card>
              {data!.duration_series.length >= 2 ? (
                <LineChart
                  values={data!.duration_series.map((p) => p.minutes ?? 0)}
                  width={CHART_W}
                />
              ) : (
                <MiniPlaceholder text="Log a few more nights to see this chart" />
              )}
            </Card>

            {/* Quality distribution donut */}
            <Text style={styles.sectionTitle}>Quality distribution</Text>
            <Card>
              <DonutChart distribution={data!.quality_distribution} />
            </Card>

            {/* Bedtime consistency scatter */}
            <Text style={styles.sectionTitle}>Bedtime consistency</Text>
            <Card>
              {data!.bedtime_series.length >= 2 ? (
                <ScatterChart points={data!.bedtime_series} width={CHART_W} />
              ) : (
                <MiniPlaceholder text="Log a few more nights to see this chart" />
              )}
            </Card>
          </>
        )}

        <View style={{ height: 150 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniPlaceholder({ text }: { text: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  header: { fontFamily: fonts.bold, fontSize: 28, color: colors.textPrimary },
  cardRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  halfCard: { flex: 1 },
  cardLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  cardBig: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.textPrimary,
    marginVertical: 4,
  },
  cardBigSuffix: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary },
  streakRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  flame: { fontSize: 34 },
  streakLongest: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.accentGlow,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  placeholder: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
});
