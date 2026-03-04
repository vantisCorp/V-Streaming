import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StreamStatus } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

interface Props {
  streamStatus: StreamStatus | null;
  onStartStream: () => void;
  onStopStream: () => void;
}

export const DashboardScreen: React.FC<Props> = ({
  streamStatus,
  onStartStream,
  onStopStream,
}) => {
  const isStreaming = streamStatus?.is_streaming ?? false;

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViewerCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getPlatformColor = (platform: string): string => {
    return colors.platform[platform as keyof typeof colors.platform] || colors.primary;
  };

  return (
    <View style={styles.container}>
      {/* Stream Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={styles.statusIndicator}>
            <View style={[styles.liveDot, isStreaming ? styles.live : styles.offline]} />
            <Text style={styles.statusText}>
              {isStreaming ? 'LIVE' : 'OFFLINE'}
            </Text>
          </View>
          {streamStatus?.platform && (
            <View style={[styles.platformBadge, { backgroundColor: getPlatformColor(streamStatus.platform) }]}>
              <Text style={styles.platformText}>{streamStatus.platform.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {isStreaming && streamStatus && (
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatDuration(streamStatus.duration)}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatViewerCount(streamStatus.viewer_count)}</Text>
              <Text style={styles.statLabel}>Viewers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{streamStatus.fps}</Text>
              <Text style={styles.statLabel}>FPS</Text>
            </View>
          </View>
        )}
      </View>

      {/* Stream Controls */}
      <View style={styles.controlsCard}>
        <Text style={styles.sectionTitle}>Stream Controls</Text>
        
        {isStreaming ? (
          <TouchableOpacity
            style={[styles.streamButton, styles.stopButton]}
            onPress={onStopStream}
          >
            <View style={styles.stopIcon} />
            <Text style={styles.streamButtonText}>Stop Stream</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.streamButton, styles.startButton]}
            onPress={onStartStream}
          >
            <View style={styles.playIcon} />
            <Text style={styles.streamButtonText}>Start Stream</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStatsCard}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>
              {streamStatus?.bitrate ? `${streamStatus.bitrate} kbps` : '--'}
            </Text>
            <Text style={styles.quickStatLabel}>Bitrate</Text>
          </View>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>
              {streamStatus?.fps ? `${streamStatus.fps} fps` : '--'}
            </Text>
            <Text style={styles.quickStatLabel}>Frame Rate</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  live: {
    backgroundColor: colors.live,
  },
  offline: {
    backgroundColor: colors.offline,
  },
  statusText: {
    ...typography.h3,
    color: colors.text,
  },
  platformBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  platformText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.divider,
  },
  controlsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  streamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  startButton: {
    backgroundColor: colors.accent,
  },
  stopButton: {
    backgroundColor: colors.error,
  },
  playIcon: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: colors.text,
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginRight: spacing.sm,
  },
  stopIcon: {
    width: 16,
    height: 16,
    backgroundColor: colors.text,
    marginRight: spacing.sm,
  },
  streamButtonText: {
    ...typography.button,
    color: colors.text,
  },
  quickStatsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  quickStatsGrid: {
    flexDirection: 'row',
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    ...typography.h3,
    color: colors.text,
  },
  quickStatLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});