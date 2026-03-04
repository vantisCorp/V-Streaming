import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import { Scene } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

interface Props {
  scenes: Scene[];
  activeSceneId: string | null;
  onSwitchScene: (sceneId: string) => void;
}

export const ScenesScreen: React.FC<Props> = ({
  scenes,
  activeSceneId,
  onSwitchScene,
}) => {
  const renderScene = ({ item }: { item: Scene }) => {
    const isActive = item.id === activeSceneId;
    
    return (
      <TouchableOpacity
        style={[styles.sceneCard, isActive && styles.sceneCardActive]}
        onPress={() => onSwitchScene(item.id)}
      >
        <View style={styles.thumbnailContainer}>
          {item.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Text style={styles.thumbnailPlaceholderText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {isActive && (
            <View style={styles.activeIndicator}>
              <Text style={styles.activeIndicatorText}>ACTIVE</Text>
            </View>
          )}
        </View>
        <Text style={styles.sceneName} numberOfLines={1}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scenes</Text>
        <Text style={styles.sceneCount}>{scenes.length} scenes</Text>
      </View>

      {scenes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Scenes Available</Text>
          <Text style={styles.emptyStateText}>
            Connect to your desktop app to see scenes
          </Text>
        </View>
      ) : (
        <FlatList
          data={scenes}
          renderItem={renderScene}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
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
  sceneCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  list: {
    padding: spacing.md,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sceneCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginHorizontal: spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sceneCardActive: {
    borderColor: colors.primary,
  },
  thumbnailContainer: {
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPlaceholderText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textMuted,
  },
  activeIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  activeIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
  },
  sceneName: {
    ...typography.body,
    color: colors.text,
    padding: spacing.md,
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