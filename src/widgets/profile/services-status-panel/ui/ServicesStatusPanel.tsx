import React, { useEffect, useMemo, useState } from 'react';
import { IconActivity, IconRefresh } from '@tabler/icons-react';

import { useServicesStatus } from '@/features/profile/services-status';

import type { ServicesStatus } from '@/shared/gatewayClient';
import { useDelayedLoading } from '@/shared/lib/hooks/useDelayedLoading';
import { PageLayout } from '@/shared/ui/page-layout';
import { Alert } from '@/shared/ui/primitives';
import { TokenListMessage } from '@/shared/ui/token-list';

import { getElapsedSeconds } from './lib/formatters.ts';
import { normalizeTimestamp } from './lib/normalizeTimestamp.ts';
import { ServiceRow, ServiceRowSkeleton } from './ServiceRow.tsx';
import {
  RefreshButton,
  ServicesBox,
  ServicesStack,
  ShowAllButton,
  UpdatedText,
} from './styles.ts';
import type { ServiceRowItem } from './types.ts';

const REFRESH_INTERVAL_MS = 5000;
const WORKERS_LIMIT = 8;
const WORKER_TYPE_NAME = 'Воркер задач';

const SERVICE_SKELETON_ROWS = [{ nameWidth: 72 }, { nameWidth: 136 }];
const WORKER_SKELETON_ROWS = [
  { nameWidth: 120 },
  { nameWidth: 112 },
  { nameWidth: 124 },
];

const getServiceItems = (status: ServicesStatus): ServiceRowItem[] => [
  {
    key: 'gateway',
    name: 'Gateway',
    data: status.gateway,
    isAvailable: true,
    lastResponseAt: null,
  },
  {
    key: 'project_scheduler',
    name: 'Планировщик задач',
    data: status.project_scheduler,
    isAvailable: Boolean(status.project_scheduler),
    lastResponseAt: null,
  },
];

// Unavailable instances first, then the busiest ones. The number keeps the
// position in the response, so it does not change when the order does.
const getWorkerItems = (status: ServicesStatus): ServiceRowItem[] =>
  (status.task_workers ?? [])
    .map((worker, index) => ({
      key: worker.worker_id || `task_worker_${index}`,
      name: `${WORKER_TYPE_NAME} #${index + 1}`,
      data: worker,
      isAvailable: worker.status !== 'offline',
      lastResponseAt: normalizeTimestamp(
        worker.last_heartbeat_received_at ?? worker.last_heartbeat_at
      ),
    }))
    .sort(
      (left, right) =>
        Number(left.isAvailable) - Number(right.isAvailable) ||
        right.data.cpu_percent - left.data.cpu_percent
    );

const formatUpdatedAgo = (seconds: number) => {
  if (seconds < 60) {
    return `${seconds} с`;
  }

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} мин`;
  }

  return `${Math.floor(seconds / 3600)} ч`;
};

const useNow = (intervalMs: number) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(intervalId);
  }, [intervalMs]);

  return now;
};

export const ServicesStatusPanel: React.FC = () => {
  const { servicesStatus, isLoading, error, updatedAt, loadServicesStatus } =
    useServicesStatus();
  const [showAllWorkers, setShowAllWorkers] = useState(false);
  const now = useNow(1000);

  const refresh = React.useCallback(() => {
    loadServicesStatus().catch(() => {});
  }, [loadServicesStatus]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!isLoading) {
        refresh();
      }
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [isLoading, refresh]);

  const serviceItems = useMemo(
    () => (servicesStatus ? getServiceItems(servicesStatus) : []),
    [servicesStatus]
  );
  const workerItems = useMemo(
    () => (servicesStatus ? getWorkerItems(servicesStatus) : []),
    [servicesStatus]
  );
  const visibleWorkers = showAllWorkers
    ? workerItems
    : workerItems.slice(0, WORKERS_LIMIT);

  const isFirstLoading = !servicesStatus && !error;
  const showSkeleton = useDelayedLoading(isFirstLoading);

  return (
    <PageLayout
      width='default'
      title='Services Stats Panel'
      icon={IconActivity}
      headerActions={
        <>
          {updatedAt ? (
            <UpdatedText>
              Обновлено {formatUpdatedAgo(getElapsedSeconds(updatedAt, now))}{' '}
              назад
            </UpdatedText>
          ) : null}
          <RefreshButton
            aria-label='Обновить'
            title='Обновить'
            disableRipple
            onClick={() => {
              if (!isLoading) {
                refresh();
              }
            }}
          >
            <IconRefresh size={15} stroke={1.5} />
          </RefreshButton>
        </>
      }
    >
      <ServicesStack>
        {error ? <Alert variant='destructive'>{error.message}</Alert> : null}

        {servicesStatus ? (
          <>
            <ServicesBox aria-label='Сервисы'>
              {serviceItems.map(item => (
                <ServiceRow key={item.key} item={item} now={now} />
              ))}
            </ServicesBox>

            <ServicesBox aria-label={WORKER_TYPE_NAME}>
              {workerItems.length === 0 ? (
                <TokenListMessage>
                  Активные воркеры сейчас не обнаружены.
                </TokenListMessage>
              ) : (
                visibleWorkers.map(item => (
                  <ServiceRow key={item.key} item={item} now={now} />
                ))
              )}
              {workerItems.length > WORKERS_LIMIT ? (
                <ShowAllButton
                  disableRipple
                  onClick={() => setShowAllWorkers(prev => !prev)}
                >
                  {showAllWorkers
                    ? 'Свернуть'
                    : `Показать все ${workerItems.length}`}
                </ShowAllButton>
              ) : null}
            </ServicesBox>
          </>
        ) : showSkeleton ? (
          <>
            <ServicesBox aria-hidden>
              {SERVICE_SKELETON_ROWS.map(row => (
                <ServiceRowSkeleton key={row.nameWidth} {...row} />
              ))}
            </ServicesBox>
            <ServicesBox aria-hidden>
              {WORKER_SKELETON_ROWS.map(row => (
                <ServiceRowSkeleton key={row.nameWidth} {...row} />
              ))}
            </ServicesBox>
          </>
        ) : null}
      </ServicesStack>
    </PageLayout>
  );
};
