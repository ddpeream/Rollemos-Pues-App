import React from 'react';

import PendingRodadasButtonView from './PendingRodadasButton.ui';

export default function PendingRodadasButton({
  config,
  primaryColor,
  mutedButtonStyle,
  onPress,
}) {
  return (
    <PendingRodadasButtonView
      config={config}
      primaryColor={primaryColor}
      mutedButtonStyle={mutedButtonStyle}
      onPress={onPress}
      disabled={!config.enabled}
    />
  );
}
