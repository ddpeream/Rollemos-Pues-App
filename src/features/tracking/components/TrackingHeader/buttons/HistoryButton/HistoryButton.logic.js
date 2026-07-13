import React from 'react';

import HistoryButtonView from './HistoryButton.ui';

export default function HistoryButton({
  config,
  primaryColor,
  mutedButtonStyle,
  onPress,
}) {
  return (
    <HistoryButtonView
      config={config}
      primaryColor={primaryColor}
      mutedButtonStyle={mutedButtonStyle}
      onPress={onPress}
      disabled={!config.enabled}
    />
  );
}
