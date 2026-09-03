export type MetricSeverity = 'normal' | 'warning' | 'critical';

export function getSeverity(percent: number): {
  bar: string;
  text: string;
  severity: MetricSeverity;
} {
  if (percent >= 90) {
    return {
      bar: '#ef4444',
      text: '#dc2626',
      severity: 'critical',
    };
  }

  if (percent >= 75) {
    return {
      bar: '#f59e0b',
      text: '#b45309',
      severity: 'warning',
    };
  }

  return {
    bar: '#10b981',
    text: '#059669',
    severity: 'normal',
  };
}
