export const METRIC_COLORS = {
  normal: '#1B1F2A',
  warning: '#8A5A00',
  critical: '#B42318',
  missing: '#9AA0AD',
} as const;

export const getMetricColor = (percent?: number | null): string => {
  if (percent === undefined || percent === null || Number.isNaN(percent)) {
    return METRIC_COLORS.missing;
  }

  if (percent >= 90) {
    return METRIC_COLORS.critical;
  }

  return percent >= 75 ? METRIC_COLORS.warning : METRIC_COLORS.normal;
};
