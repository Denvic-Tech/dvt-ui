import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OPERATOR_UPDATE_SESSION_KEY } from '@/entities/system-availability';

import { SystemAvailabilityGate } from './SystemAvailabilityGate';

const fakes = vi.hoisted(() => ({
  authenticated: true,
  dispatch: vi.fn(),
}));

vi.mock('@/app/providers/store/hooks', () => ({
  useAppDispatch: () => fakes.dispatch,
  useAppSelector: (selector: () => unknown) => selector(),
}));

vi.mock('@/features/profile/system-update', () => ({
  selectSystemUpdateState: () => ({ marker: null }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: fakes.authenticated }),
}));

vi.mock('@/entities/system-availability', async original => ({
  ...(await original<typeof import('@/entities/system-availability')>()),
  selectIsSystemAvailabilityBlocking: () => true,
  selectSystemAvailability: () => ({ phase: 'updating', knownUpdate: false }),
}));

vi.mock('./SystemUpdatingScreen', () => ({
  SystemUpdatingScreen: () => <p>Окно обслуживания</p>,
}));

function renderGate(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <SystemAvailabilityGate>
        <p>Защищённый журнал обновления</p>
      </SystemAvailabilityGate>
    </MemoryRouter>
  );
}

describe('SystemAvailabilityGate protected operation', () => {
  beforeEach(() => {
    fakes.authenticated = true;
    sessionStorage.clear();
  });

  it('keeps the authorized update route mounted for the pinned ID', () => {
    sessionStorage.setItem(
      OPERATOR_UPDATE_SESSION_KEY,
      '97f89dfa-1a89-4783-86a6-6d173dc4b5d4'
    );

    renderGate('/profile/update');

    expect(
      screen.getByText('Защищённый журнал обновления')
    ).toBeInTheDocument();
    expect(screen.queryByText('Окно обслуживания')).not.toBeInTheDocument();
  });

  it.each([
    ['/profile/update', false, true],
    ['/profile/update', true, false],
    ['/projects', true, true],
  ] as const)(
    'continues to block %s with auth=%s and a pinned ID=%s',
    (url, auth, pinned) => {
      fakes.authenticated = auth;
      if (pinned) {
        sessionStorage.setItem(
          OPERATOR_UPDATE_SESSION_KEY,
          '97f89dfa-1a89-4783-86a6-6d173dc4b5d4'
        );
      }

      renderGate(url);

      expect(screen.getByText('Окно обслуживания')).toBeInTheDocument();
      expect(
        screen.queryByText('Защищённый журнал обновления')
      ).not.toBeInTheDocument();
    }
  );
});
