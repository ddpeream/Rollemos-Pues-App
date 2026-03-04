import React from 'react';
import { View, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../screens/tracking/tracking.style';

export default function TrackingControls({
  isIdle,
  showStop,
  handleStopTracking,
  handleMainButton,
  buttonConfig,
  pulseAnim,
  isDark,
  theme,
  bottomOffset,
  onCenterMap,
  isPrivateTracking,
  onToggleTrackingPrivacy,
  isStarting,
  isPausing,
  isStopping,
  isResuming,
}) {
  return (
    <View style={[styles.controlsContainer, { bottom: bottomOffset }]}>
      <View
        style={[
          styles.controlsWrapper,
          {
            backgroundColor: isDark
              ? 'rgba(12, 16, 24, 0.85)'
              : 'rgba(255, 255, 255, 0.9)',
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.12)'
              : 'rgba(15, 23, 42, 0.12)',
          },
        ]}
      >
        {showStop ? (
          <TouchableOpacity
            onPress={handleStopTracking}
            style={styles.stopButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={isStopping}
          >
            <View
              style={[
                styles.stopButtonInner,
                {
                  borderColor: theme.colors.error,
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.04)'
                    : 'rgba(255, 255, 255, 0.6)',
                  opacity: isStopping ? 0.5 : 1,
                },
              ]}
            >
              {isStopping ? (
                <ActivityIndicator size={16} color={theme.colors.error} />
              ) : (
                <Ionicons name="stop" size={16} color={theme.colors.error} />
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderButton} />
        )}

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            onPress={handleMainButton}
            style={[
              styles.mainButton,
              {
                backgroundColor: buttonConfig.color,
                shadowColor: buttonConfig.glow,
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.18)'
                  : 'rgba(15, 23, 42, 0.12)',
                opacity: (isStarting || isPausing || isResuming) ? 0.7 : 1,
              },
              isIdle && styles.mainButtonLarge,
            ]}
            activeOpacity={0.8}
            disabled={isStarting || isPausing || isResuming}
          >
            {(isStarting || isPausing || isResuming) ? (
              <ActivityIndicator size={isIdle ? 28 : 24} color={theme.colors.onPrimary} />
            ) : (
              <Ionicons
                name={buttonConfig.icon}
                size={isIdle ? 28 : 24}
                color={theme.colors.onPrimary}
              />
            )}
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          onPress={onCenterMap}
          style={[
            styles.auxButton,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.8)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.2)'
                : 'rgba(15, 23, 42, 0.12)',
            },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons name="locate" size={18} color={theme.colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onToggleTrackingPrivacy}
          style={[
            styles.auxButton,
            {
              backgroundColor: isPrivateTracking
                ? theme.colors.error + '20'
                : isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.8)',
              borderColor: isPrivateTracking
                ? theme.colors.error
                : isDark
                ? 'rgba(255, 255, 255, 0.2)'
                : 'rgba(15, 23, 42, 0.12)',
            },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isPrivateTracking ? 'lock-closed' : 'lock-open'}
            size={18}
            color={isPrivateTracking ? theme.colors.error : theme.colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
