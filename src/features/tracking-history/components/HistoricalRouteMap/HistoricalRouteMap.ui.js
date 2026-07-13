import React from 'react';
import { View } from 'react-native';

import { styles } from './historicalRouteMap.style';

export default function HistoricalRouteMapView({ badge, map }) {
  return (
    <View style={styles.container}>
      {map}
      {badge}
    </View>
  );
}
