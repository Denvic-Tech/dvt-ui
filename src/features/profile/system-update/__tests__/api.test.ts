import { beforeEach, describe, expect, it, vi } from 'vitest';

import { systemUpdateApi } from '../api';

const { runPostMock, statusGetMock } = vi.hoisted(() => ({
  runPostMock: vi.fn(),
  statusGetMock: vi.fn(),
}));

vi.mock('@/shared/gatewayClient', () => ({
  client: {
    update: {
      run: { post: runPostMock },
      status: { get: statusGetMock },
    },
  },
}));

describe('systemUpdateApi', () => {
  beforeEach(() => {
    runPostMock.mockReset();
    statusGetMock.mockReset();
  });

  it('starts an update with the selected version', async () => {
    runPostMock.mockResolvedValue({
      data: {
        success: true,
        message: 'Update started',
        version: '1.20.0',
        job_id: 'job-1',
      },
    });

    await expect(systemUpdateApi.run('1.20.0')).resolves.toMatchObject({
      job_id: 'job-1',
    });
    expect(runPostMock).toHaveBeenCalledWith({
      body: { version: '1.20.0' },
    });
  });

  it('polls status incrementally and silently', async () => {
    statusGetMock.mockResolvedValue({
      data: {
        id: 'job-1',
        kind: 'update',
        state: 'running',
        started_at: '2026-07-21T10:00:00Z',
        steps: [],
        log: [],
        log_total: 12,
      },
    });

    await systemUpdateApi.getStatus(12);

    expect(statusGetMock).toHaveBeenCalledWith(
      { query: { log_offset: 12 } },
      { silent: true }
    );
  });
});
