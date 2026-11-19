import { act, cleanup, render, screen } from '@testing-library/react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '../AuthContext';

const mocks = vi.hoisted(() => ({
  showNotification: vi.fn(),
  resetCurrentUserCache: vi.fn(),
  checkAuth: vi.fn(async () => ({ data: { success: false } })),
}));

vi.mock('@/app/notifications', () => ({
  useAlert: () => ({ showNotification: mocks.showNotification }),
}));

vi.mock('@/entities/user', () => ({
  resetCurrentUserCache: mocks.resetCurrentUserCache,
}));

vi.mock('@/shared/gatewayClient', () => ({
  client: { auth: { checkAuth: { post: mocks.checkAuth } } },
}));

function LocationProbe() {
  const location = useLocation();
  return <div>{location.pathname}</div>;
}

async function signalUnauthorized(path: string) {
  window.history.replaceState(null, '', path);
  await act(async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LocationProbe />
        </AuthProvider>
      </BrowserRouter>
    );
  });
  await act(async () => {
    window.dispatchEvent(
      new CustomEvent('authStateChange', {
        detail: { reason: 'unauthorized', status: 401, showNotification: true },
      })
    );
  });
}

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.clearAllMocks();
});

describe('AuthProvider unauthorized navigation', () => {
  it('keeps the setup route and its pairing fragment', async () => {
    await signalUnauthorized('/setup#operation=sample&pairing=sample');

    expect(screen.getByText('/setup')).toBeInTheDocument();
    expect(window.location.hash).toBe('#operation=sample&pairing=sample');
    expect(mocks.showNotification).not.toHaveBeenCalled();
  });

  it('redirects from a private route and keeps its return URL', async () => {
    await signalUnauthorized('/projects?view=list');

    expect(screen.getByText('/sign_in')).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get('returnUrl')).toBe(
      '/projects?view=list'
    );
  });
});
