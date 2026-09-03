import type {
  SystemInfo,
  WorkerStatus,
  WorkerSystemInfo,
} from '@/shared/gatewayClient';

export type ServiceStatusRowStatus = 'online' | 'offline';

export interface ServiceStatusRowItem {
  key: string;
  title: string;
  data: SystemInfo | WorkerSystemInfo | null;
  hasRunningTask: boolean;
  isWorker: boolean;
  offlineSince?: number | null | undefined;
  status: ServiceStatusRowStatus;
  workerStatus?: WorkerStatus | undefined;
}

export const isWorkerSystemInfo = (
  value: SystemInfo | WorkerSystemInfo | null
): value is WorkerSystemInfo => {
  return Boolean(value && 'has_running_task' in value);
};
