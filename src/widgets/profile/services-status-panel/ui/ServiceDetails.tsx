import React from 'react';
import {
  IconArrowDown,
  IconArrowUp,
  IconClock,
  IconClockPlay,
  IconCpu,
  IconDatabase,
  IconDeviceSdCard,
  IconListDetails,
} from '@tabler/icons-react';

import type { SystemInfo, WorkerSystemInfo } from '@/shared/gatewayClient';

import {
  formatBytes,
  formatBytesPair,
  formatCores,
  formatCount,
  formatDurationFull,
} from './lib/formatters.ts';
import { getMetricColor, METRIC_COLORS } from './lib/metricColor.ts';
import {
  ServiceDetail,
  ServiceDetailIcon,
  ServiceDetailLabel,
  ServiceDetailsGrid,
  ServiceDetailsRoot,
  ServiceDetailText,
  ServiceDetailValue,
} from './styles.ts';

type DetailIcon = typeof IconCpu;

interface DetailItem {
  label: string;
  icon: DetailIcon;
  value: string;
  color?: string;
}

const getDetails = (
  data: SystemInfo | WorkerSystemInfo | null,
  isAvailable: boolean
): DetailItem[] => [
  {
    label: 'Процессор',
    icon: IconCpu,
    value: formatCores(data?.cpu_cores_logical),
  },
  {
    label: 'Память',
    icon: IconDeviceSdCard,
    value: formatBytesPair(data?.ram_used, data?.ram_total),
  },
  {
    label: 'Диск',
    icon: IconDatabase,
    value: formatBytesPair(data?.disk_used, data?.disk_total),
    color: data ? getMetricColor(data.disk_used_percent) : METRIC_COLORS.normal,
  },
  {
    label: 'Процессы',
    icon: IconListDetails,
    value: formatCount(data?.process_count),
  },
  {
    label: 'Отправлено',
    icon: IconArrowUp,
    value: formatBytes(data?.network_bytes_sent),
  },
  {
    label: 'Получено',
    icon: IconArrowDown,
    value: formatBytes(data?.network_bytes_recv),
  },
  {
    label: 'Аптайм системы',
    icon: IconClock,
    value: formatDurationFull(data?.system_uptime_seconds),
  },
  {
    label: 'Аптайм приложения',
    icon: IconClockPlay,
    // The app of an unavailable service is not running.
    value: isAvailable ? formatDurationFull(data?.app_uptime_seconds) : '—',
  },
];

interface ServiceDetailsProps {
  data: SystemInfo | WorkerSystemInfo | null;
  isAvailable: boolean;
}

export const ServiceDetails: React.FC<ServiceDetailsProps> = ({
  data,
  isAvailable,
}) => (
  <ServiceDetailsRoot>
    <ServiceDetailsGrid>
      {getDetails(data, isAvailable).map(
        ({ label, icon: Icon, value, color }) => (
          <ServiceDetail key={label}>
            <ServiceDetailIcon aria-hidden>
              <Icon size={16} stroke={1.5} />
            </ServiceDetailIcon>
            <ServiceDetailText>
              <ServiceDetailLabel>{label}</ServiceDetailLabel>
              <ServiceDetailValue
                title={value}
                sx={{ color: color ?? METRIC_COLORS.normal }}
              >
                {value}
              </ServiceDetailValue>
            </ServiceDetailText>
          </ServiceDetail>
        )
      )}
    </ServiceDetailsGrid>
  </ServiceDetailsRoot>
);
