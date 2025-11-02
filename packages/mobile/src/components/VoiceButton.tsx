// Voice Button Component - Main voice recording button
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, shadows } from '../styles/theme';
import { useVoice } from '../hooks/useVoice';

interface VoiceButtonProps {
  onCommandComplete?: () => void;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({ onCommandComplete }) => {
  const { isRecording, isProcessing, startRecording, stopRecording } = useVoice();

  const handlePress = async () => {
    if (isRecording) {
      await stopRecording();
      onCommandComplete?.();
    } else {
      await startRecording();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        disabled={isProcessing}
        style={styles.touchable}
      >
        <LinearGradient
          colors={
            isRecording
              ? [colors.error, colors.secondaryDark]
              : [colors.primary, colors.primaryDark]
          }
          style={[styles.button, isRecording && styles.buttonRecording]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {isProcessing ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <>
              <View style={[styles.icon, isRecording && styles.iconRecording]}>
                {isRecording && <View style={styles.recordingPulse} />}
              </View>
              <Text style={styles.buttonText}>
                {isRecording ? 'Tap to Stop' : 'Tap to Speak'}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Recording...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchable: {
    borderRadius: 100,
  },
  button: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  buttonRecording: {
    transform: [{ scale: 1.1 }],
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconRecording: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  recordingPulse: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    marginRight: spacing.sm,
  },
  recordingText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
});
