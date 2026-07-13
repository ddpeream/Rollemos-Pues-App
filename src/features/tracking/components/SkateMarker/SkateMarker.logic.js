import React, { memo, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import SkateMarkerView from './SkateMarker.ui';

function SkateMarker({ coordinate, color, heading = 0 }) {
  const [tracksViewChanges, setTracksViewChanges] = useState(Platform.OS === 'android');

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;

    setTracksViewChanges(true);

    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [coordinate?.latitude, coordinate?.longitude, heading]);

  if (!coordinate) return null;

  return (
    <SkateMarkerView
      color={color}
      coordinate={coordinate}
      flat={Platform.OS === 'android'}
      heading={heading}
      tracksViewChanges={tracksViewChanges}
    />
  );
}

export default memo(SkateMarker);
