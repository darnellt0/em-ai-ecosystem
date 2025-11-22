/**
 * HeyGen Interactive Avatar Demo Component
 * Demonstrates embedding and controlling HeyGen avatars in the mobile app
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, shadows } from '../styles/theme';
import apiService from '../services/api';

interface HeygenAvatarDemoProps {
  avatarId?: string;
  voiceId?: string;
  userId?: string;
}

interface SessionState {
  sessionId: string | null;
  streamUrl: string | null;
  widgetToken: string | null;
  isActive: boolean;
}

export const HeygenAvatarDemo: React.FC<HeygenAvatarDemoProps> = ({
  avatarId = 'default-avatar-id',
  voiceId,
  userId,
}) => {
  const [session, setSession] = useState<SessionState>({
    sessionId: null,
    streamUrl: null,
    widgetToken: null,
    isActive: false,
  });
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Start a new avatar session
   */
  const startSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.startHeygenSession({
        avatarId,
        voiceId,
        userId,
        language: 'en',
        quality: 'medium',
      });

      setSession({
        sessionId: response.sessionId,
        streamUrl: response.streamUrl,
        widgetToken: response.widgetToken,
        isActive: true,
      });

      console.log('[HeyGen Avatar] Session started:', response.sessionId);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to start session';
      setError(errorMessage);
      Alert.alert('Session Error', errorMessage);
      console.error('[HeyGen Avatar] Session start error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Send a message to the avatar
   */
  const sendMessage = async () => {
    if (!session.sessionId) {
      Alert.alert('Error', 'No active session. Please start a session first.');
      return;
    }

    if (!messageText.trim()) {
      Alert.alert('Error', 'Please enter a message to send.');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await apiService.sendHeygenMessage({
        sessionId: session.sessionId,
        text: messageText.trim(),
        userId,
      });

      console.log('[HeyGen Avatar] Message sent:', response.messageId);
      setMessageText(''); // Clear input after successful send
      Alert.alert('Success', 'Message sent to avatar!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to send message';
      setError(errorMessage);
      Alert.alert('Message Error', errorMessage);
      console.error('[HeyGen Avatar] Message send error:', err);
    } finally {
      setIsSending(false);
    }
  };

  /**
   * End the current avatar session
   */
  const endSession = async () => {
    if (!session.sessionId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await apiService.endHeygenSession(session.sessionId);
      console.log('[HeyGen Avatar] Session ended:', session.sessionId);

      setSession({
        sessionId: null,
        streamUrl: null,
        widgetToken: null,
        isActive: false,
      });

      Alert.alert('Session Ended', 'Avatar session has been closed.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to end session';
      console.error('[HeyGen Avatar] Session end error:', err);
      // Don't show error for cleanup failures
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cleanup session on unmount
   */
  useEffect(() => {
    return () => {
      if (session.sessionId) {
        apiService.endHeygenSession(session.sessionId).catch(console.error);
      }
    };
  }, [session.sessionId]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Interactive Avatar Demo</Text>
        <Text style={styles.subtitle}>Powered by HeyGen</Text>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Avatar Container (Placeholder) */}
      <View style={styles.avatarContainer}>
        {session.isActive ? (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>
              Avatar Active
            </Text>
            <Text style={styles.sessionInfo}>
              Session: {session.sessionId?.substring(0, 8)}...
            </Text>
            {session.streamUrl && (
              <Text style={styles.streamInfo}>
                Stream URL: {session.streamUrl.substring(0, 30)}...
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>
              No Active Session
            </Text>
            <Text style={styles.avatarPlaceholderSubtext}>
              Start a session to activate the avatar
            </Text>
          </View>
        )}
      </View>

      {/* Session Controls */}
      <View style={styles.controls}>
        {!session.isActive ? (
          <TouchableOpacity
            onPress={startSession}
            disabled={isLoading}
            style={styles.touchable}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Start Avatar Session</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <>
            {/* Message Input */}
            <View style={styles.messageContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter message for avatar to speak..."
                placeholderTextColor={colors.textLight}
                value={messageText}
                onChangeText={setMessageText}
                multiline
                numberOfLines={3}
                editable={!isSending}
              />
              <TouchableOpacity
                onPress={sendMessage}
                disabled={isSending || !messageText.trim()}
                style={styles.sendButton}
              >
                <LinearGradient
                  colors={
                    messageText.trim()
                      ? [colors.success, '#059669']
                      : [colors.textLight, colors.textSecondary]
                  }
                  style={styles.sendButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.sendButtonText}>Send</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* End Session Button */}
            <TouchableOpacity
              onPress={endSession}
              disabled={isLoading}
              style={styles.touchable}
            >
              <View style={styles.endButton}>
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.error} />
                ) : (
                  <Text style={styles.endButtonText}>End Session</Text>
                )}
              </View>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>How to Use:</Text>
        <Text style={styles.instructionsText}>
          1. Tap "Start Avatar Session" to begin{'\n'}
          2. Enter text in the message box{'\n'}
          3. Tap "Send" to make the avatar speak{'\n'}
          4. Tap "End Session" when finished
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
  avatarContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  avatarPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  avatarPlaceholderSubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  sessionInfo: {
    fontSize: 12,
    color: colors.success,
    marginTop: spacing.sm,
  },
  streamInfo: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  controls: {
    marginBottom: spacing.lg,
  },
  touchable: {
    borderRadius: 12,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  messageContainer: {
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  sendButton: {
    alignSelf: 'flex-end',
  },
  sendButtonGradient: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  endButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.error,
  },
  endButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  instructionsText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
