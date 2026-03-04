import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';

import { useWebSocket } from './src/hooks/useWebSocket';
import { ConnectionScreen } from './src/screens/ConnectionScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ScenesScreen } from './src/screens/ScenesScreen';
import { AudioScreen } from './src/screens/AudioScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { colors, typography } from './src/theme';

const Tab = createBottomTabNavigator();

// Custom tab bar icons
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const icons: { [key: string]: string } = {
    Dashboard: '🏠',
    Scenes: '🎬',
    Audio: '🔊',
    Chat: '💬',
    Settings: '⚙️',
  };

  return (
    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
      {icons[name] || '📱'}
    </Text>
  );
};

const MainApp: React.FC = () => {
  const {
    connectionStatus,
    streamStatus,
    scenes,
    audioTracks,
    chatMessages,
    disconnect,
    startStream,
    stopStream,
    getScenes,
    switchScene,
    getAudioTracks,
    setVolume,
    toggleMute,
    sendChatMessage,
  } = useWebSocket();

  // Fetch initial data when connected
  useEffect(() => {
    if (connectionStatus === 'connected') {
      getScenes();
      getAudioTracks();
    }
  }, [connectionStatus, getScenes, getAudioTracks]);

  const activeSceneId = scenes.find(s => s.active)?.id || null;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <Tab.Screen name="Dashboard">
        {() => (
          <DashboardScreen
            streamStatus={streamStatus}
            onStartStream={startStream}
            onStopStream={stopStream}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Scenes">
        {() => (
          <ScenesScreen
            scenes={scenes}
            activeSceneId={activeSceneId}
            onSwitchScene={switchScene}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Audio">
        {() => (
          <AudioScreen
            audioTracks={audioTracks}
            onSetVolume={setVolume}
            onToggleMute={toggleMute}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Chat">
        {() => (
          <ChatScreen
            messages={chatMessages}
            onSendMessage={sendChatMessage}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Settings">
        {() => <SettingsScreen onDisconnect={disconnect} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const { connectionStatus } = useWebSocket();

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && connectionStatus === 'connected') {
        // Refresh data when app comes to foreground
        // This would trigger re-fetch of scenes, audio tracks, etc.
      }
    });

    return () => {
      subscription.remove();
    };
  }, [connectionStatus]);

  const handleConnected = () => {
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          {isConnected ? (
            <MainApp />
          ) : (
            <ConnectionScreen onConnected={handleConnected} />
          )}
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 20,
  },
  tabIconActive: {
    transform: [{ scale: 1.1 }],
  },
});

export default App;