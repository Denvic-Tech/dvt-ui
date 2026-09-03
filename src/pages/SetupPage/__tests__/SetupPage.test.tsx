import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RequestStatus, SetupStatus, SetupStep } from '@/app/setup';

import SetupPage from '..';

const {
  navigateMock,
  loadSetupStatusMock,
  submitSetupStepMock,
  setupStateRef,
  authStateRef,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  loadSetupStatusMock: vi.fn(),
  submitSetupStepMock: vi.fn(),
  setupStateRef: {
    current: null as MockUseSetupState | null,
  },
  authStateRef: {
    current: {
      isAuthenticated: false,
    },
  },
}));

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom'
    );

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authStateRef.current,
}));

vi.mock('@/app/setup', async () => {
  const actual =
    await vi.importActual<typeof import('@/app/setup')>('@/app/setup');

  return {
    ...actual,
    useSetup: () => setupStateRef.current,
  };
});

type MockUseSetupState = {
  status: SetupStatus | null;
  steps: SetupStep[];
  isInitialized: boolean;
  loadStatus: RequestStatus;
  loadError: { message: string } | null;
  loadSetupStatus: typeof loadSetupStatusMock;
  submitSetupStep: typeof submitSetupStepMock;
  getSubmitStatus: (code: string) => RequestStatus;
  getSubmitError: (code: string) => { message: string } | null;
};

const createUseSetupState = (
  overrides?: Partial<MockUseSetupState>
): MockUseSetupState => {
  const status = overrides?.status ?? {
    initialized: false,
    steps: [],
  };

  return {
    status,
    steps: overrides?.steps ?? status.steps ?? [],
    isInitialized: overrides?.isInitialized ?? status.initialized ?? false,
    loadStatus: overrides?.loadStatus ?? 'succeeded',
    loadError: overrides?.loadError ?? null,
    loadSetupStatus: overrides?.loadSetupStatus ?? loadSetupStatusMock,
    submitSetupStep: overrides?.submitSetupStep ?? submitSetupStepMock,
    getSubmitStatus: overrides?.getSubmitStatus ?? (() => 'idle'),
    getSubmitError: overrides?.getSubmitError ?? (() => null),
  };
};

describe('pages/SetupPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    loadSetupStatusMock.mockReset();
    loadSetupStatusMock.mockResolvedValue(undefined);
    submitSetupStepMock.mockReset();
    submitSetupStepMock.mockResolvedValue(undefined);
    authStateRef.current = {
      isAuthenticated: false,
    };
  });

  it('renders completed and pending steps from backend metadata and submits by code', async () => {
    setupStateRef.current = createUseSetupState({
      status: {
        initialized: false,
        steps: [
          {
            code: 'organization',
            title: 'Create organization',
            description: 'Provide organization name.',
            submit_label: 'Create organization',
            completed: true,
            fields: [],
          },
          {
            code: 'app_settings',
            title: 'Bootstrap AppSettings',
            description: 'Provide DCC URL.',
            submit_label: 'Save settings',
            completed: false,
            fields: [
              {
                key: 'dcc.url',
                label: 'DCC URL',
                type: 'text',
                required: true,
                nullable: true,
                value: 'https://dcc.example.test',
              },
            ],
          },
        ],
      },
    });

    render(<SetupPage />);

    await waitFor(() => {
      expect(loadSetupStatusMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Bootstrap AppSettings')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('https://dcc.example.test')
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: /dcc url/i }), {
      target: {
        value: 'https://dcc2.example.test',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));

    await waitFor(() => {
      expect(submitSetupStepMock).toHaveBeenCalledWith('app_settings', {
        'dcc.url': 'https://dcc2.example.test',
      });
      expect(loadSetupStatusMock).toHaveBeenCalledTimes(2);
    });
  });

  it('redirects to sign-in when setup is initialized and user is logged out', async () => {
    setupStateRef.current = createUseSetupState({
      status: {
        initialized: true,
        steps: [],
      },
      isInitialized: true,
    });

    render(<SetupPage />);

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/sign_in', {
        replace: true,
      });
    });
  });
});
