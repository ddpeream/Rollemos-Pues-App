import React from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { sizes } from '../../../../theme';
import { styles } from './TrackingControls.style';

export default function TrackingControlsView({
  auxiliaryButtonStyle,
  bottomOffset,
  icon,
  isLivePrivate,
  isMainActionLoading,
  isStopping,
  onCenterMap,
  onMainButtonPress,
  onToggleLivePrivacy,
  onPrimaryColor,
  onStopTracking,
  primaryButtonStyle,
  primaryColor,
  privacyColor,
  showStop,
  stopButtonStyle,
  stopColor,
  wrapperStyle,
}) {
  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      <View style={[styles.wrapper, wrapperStyle]}>
        {showStop ? (
          <TouchableOpacity
            disabled={isStopping}
            onPress={onStopTracking}
            style={[styles.auxButton, stopButtonStyle]}
            activeOpacity={0.7}
          >
            {isStopping ? (
              <ActivityIndicator size={sizes.icon.sm} color={stopColor} />
            ) : (
              <Ionicons name="stop" size={sizes.icon.sm} color={stopColor} />
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderButton} />
        )}

        <TouchableOpacity
          disabled={isMainActionLoading}
          onPress={onMainButtonPress}
          style={[styles.mainButton, primaryButtonStyle, styles.mainButtonLarge]}
          activeOpacity={0.8}
        >
          {isMainActionLoading ? (
            <ActivityIndicator size={sizes.icon.xl} color={onPrimaryColor} />
          ) : (
            <Ionicons name={icon} size={sizes.icon.xxl} color={onPrimaryColor} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onCenterMap}
          style={[styles.auxButton, auxiliaryButtonStyle]}
          activeOpacity={0.7}
        >
          <Ionicons name="locate" size={sizes.icon.md} color={primaryColor} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onToggleLivePrivacy}
          style={[styles.auxButton, auxiliaryButtonStyle]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isLivePrivate ? 'lock-closed' : 'lock-open'}
            size={sizes.icon.md}
            color={privacyColor}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
