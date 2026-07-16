import { animations } from './animations';
import { sizes } from './sizes';
import { spacing } from './spacing';

export const trackingTokens = {
  header: {
    paddingTop: 50,
    paddingBottom: spacing.md,
  },
  statsTop: {
    top: 110,
    paddingVertical: 10,
    paddingHorizontal: 14,
    durationItemFlex: 1.35,
    itemFlex: 1,
    minimumFontScale: 0.72,
  },
  statsSide: {
    top: 200,
  },
  controls: {
    bottomOffset: 18,
    paddingHorizontal: 14,
  },
  map: {
    centerAnimationDurationMs: animations.duration.slow,
    livePathStrokeWidth: 3,
    livePathZIndex: 10,
    liveSkaterZIndex: sizes.zIndex.marker - 20,
    localRouteStrokeWidth: 4,
    localRouteZIndex: 20,
    markerAnimationDurationMs: animations.duration.slow,
    markerRenderSettleDurationMs: animations.duration.slow,
    startFlagZIndex: sizes.zIndex.marker - 10,
  },
};
