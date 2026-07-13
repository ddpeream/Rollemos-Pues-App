import React from 'react';

import ToggleLayersButtonView from './ToggleLayersButton.ui';

export default function ToggleLayersButton({
  config,
  primaryColor,
  mutedButtonStyle,
  onPress,
}) {
  return (
    <ToggleLayersButtonView
      config={config}
      primaryColor={primaryColor}
      mutedButtonStyle={mutedButtonStyle}
      onPress={onPress}
      disabled={!config.enabled}
    />
  );
}
