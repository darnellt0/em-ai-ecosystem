// Analytics Screen - Charts and productivity metrics
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { AnalyticsChart } from '../components/AnalyticsChart';
import { useAnalytics } from '../hooks/useAnalytics';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';

type Period = 'day' | 'week' | 'month' | 'year';

export const AnalyticsScreen: React.FC = () => {
  const [period, setPeriod] = useState<Period>('week');
  const { data, insights, loading, refresh } = useAnalytics(period);

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  // Mock data for charts (replace with real data from API)
  const commandsChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [12, 19, 15, 25, 22, 18, 20],
      },
    ],
  };

  const agentDistributionData = [
    {
      name: 'Email',
      value: 35,
      color: colors.chart1,
      legendFontColor: colors.text,
    },
    {
      name: 'Calendar',
      value: 25,
      color: colors.chart2,
      legendFontColor: colors.text,
    },
    {
      name: 'Tasks',
      value: 20,
      color: colors.chart3,
      legendFontColor: colors.text,
    },
    {
      name: 'Notes',
      value: 15,
      color: colors.chart4,
      legendFontColor: colors.text,
    },
    {
      name: 'Other',
      value: 5,
      color: colors.chart5,
      legendFontColor: colors.text,
    },
  ];

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {(['day', 'week', 'month', 'year'] as Period[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodButton, period === p && styles.periodButtonActive]}
                onPress={() => setPeriod(p)}
              >
                <Text
                  style={[styles.periodButtonText, period === p && styles.periodButtonTextActive]}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{data?.metrics.totalCommands || 0}</Text>
            <Text style={styles.metricLabel}>Total Commands</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {data?.metrics.averageResponseTime || 0}s
            </Text>
            <Text style={styles.metricLabel}>Avg Response</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {Math.round(
                ((data?.metrics.successfulCommands || 0) /
                  (data?.metrics.totalCommands || 1)) *
                  100
              )}%
            </Text>
            <Text style={styles.metricLabel}>Success Rate</Text>
          </View>
        </View>

        {/* Charts */}
        <View style={styles.chartsContainer}>
          <AnalyticsChart
            title="Commands Over Time"
            type="line"
            data={commandsChartData}
          />

          <AnalyticsChart
            title="Agent Distribution"
            type="pie"
            data={agentDistributionData}
          />
        </View>

        {/* ML Insights */}
        {insights && (
          <View style={styles.insightsContainer}>
            <Text style={styles.sectionTitle}>Productivity Insights</Text>
            <View style={styles.insightCard}>
              <Text style={styles.insightLabel}>Peak Productivity Time</Text>
              <Text style={styles.insightValue}>
                {insights.peakProductivityTime.charAt(0).toUpperCase() +
                  insights.peakProductivityTime.slice(1)}
              </Text>
            </View>
            <View style={styles.insightCard}>
              <Text style={styles.insightLabel}>Most Common Task</Text>
              <Text style={styles.insightValue}>
                {insights.mostCommonTasks[0]?.taskType || 'None yet'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  metricCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  metricValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  metricLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  chartsContainer: {
    paddingHorizontal: spacing.md,
  },
  insightsContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  insightCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  insightLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  insightValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
