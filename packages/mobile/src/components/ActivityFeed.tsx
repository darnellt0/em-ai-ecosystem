// Activity Feed Component
import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { format } from 'date-fns';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../styles/theme';
import { Activity } from '../types';

interface ActivityFeedProps {
  activities: Activity[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  onRefresh,
  refreshing = false,
}) => {
  const renderActivity = ({ item }: { item: Activity }) => (
    <View style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <View style={[styles.activityIcon, getActivityIconStyle(item.type)]}>
          <Text style={styles.activityIconText}>{getActivityIcon(item.type)}</Text>
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{item.title}</Text>
          <Text style={styles.activityDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={styles.activityTime}>
            {format(new Date(item.timestamp), 'MMM d, h:mm a')}
          </Text>
        </View>
      </View>
    </View>
  );

  if (activities.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No activities yet</Text>
        <Text style={styles.emptyStateSubtext}>
          Start by recording a voice command
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={activities}
      renderItem={renderActivity}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    />
  );
};

function getActivityIcon(type: string): string {
  switch (type) {
    case 'voice_command':
      return '🎙️';
    case 'action':
      return '✓';
    case 'sync':
      return '🔄';
    case 'error':
      return '⚠️';
    default:
      return '📋';
  }
}

function getActivityIconStyle(type: string) {
  switch (type) {
    case 'voice_command':
      return { backgroundColor: colors.primary + '20' };
    case 'action':
      return { backgroundColor: colors.success + '20' };
    case 'sync':
      return { backgroundColor: colors.info + '20' };
    case 'error':
      return { backgroundColor: colors.error + '20' };
    default:
      return { backgroundColor: colors.textLight + '20' };
  }
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
  },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  activityHeader: {
    flexDirection: 'row',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  activityIconText: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  activityDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  activityTime: {
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: fontSize.md,
    color: colors.textLight,
    textAlign: 'center',
  },
});
