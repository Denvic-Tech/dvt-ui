import type { SystemInfo, WorkerSystemInfo } from '@/shared/gatewayClient';

export interface ServiceRowItem {
  key: string;
  name: string;
  // Last known metrics; null when the service never answered.
  data: SystemInfo | WorkerSystemInfo | null;
  isAvailable: boolean;
  // Time of the last answer of an unavailable service, ms.
  lastResponseAt: number | null;
}
