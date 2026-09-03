import { describe, expect, it } from 'vitest';

import type { TaskExecutionStatus } from '@/shared/gatewayClient';

import { shouldCaptureLiveErrorTask, shouldResetLiveErrorTask } from './lib';

describe('shouldCaptureLiveErrorTask', () => {
  it('ignores stale error state on first render', () => {
    expect(
      shouldCaptureLiveErrorTask({
        isFirstRender: true,
        previousStatus: 'ERROR' satisfies TaskExecutionStatus,
        previousTaskId: 'task-1',
        nextStatus: 'ERROR',
        nextTaskId: 'task-1',
      })
    ).toBe(false);
  });

  it('captures a new error task after websocket status changes', () => {
    expect(
      shouldCaptureLiveErrorTask({
        isFirstRender: false,
        previousStatus: 'RUNNING',
        previousTaskId: 'task-1',
        nextStatus: 'ERROR',
        nextTaskId: 'task-1',
      })
    ).toBe(true);
  });
});

describe('shouldResetLiveErrorTask', () => {
  it('keeps the banner for the same error task while status stays ERROR', () => {
    expect(
      shouldResetLiveErrorTask({
        liveErrorTaskId: 'task-1',
        nextStatus: 'ERROR',
        nextTaskId: 'task-1',
      })
    ).toBe(false);
  });

  it('resets the banner after a new full run starts', () => {
    expect(
      shouldResetLiveErrorTask({
        liveErrorTaskId: 'task-1',
        nextStatus: 'RUNNING',
        nextTaskId: 'task-2',
      })
    ).toBe(true);
  });
});
