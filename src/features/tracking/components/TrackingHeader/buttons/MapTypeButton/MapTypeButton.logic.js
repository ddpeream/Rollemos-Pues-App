import React from 'react';

import MapTypeButtonView from './MapTypeButton.ui';

export default function MapTypeButton({
  config,
  primaryColor,
  mutedButtonStyle,
  mapType,
  onPress,
}) {
  return (
    <MapTypeButtonView
      config={config}
      primaryColor={primaryColor}
      mutedButtonStyle={mutedButtonStyle}
      mapType={mapType}
      onPress={onPress}
      disabled={!config.enabled}
    />
  );
}
