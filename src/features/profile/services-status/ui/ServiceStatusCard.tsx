import React, { useMemo, useState } from 'react';
import { Collapse } from '@mui/material';
import AppsRoundedIcon from '@mui/icons-material/AppsRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ComputerRoundedIcon from '@mui/icons-material/ComputerRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';

import type { SystemInfo, WorkerSystemInfo } from '@/shared/gatewayClient';

import {
  CardHeader,
  CardTitle,
  CardTitleGroup,
  DetailContent,
  DetailIcon,
  DetailLabel,
  DetailRow,
  DetailValue,
  DetailsGrid,
  DetailsPanel,
  DetailsToggle,
  ServiceCard,
  StatCard,
  StatDetail,
  StatHeader,
  StatIcon,
  StatLabel,
  StatProgressBar,
  StatProgressFill,
  StatsGrid,
  StatusBadge,
  StatValue,
  TaskBadge,
  TaskBadgeDot,
  TaskBlock,
  TaskBlockHeader,
  TaskBlockIcon,
  TaskBlockLeft,
  TaskBlockPercent,
  TaskBlockRight,
  TaskBlockTitle,
  TaskBlockValue,
  TaskProgressBar,
  TaskProgressFill,
  UnavailableDescription,
  UnavailableState,
  UnavailableTitle,
} from './styles';

export interface ServiceStatusCardProps {
  title: string;
  data: SystemInfo | WorkerSystemInfo | null;
  isWorker?: boolean;
}

const formatBytes = (value?: number | null): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  if (value === 0) return '0 Б';

  const units = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
  let current = value;
  let unitIndex = 0;

  while (current >= 1024 && unitIndex < units.length - 1) {
    current /= 1024;
    unitIndex += 1;
  }

  return `${parseFloat(current.toFixed(1))} ${units[unitIndex]}`;
};

const formatDuration = (seconds?: number): string => {
  if (seconds === undefined || seconds === null || Number.isNaN(seconds)) {
    return '—';
  }

  const value = Math.max(seconds, 0);
  const days = Math.floor(value / 86400);
  const hours = Math.floor((value % 86400) / 3600);
  const minutes = Math.floor((value % 3600) / 60);

  if (days > 0) return `${days}д ${hours}ч`;
  if (hours > 0) return `${hours}ч ${minutes}м`;
  return `${minutes}м ${Math.floor(value % 60)}с`;
};

const isWorkerSystemInfo = (
  value: SystemInfo | WorkerSystemInfo | null
): value is WorkerSystemInfo => {
  return Boolean(value && 'has_running_task' in value);
};

const renderStatusCard = (
  icon: React.ReactNode,
  label: string,
  percent: number,
  detail: string
) => (
  <StatCard>
    <StatHeader>
      <StatIcon>{icon}</StatIcon>
      <StatLabel>{label}</StatLabel>
    </StatHeader>
    <StatValue>{percent.toFixed(1)}%</StatValue>
    <StatProgressBar>
      <StatProgressFill percent={percent} />
    </StatProgressBar>
    <StatDetail>{detail}</StatDetail>
  </StatCard>
);

