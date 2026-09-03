import type { TaskExecutionStatus } from '@/shared/gatewayClient';

interface ShouldCaptureLiveErrorTaskArgs {
  isFirstRender: boolean;
  previousStatus: TaskExecutionStatus | 'IDLE' | null;
  previousTaskId: string | null;
  nextStatus: TaskExecutionStatus | 'IDLE';
  nextTaskId: string | null;
}

export const shouldCaptureLiveErrorTask = ({
  isFirstRender,
  previousStatus,
  previousTaskId,
  nextStatus,
  nextTaskId,
}: ShouldCaptureLiveErrorTaskArgs) => {
  if (isFirstRender || nextStatus !== 'ERROR' || !nextTaskId) {
    return false;
  }

  return previousStatus !== nextStatus || previousTaskId !== nextTaskId;
};

interface ShouldResetLiveErrorTaskArgs {
  liveErrorTaskId: string | null;
  nextStatus: TaskExecutionStatus | 'IDLE';
  nextTaskId: string | null;
}

export const shouldResetLiveErrorTask = ({
  liveErrorTaskId,
  nextStatus,
  nextTaskId,
}: ShouldResetLiveErrorTaskArgs) => {
  if (!liveErrorTaskId) {
    return false;
  }

  if (nextStatus === 'ERROR' && nextTaskId === liveErrorTaskId) {
    return false;
  }

  return true;
};
