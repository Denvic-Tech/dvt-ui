import React from 'react';

import { Tooltip } from '@/shared/ui';

import { getSeverity } from './lib/severity.ts';
import {
  MetricLabel,
  MetricProgress,
  MetricSub,
  MetricTopRow,
  MetricValue,
  MetricWrap,
} from './styled.ts';

interface InlineMetricProps {
  detail: string;
  icon: React.ReactNode;
  label: string;
  percent: number;
}

export const InlineMetric: React.FC<InlineMetricProps> = ({
  detail,
  icon,
  label,
  percent,
}) => {
  const clampedPercent = Math.min(Math.max(percent, 0), 100);
  const { severity } = getSeverity(clampedPercent);

  return (
    <Tooltip title={`${label}: ${clampedPercent.toFixed(1)}%`}>
      <MetricWrap>
        <MetricTopRow>
          <MetricLabel>
            {icon}
            {label}
          </MetricLabel>
          <MetricValue severity={severity}>
            {clampedPercent.toFixed(1)}%
          </MetricValue>
        </MetricTopRow>
        <MetricProgress severity={severity} value={clampedPercent} />
        <MetricSub title={detail}>{detail}</MetricSub>
      </MetricWrap>
    </Tooltip>
  );
};
