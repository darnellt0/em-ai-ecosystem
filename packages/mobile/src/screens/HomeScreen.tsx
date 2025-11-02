// Home Screen - Main voice command interface
import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { VoiceButton } from '../components/VoiceButton';
import { ActivityFeed } from '../components/ActivityFeed';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { colors, spacing, fontSize, fontWeight } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const { activities } = useApp();

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.name || 'User'}!</Text>
          <Text style={styles.subtitle}>What can I help you with today?</Text>
        </View>

        {/* Voice Button */}
        <View style={styles.voiceButtonContainer}>
          <VoiceButton />
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activities.length}</Text>
            <Text style={styles.statLabel}>Commands</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {activities.filter((a) => a.type === 'action').length}
            </Text>
            <Text style={styles.statLabel}>Actions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>95%</Text>
            <Text style={styles.statLabel}>Success</Text>
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.activitiesSection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <ActivityFeed activities={activities.slice(0, 10)} />
        </View>
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
    alignItems: 'center',
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  voiceButtonContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    minWidth: 100,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  activitiesSection: {
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
});
