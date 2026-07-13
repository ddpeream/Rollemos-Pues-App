import React from 'react';

import CreateRodadaButtonView from './CreateRodadaButton.ui';

export default function CreateRodadaButton({
  config,
  primaryColor,
  onPrimaryColor,
  onPress,
}) {
  return (
    <CreateRodadaButtonView
      config={config}
      primaryColor={primaryColor}
      onPrimaryColor={onPrimaryColor}
      onPress={onPress}
      disabled={!config.enabled}
    />
  );
}
