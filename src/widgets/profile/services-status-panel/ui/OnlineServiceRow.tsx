import React from 'react';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import PrecisionManufacturingRoundedIcon from '@mui/icons-material/PrecisionManufacturingRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';

import { formatBytes, formatCpuCores } from './lib/formatters.ts';
import { InlineMetric } from './InlineMetric.tsx';
import { StatusBadge } from './StatusBadge.tsx';
import {
  ChevronSlot,
  MainInfoSlot,
  MetricsGrid,
  NameSlot,
  NameText,
  RowButton,
  StatusSlot,
  TaskSlot,
} from './styled.ts';
import { TaskPill } from './TaskPill.tsx';
import type { ServiceStatusRowItem } from './types.ts';
import { isWorkerSystemInfo } from './types.ts';

interface OnlineServiceRowProps {
  expanded: boolean;
  item: ServiceStatusRowItem;
  onToggle: () => void;
}

export const OnlineServiceRow: React.FC<OnlineServiceRowProps> = ({
  expanded,
  item,
  onToggle,
}) => {
  if (!item.data) {
    return null;
  }

  const workerData = isWorkerSystemInfo(item.data) ? item.data : null;
  const metrics = [
    {
      key: 'cpu',
      detail: formatCpuCores(
        item.data.cpu_cores_physical,
        item.data.cpu_cores_logical
      ),
      icon: <SpeedRoundedIcon />,
      label: 'CPU',
      percent: item.data.cpu_percent,
    },
    {
      key: 'ram',
      detail: `${formatBytes(item.data.ram_used)} / ${formatBytes(item.data.ram_total)}`,
      icon: <MemoryRoundedIcon />,
      label: 'RAM',
      percent: item.data.ram_used_percent,
    },
    {
      key: 'disk',
      detail: `${formatBytes(item.data.disk_used)} / ${formatBytes(item.data.disk_total)}`,
      icon: item.isWorker ? (
        <PrecisionManufacturingRoundedIcon />
      ) : (
        <StorageRoundedIcon />
      ),
      label: 'Disk',
      percent: item.data.disk_used_percent,
    },
  ] as const;

  return (
    <RowButton
      aria-expanded={expanded}
      onClick={onToggle}
      type='button'
      title={item.title}
    >
      <NameSlot>
        <NameText>{item.title}</NameText>
      </NameSlot>
      <StatusSlot>
        <StatusBadge status='online' />
      </StatusSlot>
      <TaskSlot>
        {item.hasRunningTask ? (
          <TaskPill ramUsed={workerData?.running_task_ram_used} />
        ) : null}
      </TaskSlot>
      <MainInfoSlot>
        <MetricsGrid>
          {metrics.map(metric => (
            <InlineMetric
              key={metric.key}
              detail={metric.detail}
              icon={metric.icon}
              label={metric.label}
              percent={metric.percent}
            />
          ))}
        </MetricsGrid>
      </MainInfoSlot>
      <ChevronSlot>
        {expanded ? (
          <KeyboardArrowDownRoundedIcon />
        ) : (
          <ChevronRightRoundedIcon />
        )}
      </ChevronSlot>
    </RowButton>
  );
};
