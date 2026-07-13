export const getCaloriesEstimate = ({ avgSpeedKmh, durationSeconds }) => {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0;

  const durationHours = durationSeconds / 3600;
  const effortFactor = avgSpeedKmh >= 18 ? 520 : avgSpeedKmh >= 10 ? 420 : 300;

  return Math.max(0, Math.round(durationHours * effortFactor));
};
