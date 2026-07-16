import * as TaskManager from 'expo-task-manager';

import { TRACKING_BACKGROUND } from '../constants/trackingBackground.constants';
import { appendTrackingBackgroundLocations } from '../services/trackingBackgroundBuffer.service';
import { publishTrackingLiveBackgroundLocation } from '../services/trackingLiveBackground.service';

if (!TaskManager.isTaskDefined(TRACKING_BACKGROUND.TASK_NAME)) {
  TaskManager.defineTask(TRACKING_BACKGROUND.TASK_NAME, async ({ data, error }) => {
    if (error) return { buffered: 0 };

    const bufferResult = await appendTrackingBackgroundLocations(data?.locations);
    if (!bufferResult.latestCoordinate || !bufferResult.routeId) return bufferResult;

    const liveResult = await publishTrackingLiveBackgroundLocation({
      coordinate: bufferResult.latestCoordinate,
      routeId: bufferResult.routeId,
    });

    return {
      ...bufferResult,
      liveError: liveResult.error || null,
      livePublished: liveResult.published === true,
    };
  });
}
