import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/shared/lib/errors';

import {
  SYSTEM_UPDATE_MARKER_SCHEMA_VERSION,
  type SystemUpdateState,
} from '../model/types';

import { SystemUpdateOverlayHost } from './SystemUpdateOverlayHost';

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  getStatus: vi.fn(),
  isAuthenticated: true,
  reloadCurrentUser: vi.fn(),
  state: null as unknown,
  user: {
    email: 'superadmin@example.com',
    organization_id: 'org-1',
    role: 'superadmin',
  },
}));

vi.mock('@/app/providers/store/hooks', () => ({
  useAppDispatch: () => mocks.dispatch,
  useAppSelector: () => mocks.state,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mocks.isAuthenticated }),
}));

vi.mock('@/entities/user', () => ({
  normalizeRole: (role: string | null | undefined) => role ?? null,
  useCurrentUser: () => ({
    user: mocks.user,
    loading: false,
    reload: mocks.reloadCurrentUser,
  }),
}));

vi.mock('../api', () => ({
  systemUpdateApi: {
    getStatus: mocks.getStatus,
  },
}));

vi.mock('./SystemUpdateProgressDialog', () => ({
  SystemUpdateProgressDialog: () => <div data-testid='update-dialog' />,
}));

const makeState = (phase: SystemUpdateState['phase']): SystemUpdateState => ({
  hydrated: true,
  phase,
  marker: {
    schemaVersion: SYSTEM_UPDATE_MARKER_SCHEMA_VERSION,
    jobId: 'job-1',
    ownerKey: 'superadmin@example.com',
    targetVersion: 'latest',
    launchedAt: 100,
    paused: false,
    outageStartedAt: null,
  },
  snapshot: null,
  logs: ['line 1'],
  logOffset: 1,
  reconnectTimedOut: false,
  error: null,
});

describe('SystemUpdateOverlayHost authentication recovery', () => {
  beforeEach(() => {
    mocks.dispatch.mockReset();
    mocks.getStatus.mockReset();
    mocks.reloadCurrentUser.mockReset();
    mocks.isAuthenticated = true;
    mocks.user = {
      email: 'superadmin@example.com',
      organization_id: 'org-1',
      role: 'superadmin',
    };
    mocks.state = makeState('running');
  });

  it('waits for renewed authentication after a status 401', async () => {
    mocks.getStatus.mockRejectedValue(
      new ApiError({
        code: 'HTTP_401',
        message: 'Unauthorized',
        status: 401,
      })
    );

    render(<SystemUpdateOverlayHost />);

    await waitFor(() =>
      expect(mocks.dispatch).toHaveBeenCalledWith({
        type: 'systemUpdate/systemUpdateAuthenticationRequired',
      })
    );
  });

  it('restores monitoring after the same superadmin signs in', async () => {
    mocks.state = makeState('awaiting_auth');
    mocks.reloadCurrentUser.mockResolvedValue(mocks.user);

    render(<SystemUpdateOverlayHost />);

    await waitFor(() =>
      expect(mocks.dispatch).toHaveBeenCalledWith({
        type: 'systemUpdate/systemUpdateAuthenticationRestored',
      })
    );
    expect(mocks.getStatus).not.toHaveBeenCalled();
  });
});
