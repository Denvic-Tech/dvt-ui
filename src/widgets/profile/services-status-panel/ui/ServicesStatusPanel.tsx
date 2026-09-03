import React, { useEffect, useMemo, useState } from 'react';
import DnsRoundedIcon from '@mui/icons-material/DnsRounded';
import PrecisionManufacturingRoundedIcon from '@mui/icons-material/PrecisionManufacturingRounded';
import { Box } from '@mui/material';

import { useBuildVersion } from '@/features/profile/build-version-info';
import { useServicesStatus } from '@/features/profile/services-status';

import { Alert, Spinner } from '@/shared/ui';

import { sortByStatus } from './lib/sortByStatus.ts';
import { ServicesStatusHeader } from './ServicesStatusHeader.tsx';
import { ServicesStatusSection } from './ServicesStatusSection.tsx';
import {
  LoadingState,
  PanelCard,
  PanelInner,
  SectionsStack,
} from './styled.ts';
import type { ServiceStatusRowItem } from './types.ts';

export const ServicesStatusPanel: React.FC = () => {
  const { versionInfo, loadBuildVersion } = useBuildVersion();
  const { servicesStatus, isLoading, error, loadServicesStatus } =
    useServicesStatus();
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  useEffect(() => {
    void loadBuildVersion();
    void loadServicesStatus();
  }, [loadBuildVersion, loadServicesStatus]);

  useEffect(() => {
    if (!autoRefreshEnabled) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      if (!isLoading) {
        void loadServicesStatus();
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [autoRefreshEnabled, isLoading, loadServicesStatus]);

  const serviceItems = useMemo<ServiceStatusRowItem[]>(() => {
    if (!servicesStatus) return [];

    const items: ServiceStatusRowItem[] = [
      {
        key: 'gateway',
        title: 'Gateway',
        data: servicesStatus.gateway,
        hasRunningTask: false,
        isWorker: false,
        status: 'online',
      },
      {
        key: 'project_scheduler',
        title: 'Планировщик задач',
        data: servicesStatus.project_scheduler,
        hasRunningTask: false,
        isWorker: false,
        status: servicesStatus.project_scheduler ? 'online' : 'offline',
      },
    ];

    return sortByStatus<ServiceStatusRowItem>(items);
  }, [servicesStatus]);

  const workerItems = useMemo<ServiceStatusRowItem[]>(() => {
    if (!servicesStatus?.task_workers?.length) return [];

    return sortByStatus<ServiceStatusRowItem>(
      servicesStatus.task_workers.map((worker, index, array) => ({
        key: `task_worker_${index}`,
        title: array.length > 1 ? `Воркер задач #${index + 1}` : 'Воркер задач',
        data: worker,
        hasRunningTask: worker.has_running_task === true,
        isWorker: true,
        offlineSince: worker.offline_since,
        status: worker.status === 'offline' ? 'offline' : 'online',
        workerStatus: worker.status,
      }))
    );
  }, [servicesStatus]);

  return (
    <PanelCard>
      <PanelInner>
        <ServicesStatusHeader
          autoRefreshEnabled={autoRefreshEnabled}
          isLoading={isLoading}
          onRefresh={() => void loadServicesStatus()}
          onToggleAutoRefresh={() => setAutoRefreshEnabled(prev => !prev)}
          version={versionInfo?.version ?? null}
        />

        {error ? <Alert variant='destructive'>{error.message}</Alert> : null}

        {isLoading && !servicesStatus ? (
          <LoadingState>
            <Spinner />
            <Box>Загружаем данные о сервисах...</Box>
          </LoadingState>
        ) : (
          <SectionsStack>
            <ServicesStatusSection
              emptyText='Нет данных по внутренним сервисам.'
              icon={<DnsRoundedIcon />}
              items={serviceItems}
              title='Сервисы'
            />
            <ServicesStatusSection
              emptyText='Активные воркеры сейчас не обнаружены.'
              icon={<PrecisionManufacturingRoundedIcon />}
              items={workerItems}
              title='Воркеры'
            />
          </SectionsStack>
        )}
      </PanelInner>
    </PanelCard>
  );
};
