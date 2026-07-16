// @ts-check

import { expoLocationProvider } from './expoLocation.provider';
import { expoBackgroundLocationProvider } from './expoBackgroundLocation.provider';

/** @type {import('../../contracts/trackingPlatform.contracts').TrackingLocationProvider} */
export const trackingLocationProvider = expoLocationProvider;

/** @type {import('../../contracts/trackingPlatform.contracts').TrackingBackgroundProvider} */
export const trackingBackgroundProvider = expoBackgroundLocationProvider;

export default trackingLocationProvider;
