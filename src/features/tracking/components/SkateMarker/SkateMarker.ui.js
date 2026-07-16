import React from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MarkerAnimated } from 'react-native-maps';

import { colors, sizes } from '../../../../theme';
import { styles } from './SkateMarker.style';

export default function SkateMarkerView({
  animatedCoordinate,
  color,
  flat,
  heading,
  markerRef,
  tracksViewChanges,
}) {
  return (
    <MarkerAnimated
      ref={markerRef}
      coordinate={animatedCoordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      flat={flat}
      rotation={heading}
      tracksViewChanges={tracksViewChanges}
      zIndex={sizes.zIndex.marker}
    >
      <View style={[styles.marker, { backgroundColor: color }]}>
        <MaterialCommunityIcons name="roller-skate" size={sizes.icon.md} color={colors.onSecondary} />
      </View>
    </MarkerAnimated>
  );
}
