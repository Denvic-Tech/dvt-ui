import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProfileSidebar } from '@/widgets/profile/user-pofile-sidebar';

import type { UserReadSchema } from '@/shared/gatewayClient';

const { logoutMock } = vi.hoisted(() => ({
  logoutMock: vi.fn(),
}));

vi.mock('@/contexts/AuthContext.tsx', () => ({
  useAuth: () => ({
    logout: logoutMock,
  }),
}));

vi.mock('@/entities/config/app-settings', () => ({
  useAppSettings: () => ({
    namespaces: [
      {
        id: 'runtime',
        label: 'Runtime',
      },
      {
        id: 'dcc',
        label: 'Dcc',
      },
    ],
    definitionsStatus: 'succeeded',
    loadDefinitions: vi.fn(),
  }),
}));

const createUser = (role: UserReadSchema['role']): UserReadSchema => ({
  email: 'user@example.com',
  organization_id: 'org-1',
  ...(role == null ? {} : { role }),
  user_name: 'Example User',
});

const renderSidebar = (role: UserReadSchema['role']) => {
  return render(
    <MemoryRouter initialEntries={['/profile/preferences']}>
      <ProfileSidebar user={createUser(role)} />
    </MemoryRouter>
  );
};

describe('widgets/user-pofile-sidebar', () => {
  beforeEach(() => {
    logoutMock.mockReset();
  });

  it('renders only public profile sections for regular users', () => {
    renderSidebar('user');

    expect(screen.getByText('Основное')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
    expect(screen.getByText('API Keys')).toBeInTheDocument();
    expect(screen.queryByText('Система')).not.toBeInTheDocument();
    expect(screen.queryByText('Schedule Projects')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
    expect(screen.queryByText('Organizations')).not.toBeInTheDocument();
    expect(screen.queryByText('Services Stats Panel')).not.toBeInTheDocument();
    expect(screen.queryByText('Настройки')).not.toBeInTheDocument();
    expect(screen.queryByText('Runtime')).not.toBeInTheDocument();
    expect(screen.queryByText('Extensions')).not.toBeInTheDocument();
    expect(screen.queryByText('Обновление')).not.toBeInTheDocument();
  });

  it('renders only admin-level sections for admin users', () => {
    renderSidebar('admin');

    expect(screen.getByText('Schedule Projects')).toBeInTheDocument();
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.queryByText('Organizations')).not.toBeInTheDocument();
    expect(screen.queryByText('Services Stats Panel')).not.toBeInTheDocument();
    expect(screen.queryByText('Настройки')).not.toBeInTheDocument();
    expect(screen.queryByText('Обновление')).not.toBeInTheDocument();
  });

  it('renders superadmin-only sections for superadmin users', () => {
    renderSidebar('superadmin');

    expect(screen.getByText('Администрирование')).toBeInTheDocument();
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByText('Organizations')).toBeInTheDocument();
    expect(screen.getByText('Services Stats Panel')).toBeInTheDocument();
    expect(screen.getByText('Настройки')).toBeInTheDocument();
    expect(screen.getByText('Runtime')).toBeInTheDocument();
    expect(screen.getByText('DCC')).toBeInTheDocument();
    expect(screen.getByText('Обновление')).toBeInTheDocument();
  });
});
