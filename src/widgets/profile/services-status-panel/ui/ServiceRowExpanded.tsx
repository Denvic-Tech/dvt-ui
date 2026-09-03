import React from 'react';
import AppsRoundedIcon from '@mui/icons-material/AppsRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import ComputerRoundedIcon from '@mui/icons-material/ComputerRounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';

import type { SystemInfo, WorkerSystemInfo } from '@/shared/gatewayClient';

import { formatBytes, formatCount, formatDuration } from './lib/formatters.ts';
import { DetailField } from './DetailField.tsx';
import { DetailsGrid, ExpandedOnline } from './styled.ts';

interface ServiceRowExpandedProps {
  data: SystemInfo | WorkerSystemInfo;
}

export const ServiceRowExpanded: React.FC<ServiceRowExpandedProps> = ({
  data,
}) => {
  return (
    <ExpandedOnline>
      <DetailsGrid>
        <DetailField
          icon={<ComputerRoundedIcon />}
          label='Хост'
          mono
          value={data.hostname}
        />
        <DetailField
          icon={<AppsRoundedIcon />}
          label='Процессов'
          mono
          value={formatCount(data.process_count)}
        />
        <DetailField
          icon={<ScheduleRoundedIcon />}
          label='Аптайм приложения'
          mono
          value={formatDuration(data.app_uptime_seconds)}
        />
        <DetailField
          icon={<ScheduleRoundedIcon />}
          label='Аптайм системы'
          mono
          value={formatDuration(data.system_uptime_seconds)}
        />
        <DetailField
          icon={<MemoryRoundedIcon />}
          label='RAM доступно'
          mono
          value={formatBytes(data.ram_available)}
        />
        <DetailField
          icon={<StorageRoundedIcon />}
          label='Диск свободно'
          mono
          value={formatBytes(data.disk_free)}
        />
        <DetailField
          icon={<ArrowUpwardRoundedIcon />}
          label='Сеть Out'
          mono
          value={`↑ ${formatBytes(data.network_bytes_sent)}`}
        />
        <DetailField
          icon={<ArrowDownwardRoundedIcon />}
          label='Сеть In'
          mono
          value={`↓ ${formatBytes(data.network_bytes_recv)}`}
        />
      </DetailsGrid>
    </ExpandedOnline>
  );
};
