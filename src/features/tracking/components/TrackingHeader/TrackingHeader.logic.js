import React from 'react';

import TrackingHeaderView from './TrackingHeader.ui';
import { HEADER_BUTTONS } from './buttons/headerButtons.constants';

export default function TrackingHeader({
  theme,
  mapType,
  onOpenHistory,
  onToggleMapType,
}) {
  const headerStyle = {
    backgroundColor: theme.colors.tracking.headerBackground,
  };

  const mutedButtonStyle = {
    backgroundColor: theme.colors.tracking.mutedControlBackground,
  };

  return (
    <TrackingHeaderView
      buttons={HEADER_BUTTONS}
      headerStyle={headerStyle}
      mapType={mapType}
      mutedButtonStyle={mutedButtonStyle}
      onOpenHistory={onOpenHistory}
      onPrimaryColor={theme.colors.onPrimary}
      onToggleMapType={onToggleMapType}
      primaryColor={theme.colors.primary}
    />
  );
}
