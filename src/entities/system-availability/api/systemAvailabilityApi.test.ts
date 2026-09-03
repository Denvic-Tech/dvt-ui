import { beforeEach, describe, expect, it, vi } from 'vitest';

import { systemAvailabilityApi } from './systemAvailabilityApi';

const { stateGetMock } = vi.hoisted(() => ({
  stateGetMock: vi.fn(),
}));

vi.mock('@/shared/gatewayClient', () => ({
  client: {
    system: {
      state: { get: stateGetMock },
    },
  },
}));

describe('systemAvailabilityApi', () => {
  beforeEach(() => {
    stateGetMock.mockReset();
  });

  it('gets the system state silently', async () => {
    stateGetMock.mockResolvedValue({
      data: {
        state: 'updating',
        retry_after_sec: 3,
        checked_at: '2026-07-22T10:00:00Z',
      },
    });

    await systemAvailabilityApi.getState();

    expect(stateGetMock).toHaveBeenCalledWith(undefined, { silent: true });
  });
});
