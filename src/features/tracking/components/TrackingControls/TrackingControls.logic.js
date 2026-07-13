import React from 'react';

import TrackingControlsView from './TrackingControls.ui';

export default function TrackingControls({
  buttonConfig,
  isLivePrivate,
  isMainActionLoading,
  isStopping,
  theme,
  bottomOffset,
  onCenterMap,
  onMainButtonPress,
  onToggleLivePrivacy,
  onStopTracking,
  showStop,
}) {
  const wrapperStyle = {
    backgroundColor: theme.colors.tracking.controlBackground,
    borderColor: theme.colors.tracking.controlBorder,
  };

  const primaryButtonStyle = {
    backgroundColor: buttonConfig.color,
    shadowColor: buttonConfig.glow,
    borderColor: theme.colors.tracking.primaryControlBorder,
  };

  const auxiliaryButtonStyle = {
    backgroundColor: theme.colors.tracking.auxiliaryControlBackground,
    borderColor: theme.colors.tracking.auxiliaryControlBorder,
  };

  const stopButtonStyle = {
    backgroundColor: theme.colors.tracking.auxiliaryControlBackground,
    borderColor: theme.colors.error,
  };

  return (
    <TrackingControlsView
      auxiliaryButtonStyle={auxiliaryButtonStyle}
      bottomOffset={bottomOffset}
      icon={buttonConfig.icon}
      isLivePrivate={isLivePrivate}
      isMainActionLoading={isMainActionLoading}
      isStopping={isStopping}
      onCenterMap={onCenterMap}
      onMainButtonPress={onMainButtonPress}
      onToggleLivePrivacy={onToggleLivePrivacy}
      onPrimaryColor={theme.colors.onPrimary}
      onStopTracking={onStopTracking}
      primaryButtonStyle={primaryButtonStyle}
      primaryColor={theme.colors.primary}
      privacyColor={isLivePrivate ? theme.colors.warning : theme.colors.primary}
      showStop={showStop}
      stopButtonStyle={stopButtonStyle}
      stopColor={theme.colors.error}
      wrapperStyle={wrapperStyle}
    />
  );
}
