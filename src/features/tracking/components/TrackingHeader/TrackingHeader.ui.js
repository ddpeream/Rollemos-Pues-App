import React from 'react';
import { View } from 'react-native';

import HistoryButton from './buttons/HistoryButton/HistoryButton.js';
import PendingRodadasButton from './buttons/PendingRodadasButton/PendingRodadasButton.js';
import CreateRodadaButton from './buttons/CreateRodadaButton/CreateRodadaButton.js';
import MapTypeButton from './buttons/MapTypeButton/MapTypeButton.js';
import ToggleLayersButton from './buttons/ToggleLayersButton/ToggleLayersButton.js';
import { styles } from './TrackingHeader.style';

export default function TrackingHeaderView({
  buttons,
  headerStyle,
  mapType,
  mutedButtonStyle,
  onOpenHistory,
  onPrimaryColor,
  onToggleMapType,
  primaryColor,
}) {
  return (
    <View style={[styles.header, headerStyle]}>
      <HistoryButton
        config={buttons.HISTORY}
        primaryColor={primaryColor}
        mutedButtonStyle={mutedButtonStyle}
        onPress={onOpenHistory}
      />

      <PendingRodadasButton
        config={buttons.PENDING}
        primaryColor={primaryColor}
        mutedButtonStyle={mutedButtonStyle}
      />

      <CreateRodadaButton
        config={buttons.CREATE_RODADA}
        primaryColor={primaryColor}
        onPrimaryColor={onPrimaryColor}
      />

      <MapTypeButton
        config={buttons.MAP_TYPE}
        primaryColor={primaryColor}
        mutedButtonStyle={mutedButtonStyle}
        mapType={mapType}
        onPress={onToggleMapType}
      />

      <ToggleLayersButton
        config={buttons.TOGGLE_LAYERS}
        primaryColor={primaryColor}
        mutedButtonStyle={mutedButtonStyle}
      />
    </View>
  );
}
