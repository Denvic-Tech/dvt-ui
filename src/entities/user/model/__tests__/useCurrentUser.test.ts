import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { resetCurrentUserCache, useCurrentUser } from '../useCurrentUser';

const { getUserInfoMock } = vi.hoisted(() => ({
  getUserInfoMock: vi.fn(),
}));

vi.mock('@/shared/gatewayClient', () => ({
  client: {
    user: {
      info: {
        get: (...args: unknown[]) => getUserInfoMock(...args),
      },
    },
  },
}));

describe('entities/user/useCurrentUser', () => {
  it('does not leak the previous account after the cache is reset', async () => {
    getUserInfoMock.mockResolvedValueOnce({
      data: { email: 'admin@example.com', role: 'admin' },
    });

    const first = renderHook(() => useCurrentUser());
    await waitFor(() => expect(first.result.current.user?.role).toBe('admin'));
    first.unmount();

    resetCurrentUserCache();
    getUserInfoMock.mockResolvedValueOnce({
      data: { email: 'user@example.com', role: 'user' },
    });

    const second = renderHook(() => useCurrentUser());
    expect(second.result.current.user).toBeNull();
    expect(second.result.current.loading).toBe(true);

    await waitFor(() => expect(second.result.current.user?.role).toBe('user'));
  });
});
