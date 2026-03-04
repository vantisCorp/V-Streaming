import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useWebSocket } from '../hooks/useWebSocket';
import { colors, spacing, borderRadius, typography } from '../theme';

interface Props {
  onConnected: () => void;
}

export const ConnectionScreen: React.FC<Props> = ({ onConnected }) => {
  const { connectionStatus, connect } = useWebSocket();
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('8080');
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!ip.trim()) {
      setError('Please enter the desktop IP address');
      return;
    }

    setError(null);
    try {
      await connect(ip.trim(), parseInt(port) || 8080);
      onConnected();
    } catch (err) {
      setError('Failed to connect. Please check the IP address and ensure the desktop app is running.');
    }
  };

  const isConnecting = connectionStatus === 'connecting';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>V</Text>
          <Text style={styles.title}>V-Streaming</Text>
          <Text style={styles.subtitle}>Mobile Companion</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Desktop IP Address</Text>
          <TextInput
            style={styles.input}
            value={ip}
            onChangeText={setIp}
            placeholder="192.168.1.100"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isConnecting}
          />

          <Text style={styles.label}>Port</Text>
          <TextInput
            style={styles.input}
            value={port}
            onChangeText={setPort}
            placeholder="8080"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isConnecting}
          />

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, isConnecting && styles.buttonDisabled]}
            onPress={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.buttonText}>Connect</Text>
            )}
          </TouchableOpacity>

          <View style={styles.instructions}>
            <Text style={styles.instructionTitle}>How to connect:</Text>
            <Text style={styles.instructionText}>
              1. Open V-Streaming on your desktop{'\n'}
              2. Go to Settings → Remote Control{'\n'}
              3. Enable mobile companion{'\n'}
              4. Enter the displayed IP address
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    fontSize: 80,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  label: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: colors.error + '20',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: {
    backgroundColor: colors.primaryDark,
  },
  buttonText: {
    ...typography.button,
    color: colors.text,
  },
  instructions: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
  },
  instructionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  instructionText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});