import React from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Marker } from 'react-native-maps';

import { colors, sizes } from '../../../../theme';
import { styles } from './SkateMarker.style';

export default function SkateMarkerView({
  color,
  coordinate,
  flat,
  heading,
  tracksViewChanges,
}) {
  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      flat={flat}
      rotation={heading}
      tracksViewChanges={tracksViewChanges}
      zIndex={sizes.zIndex.marker}
    >
      <View style={[styles.marker, { backgroundColor: color }]}>
        <MaterialCommunityIcons name="roller-skate" size={sizes.icon.md} color={colors.onSecondary} />
      </View>
    </Marker>
  );
}
