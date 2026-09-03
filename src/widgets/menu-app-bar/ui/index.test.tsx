import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { MenuAppBar } from './index.tsx';

const mockState = {
  projects: {
    selectedProject: {
      id: 'project-1',
      name: 'Test Project',
    },
    projects: [
      {
        id: 'project-1',
        name: 'Test Project',
      },
    ],
  },
  alerts: {
    history: [],
    notificationsById: {},
  },
};

vi.mock('@/app/providers/store', () => ({
  useAppSelector: (selector: (state: typeof mockState) => unknown) =>
    selector(mockState),
}));

vi.mock('@/entities/project/task-execution-status', () => ({
  useTaskExecutionStatus: () => ({
    status: 'IDLE',
    error: null,
  }),
}));

vi.mock('@/features/profile/build-version-info', () => ({
  useBuildVersion: () => ({
    versionInfo: { version: 'v1.19.0rc5' },
    isLoading: false,
    loadBuildVersion: vi.fn(),
  }),
}));

vi.mock('@/app/notifications', () => ({
  NotificationCenter: () => null,
}));

describe('app/ui/common/Header', () => {
  it('renders brand version, projects breadcrumb and profile avatar', () => {
    render(
      <MemoryRouter initialEntries={['/project-editor/project-1']}>
        <MenuAppBar />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('button', { name: 'На главную' })
    ).toBeInTheDocument();
    expect(screen.getByText('v1.19.0rc5')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute(
      'href',
      '/profile'
    );
    expect(screen.getByRole('link', { name: /проекты/i })).toHaveAttribute(
      'href',
      '/projects'
    );
  });

  it('does not render on home route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <MenuAppBar />
      </MemoryRouter>
    );

    expect(
      screen.queryByRole('button', { name: 'На главную' })
    ).not.toBeInTheDocument();
  });
});
