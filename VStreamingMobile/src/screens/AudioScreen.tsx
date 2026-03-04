import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Slider,
} from 'react-native';
import { AudioTrack } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

interface Props {
  audioTracks: AudioTrack[];
  onSetVolume: (trackId: string, volume: number) => void;
  onToggleMute: (trackId: string) => void;
}

export const AudioScreen: React.FC<Props> = ({
  audioTracks,
  onSetVolume,
  onToggleMute,
}) => {
  const renderTrack = ({ item }: { item: AudioTrack }) => {
    const meterHeight = Math.min(100, Math.max(0, item.meter * 100));
    
    return (
      <View style={styles.trackCard}>
        <View style={styles.trackHeader}>
          <Text style={styles.trackName} numberOfLines={1}>
            {item.name}
          </Text>
          <TouchableOpacity
            style={[styles.muteButton, item.muted && styles.muteButtonActive]}
            onPress={() => onToggleMute(item.id)}
          >
            <Text style={styles.muteButtonText}>
              {item.muted ? 'UNMUTE' : 'MUTE'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.meterContainer}>
          <View style={styles.meterBackground}>
            <View
              style={[
                styles.meterFill,
                { height: `${meterHeight}%` },
                item.muted && styles.meterMuted,
              ]}
            />
          </View>
        </View>

        <View style={styles.volumeContainer}>
          <Text style={styles.volumeLabel}>
            {Math.round(item.volume * 100)}%
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={item.volume}
            onValueChange={(value) => onSetVolume(item.id, value)}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.divider}
            thumbTintColor={colors.primary}
            disabled={item.muted}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Audio Mixer</Text>
        <Text style={styles.trackCount}>{audioTracks.length} tracks</Text>
      </View>

      {audioTracks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Audio Tracks</Text>
          <Text style={styles.emptyStateText}>
            Connect to your desktop app to see audio tracks
          </Text>
        </View>
      ) : (
        <FlatList
          data={audioTracks}
          renderItem={renderTrack}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  trackCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  list: {
    padding: spacing.md,
  },
  trackCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackHeader: {
    width: 100,
    marginRight: spacing.md,
  },
  trackName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  muteButton: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  muteButtonActive: {
    backgroundColor: colors.error,
  },
  muteButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },
  meterContainer: {
    width: 20,
    height: 80,
    marginRight: spacing.md,
  },
  meterBackground: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  meterFill: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.sm,
  },
  meterMuted: {
    backgroundColor: colors.textMuted,
  },
  volumeContainer: {
    flex: 1,
  },
  volumeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});