export const ServiceStatusCard: React.FC<ServiceStatusCardProps> = ({
  title,
  data,
  isWorker = false,
}) => {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const workerData = isWorkerSystemInfo(data) ? data : null;
  const hasRunningTask = Boolean(
    isWorker && workerData?.has_running_task === true
  );

  const detailRows = useMemo(() => {
    if (!data) return [];

    return [
      {
        label: 'Хост',
        value: data.hostname,
        icon: <ComputerRoundedIcon />,
      },
      {
        label: 'Процессов',
        value: data.process_count.toLocaleString('ru-RU'),
        icon: <AppsRoundedIcon />,
      },
      {
        label: 'Аптайм приложения',
        value: formatDuration(data.app_uptime_seconds),
        icon: <ScheduleRoundedIcon />,
      },
      {
        label: 'Аптайм системы',
        value: formatDuration(data.system_uptime_seconds),
        icon: <ScheduleRoundedIcon />,
      },
      {
        label: 'RAM доступно',
        value: formatBytes(data.ram_available),
        icon: <MemoryRoundedIcon />,
      },
      {
        label: 'Диск свободно',
        value: formatBytes(data.disk_free),
        icon: <StorageRoundedIcon />,
      },
      {
        label: 'Сеть (Исходящая)',
        value: `↑ ${formatBytes(data.network_bytes_sent)}`,
        icon: <ArrowUpwardRoundedIcon />,
      },
      {
        label: 'Сеть (Входящая)',
        value: `↓ ${formatBytes(data.network_bytes_recv)}`,
        icon: <ArrowDownwardRoundedIcon />,
      },
    ];
  }, [data]);

  return (
    <ServiceCard>
      <CardHeader>
        <CardTitleGroup>
          <CardTitle>{title}</CardTitle>
          {hasRunningTask ? (
            <TaskBadge>
              <TaskBadgeDot />
              Задача
            </TaskBadge>
          ) : null}
        </CardTitleGroup>

        <StatusBadge status={data ? 'running' : 'stopped'}>
          {data ? <CheckRoundedIcon /> : null}
          {data ? 'Работает' : 'Нет данных'}
        </StatusBadge>
      </CardHeader>

      {data ? (
        <>
          <StatsGrid>
            {renderStatusCard(
              <SpeedRoundedIcon />,
              'CPU',
              data.cpu_percent,
              `${data.cpu_cores_physical}/${data.cpu_cores_logical} ядер`
            )}
            {renderStatusCard(
              <MemoryRoundedIcon />,
              'RAM',
              data.ram_used_percent,
              `${formatBytes(data.ram_used)} / ${formatBytes(data.ram_total)}`
            )}
            {renderStatusCard(
              <StorageRoundedIcon />,
              'Диск',
              data.disk_used_percent,
              `${formatBytes(data.disk_used)} / ${formatBytes(data.disk_total)}`
            )}
          </StatsGrid>

          {hasRunningTask ? (
            <TaskBlock>
              <TaskBlockHeader>
                <TaskBlockLeft>
                  <TaskBlockIcon>
                    <PlayArrowRoundedIcon />
                  </TaskBlockIcon>
                  <TaskBlockTitle>Выполняется задача</TaskBlockTitle>
                </TaskBlockLeft>

                <TaskBlockRight>
                  <TaskBlockValue>
                    {formatBytes(workerData?.running_task_ram_used ?? 0)}
                  </TaskBlockValue>
                  <TaskBlockPercent>
                    {(workerData?.running_task_ram_used_percent ?? 0).toFixed(
                      1
                    )}
                    % от RAM
                  </TaskBlockPercent>
                </TaskBlockRight>
              </TaskBlockHeader>

              <TaskProgressBar>
                <TaskProgressFill
                  percent={workerData?.running_task_ram_used_percent ?? 0}
                />
              </TaskProgressBar>
            </TaskBlock>
          ) : null}

          <DetailsToggle
            type='button'
            onClick={() => setDetailsOpen(prev => !prev)}
            aria-expanded={detailsOpen}
          >
            {detailsOpen ? 'Скрыть детали' : 'Показать детали'}
            <KeyboardArrowDownRoundedIcon
              sx={{
                transform: detailsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </DetailsToggle>

          <Collapse in={detailsOpen} timeout='auto' unmountOnExit>
            <DetailsPanel>
              <DetailsGrid>
                {detailRows.map(item => (
                  <DetailRow key={item.label}>
                    <DetailIcon>{item.icon}</DetailIcon>
                    <DetailContent>
                      <DetailLabel>{item.label}</DetailLabel>
                      <DetailValue title={item.value}>{item.value}</DetailValue>
                    </DetailContent>
                  </DetailRow>
                ))}
              </DetailsGrid>
            </DetailsPanel>
          </Collapse>
        </>
      ) : (
        <UnavailableState>
          <UnavailableTitle>Сервис недоступен</UnavailableTitle>
          <UnavailableDescription>
            Сейчас нет телеметрии от этого компонента.
          </UnavailableDescription>
        </UnavailableState>
      )}
    </ServiceCard>
  );
};
