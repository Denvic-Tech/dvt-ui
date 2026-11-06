import React, { useState } from 'react';
import { Collapse, Skeleton } from '@mui/material';
import { IconChevronDown } from '@tabler/icons-react';

import {
  formatDurationShort,
  formatPercent,
  getElapsedSeconds,
} from './lib/formatters.ts';
import { getMetricColor, METRIC_COLORS } from './lib/metricColor.ts';
import { ServiceDetails } from './ServiceDetails.tsx';
import {
  ServiceChevron,
  ServiceDot,
  ServiceHost,
  ServiceMetric,
  ServiceMetricLabel,
  ServiceMetricValue,
  ServiceName,
  ServiceNameCell,
  ServiceRowButton,
  ServiceRowSkeletonRoot,
  ServiceUptime,
} from './styles.ts';
import type { ServiceRowItem } from './types.ts';

const DOT_COLORS = { available: '#2BB673', unavailable: '#E5484D' } as const;

const UPTIME_COLORS = { available: '#6B7385', unavailable: '#B42318' } as const;

const getUptimeText = (item: ServiceRowItem, now: number) => {
  if (!item.isAvailable) {
    return item.lastResponseAt
      ? `не отвечает ${formatDurationShort(getElapsedSeconds(item.lastResponseAt, now))}`
      : 'не отвечает';
  }

  return `работает ${formatDurationShort(item.data?.app_uptime_seconds)}`;
};

interface ServiceRowProps {
  item: ServiceRowItem;
  // Current time, ticks every second together with the header.
  now: number;
}

export const ServiceRow: React.FC<ServiceRowProps> = ({ item, now }) => {
  const [expanded, setExpanded] = useState(false);
  const { data, isAvailable } = item;
  const state = isAvailable ? 'available' : 'unavailable';

  const metrics = [
    { label: 'CPU', percent: data?.cpu_percent },
    { label: 'RAM', percent: data?.ram_used_percent },
    { label: 'Диск', percent: data?.disk_used_percent },
  ];

  return (
    <div>
      <ServiceRowButton
        aria-expanded={expanded}
        disableRipple
        onClick={() => setExpanded(prev => !prev)}
      >
        <ServiceNameCell>
          <ServiceDot sx={{ bgcolor: DOT_COLORS[state] }} />
          <ServiceName>{item.name}</ServiceName>
          {data?.hostname ? (
            <ServiceHost aria-hidden={!expanded} visible={expanded}>
              {data.hostname}
            </ServiceHost>
          ) : null}
        </ServiceNameCell>

        {metrics.map(metric => (
          <ServiceMetric key={metric.label}>
            <ServiceMetricLabel>{metric.label}</ServiceMetricLabel>
            <ServiceMetricValue
              sx={{
                color: isAvailable
                  ? getMetricColor(metric.percent)
                  : METRIC_COLORS.missing,
              }}
            >
              {isAvailable ? formatPercent(metric.percent) : '—'}
            </ServiceMetricValue>
          </ServiceMetric>
        ))}

        <ServiceUptime sx={{ color: UPTIME_COLORS[state] }}>
          {getUptimeText(item, now)}
        </ServiceUptime>

        <ServiceChevron aria-hidden expanded={expanded}>
          <IconChevronDown size={14} stroke={1.6} />
        </ServiceChevron>
      </ServiceRowButton>

      <Collapse in={expanded} timeout={150} unmountOnExit>
        <ServiceDetails data={data} isAvailable={isAvailable} />
      </Collapse>
    </div>
  );
};

const Bone = ({ width, height = 10 }: { width: number; height?: number }) => (
  <Skeleton
    variant='rounded'
    animation='wave'
    width={width}
    height={height}
    sx={{ flexShrink: 0, borderRadius: '6px', bgcolor: '#F1F3F8' }}
  />
);

// Repeats the geometry of ServiceRow, so the boxes do not shift on load.
export const ServiceRowSkeleton = ({ nameWidth }: { nameWidth: number }) => (
  <ServiceRowSkeletonRoot aria-hidden>
    <ServiceNameCell>
      <Skeleton
        variant='circular'
        animation='wave'
        width={6}
        height={6}
        sx={{ flexShrink: 0, bgcolor: '#F1F3F8' }}
      />
      <Bone width={nameWidth} height={12} />
    </ServiceNameCell>
    <Bone width={56} />
    <Bone width={56} />
    <Bone width={56} />
    <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Bone width={96} />
    </span>
    <span />
  </ServiceRowSkeletonRoot>
);
