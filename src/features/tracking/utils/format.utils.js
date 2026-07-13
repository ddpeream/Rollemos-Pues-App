export const formatDuration = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':');
};

export const formatDistance = (meters) => {
  const safeMeters = Math.max(0, Number(meters) || 0);
  if (safeMeters < 1000) return `${safeMeters.toFixed(0)} m`;
  return `${(safeMeters / 1000).toFixed(2)} km`;
};

export const formatSpeed = (speedKmh) => (Math.max(0, Number(speedKmh) || 0).toFixed(1));

export const formatCalories = (calories) => Math.max(0, Math.round(Number(calories) || 0)).toString();
