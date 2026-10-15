import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProjectReadSchema, UserReadSchema } from '@/shared/gatewayClient';

import { HomeDashboard } from './HomeDashboard';

const {
  createNewProjectMock,
  getProjectSchedulesMock,
  getRecentProjectsMock,
  navigateMock,
  registerSectionUseMock,
  searchProjectsMock,
  getFavoriteProjectsMock,
  setProjectFavoriteMock,
  showAlertMock,
  useBuildVersionMock,
  useCurrentUserMock,
} = vi.hoisted(() => ({
  createNewProjectMock: vi.fn(),
  getProjectSchedulesMock: vi.fn(),
  getRecentProjectsMock: vi.fn(),
  navigateMock: vi.fn(),
  registerSectionUseMock: vi.fn(),
  searchProjectsMock: vi.fn(),
  getFavoriteProjectsMock: vi.fn(),
  setProjectFavoriteMock: vi.fn(),
  showAlertMock: vi.fn(),
  useBuildVersionMock: vi.fn(),
  useCurrentUserMock: vi.fn(),
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

vi.mock('@/app/notifications', () => ({
  useAlert: () => ({ showAlert: showAlertMock }),
}));

vi.mock('@/features/profile/build-version-info', () => ({
  useBuildVersion: () => useBuildVersionMock(),
}));

vi.mock('@/entities/user', () => ({
  normalizeRole: (role: string | null | undefined) =>
    role === 'superadmin' || role === 'admin' || role === 'user' ? role : null,
  useCurrentUser: () => useCurrentUserMock(),
}));

vi.mock('@/entities/ui-preferences', () => ({
  useHomeSectionUsesPreference: () => ({
    registerSectionUse: registerSectionUseMock,
    resetSectionUses: vi.fn(),
    sectionUses: {},
  }),
}));

vi.mock('./home-widgets/HomeWidgetsSection', () => ({
  HomeWidgetsSection: () => null,
}));

vi.mock('@/entities/project/projects', () => ({
  CreateProjectModal: ({ open }: { open: boolean }) =>
    open ? <div>create project modal</div> : null,
  useProjects: () => ({ createNewProject: createNewProjectMock }),
}));

vi.mock('../api/homeDashboardApi', () => ({
  homeDashboardApi: {
    getRecentProjects: () => getRecentProjectsMock(),
    getProjectSchedules: () => getProjectSchedulesMock(),
    searchProjects: (query: string, options: unknown) =>
      searchProjectsMock(query, options),
    getFavoriteProjects: () => getFavoriteProjectsMock(),
    setProjectFavorite: (projectId: string, favorite: boolean) =>
      setProjectFavoriteMock(projectId, favorite),
  },
}));

const createProject = ({
  id,
  name,
  ...overrides
}: Partial<ProjectReadSchema> & {
  id: string;
  name: string;
}): ProjectReadSchema => ({
  organization_id: 'org-1',
  created_at: '2026-06-17T12:00:00.000Z',
  updated_at: '2026-06-18T15:00:00.000Z',
  last_runs: [],
  id,
  name,
  ...overrides,
});

const createUser = (
  overrides: Partial<UserReadSchema> = {}
): UserReadSchema => ({
  email: 'alexey@example.com',
  organization_id: 'org-1',
  role: 'user',
  user_name: 'Алексей',
  ...overrides,
});

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <HomeDashboard />
    </MemoryRouter>
  );

describe('widgets/home-dashboard/HomeDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useCurrentUserMock.mockReturnValue({
      loading: false,
      user: createUser(),
    });
    useBuildVersionMock.mockReturnValue({
      versionInfo: { version: 'v1.23.0' },
      isLoading: false,
      loadBuildVersion: vi.fn(),
    });
    searchProjectsMock.mockResolvedValue({ projects: [], total: 0 });
    getFavoriteProjectsMock.mockResolvedValue([
      createProject({ id: 'project-2', name: 'Beta', is_favorite: true }),
    ]);
    setProjectFavoriteMock.mockResolvedValue({ success: true });
    getProjectSchedulesMock.mockResolvedValue([]);
    getRecentProjectsMock.mockResolvedValue([
      createProject({
        id: 'project-1',
        name: 'Alpha',
        last_runs: [
          {
            finished_at: '2026-06-18T15:00:00.000Z',
            message: null,
            queued_at: '2026-06-18T14:50:00.000Z',
            started_at: '2026-06-18T14:55:00.000Z',
            status: 'SUCCESS',
            task_id: 'task-1',
            termination_reason: null,
          },
        ],
      }),
      createProject({
        id: 'project-2',
        name: 'Beta',
        last_runs: [
          {
            finished_at: '2026-06-17T09:00:44.000Z',
            message: 'Traceback: boom',
            queued_at: '2026-06-17T08:50:00.000Z',
            started_at: '2026-06-17T09:00:00.000Z',
            status: 'ERROR',
            task_id: 'task-2',
            termination_reason: null,
          },
        ],
      }),
    ]);
  });

  it('renders header, recent projects and role-filtered sections', async () => {
    renderDashboard();

    expect(screen.getByText('v1.23.0')).toBeInTheDocument();
    expect(screen.getByText('Продолжить работу')).toBeInTheDocument();

    const alphaLink = await screen.findByRole('link', { name: /Alpha/ });
    expect(alphaLink).toHaveAttribute('href', '/project-editor/project-1');
    expect(screen.getByRole('link', { name: /Beta/ })).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: 'Разделы' });
    expect(within(nav).getByRole('link', { name: 'Проекты' })).toHaveAttribute(
      'href',
      '/projects'
    );
    expect(
      within(nav).queryByRole('link', { name: 'Admin Panel' })
    ).not.toBeInTheDocument();
    expect(
      within(nav).queryByRole('link', { name: 'Планировщик' })
    ).not.toBeInTheDocument();
  });

  it('shows admin sections for superadmin and tracks section usage', async () => {
    useCurrentUserMock.mockReturnValue({
      loading: false,
      user: createUser({ role: 'superadmin', user_name: 'Root' }),
    });

    renderDashboard();

    const nav = screen.getByRole('navigation', { name: 'Разделы' });
    const adminLink = within(nav).getByRole('link', { name: 'Admin Panel' });
    expect(adminLink).toHaveAttribute('href', '/profile/admin');

    fireEvent.click(adminLink);
    expect(registerSectionUseMock).toHaveBeenCalledWith('admin');

    fireEvent.click(within(nav).getByRole('button', { name: /Все разделы/ }));
    const menu = within(nav).getByRole('menu');
    expect(within(menu).getByText('Организации')).toBeInTheDocument();
    expect(within(menu).getByText('Гайды')).toBeInTheDocument();
  });

  it('hides the scheduled tab and skips the scheduler for regular users', async () => {
    renderDashboard();

    expect(await screen.findByRole('link', { name: /Alpha/ })).toBeVisible();
    expect(
      screen.queryByRole('tab', { name: /По расписанию/ })
    ).not.toBeInTheDocument();
    expect(getProjectSchedulesMock).not.toHaveBeenCalled();
  });

  it('lists scheduled projects for admins with the next run', async () => {
    useCurrentUserMock.mockReturnValue({
      loading: false,
      user: createUser({ role: 'admin' }),
    });
    getProjectSchedulesMock.mockResolvedValue([
      {
        project_id: 'project-1',
        project_name: 'Alpha',
        cron: '0 3 * * *',
        disabled: true,
        next_run_time: null,
      },
      {
        project_id: 'project-2',
        project_name: 'Beta',
        cron: '*/15 * * * *',
        disabled: false,
        next_run_time: new Date(Date.now() + 30 * 60_000).toISOString(),
        recent_runs: [
          {
            task_id: 'sched-task-1',
            status: 'ERROR',
            queued_at: '2026-10-14T09:00:00.000Z',
            started_at: '2026-10-14T09:00:00.000Z',
            finished_at: '2026-10-14T09:00:10.000Z',
            message: 'boom',
          },
        ],
      },
      {
        project_id: 'project-77',
        project_name: 'Nested pipeline',
        cron: '0 * * * *',
        disabled: false,
        next_run_time: new Date(Date.now() + 3 * 60 * 60_000).toISOString(),
      },
    ]);

    renderDashboard();

    fireEvent.click(
      await screen.findByRole('tab', { name: /По расписанию\s*3/ })
    );

    const links = await screen.findAllByRole('link', {
      name: /Beta|Nested pipeline|Alpha/,
    });
    expect(links.map(link => link.textContent)).toEqual([
      expect.stringContaining('Beta'),
      expect.stringContaining('Nested pipeline'),
      expect.stringContaining('Alpha'),
    ]);
    expect(within(links[0]).getByText('через 30 мин')).toBeInTheDocument();
    expect(within(links[2]).getByText('отключено')).toBeInTheDocument();
    expect(
      within(links[0]).getByRole('button', { name: /Последние запуски: 1/ })
    ).toBeInTheDocument();
    expect(links[1]).toHaveAttribute('href', '/project-editor/project-77');
    expect(screen.getByText('Запуск')).toBeInTheDocument();
  });

  it('shows a retry when the scheduler request fails', async () => {
    useCurrentUserMock.mockReturnValue({
      loading: false,
      user: createUser({ role: 'superadmin' }),
    });
    getProjectSchedulesMock
      .mockRejectedValueOnce(new Error('unavailable'))
      .mockResolvedValueOnce([
        {
          project_id: 'project-2',
          project_name: 'Beta',
          cron: '0 3 * * *',
          next_run_time: new Date(Date.now() + 60 * 60_000).toISOString(),
        },
      ]);

    renderDashboard();

    fireEvent.click(await screen.findByRole('tab', { name: /По расписанию/ }));
    expect(
      await screen.findByText('Не удалось загрузить расписания')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Повторить/ }));

    expect(await screen.findByRole('link', { name: /Beta/ })).toBeVisible();
    expect(getProjectSchedulesMock).toHaveBeenCalledTimes(2);
  });

  it('searches projects inside the panel through the gateway', async () => {
    searchProjectsMock.mockResolvedValue({
      projects: [createProject({ id: 'project-9', name: 'Gamma report' })],
      total: 1,
    });

    renderDashboard();

    expect(await screen.findByRole('link', { name: /Alpha/ })).toBeVisible();
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Поиск по проектам' }),
      {
        target: { value: 'gam' },
      }
    );

    expect(
      await screen.findByRole('link', { name: /Gamma report/ })
    ).toHaveAttribute('href', '/project-editor/project-9');
    expect(searchProjectsMock).toHaveBeenCalledWith('gam', {
      includeLastRuns: true,
      limit: 10,
    });
    expect(
      screen.queryByRole('link', { name: /Alpha/ })
    ).not.toBeInTheDocument();
  });

  it('shows the run error log from the last runs popover', async () => {
    renderDashboard();

    const betaLink = await screen.findByRole('link', { name: /Beta/ });
    fireEvent.click(
      within(betaLink).getByRole('button', { name: /Последние запуски/ })
    );

    const popover = screen.getByRole('dialog', {
      name: 'Последние запуски Beta',
    });
    const errorRow = within(popover).getByText('ошибка');
    fireEvent.mouseEnter(errorRow.closest('[tabindex="0"]') as Element);

    const log = screen.getByRole('dialog', { name: 'Лог ошибки' });
    expect(within(log).getByText('Traceback: boom')).toBeInTheDocument();

    fireEvent.scroll(within(log).getByText('Traceback: boom'));
    expect(
      screen.getByRole('dialog', { name: 'Последние запуски Beta' })
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Лог ошибки' })).toBeVisible();

    fireEvent.scroll(window);
    expect(
      screen.queryByRole('dialog', { name: 'Последние запуски Beta' })
    ).not.toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('lists favorites in their own tab after recent', async () => {
    useCurrentUserMock.mockReturnValue({
      loading: false,
      user: createUser({ role: 'admin' }),
    });

    renderDashboard();

    const tabs = await screen.findAllByRole('tab');
    expect(tabs.map(tab => tab.textContent)).toEqual([
      expect.stringMatching(/^Недавние/),
      expect.stringMatching(/^Избранные/),
      expect.stringMatching(/^По расписанию/),
    ]);

    fireEvent.click(screen.getByRole('tab', { name: /Избранные/ }));

    expect(await screen.findByRole('link', { name: /Beta/ })).toBeVisible();
    expect(
      screen.queryByRole('link', { name: /Alpha/ })
    ).not.toBeInTheDocument();
  });

  it('sorts favorites by last modification', async () => {
    getFavoriteProjectsMock.mockResolvedValue([
      createProject({
        id: 'fav-old',
        name: 'Old favorite',
        is_favorite: true,
        updated_at: '2026-01-01T10:00:00.000Z',
      }),
      createProject({
        id: 'fav-new',
        name: 'New favorite',
        is_favorite: true,
        updated_at: '2026-06-01T10:00:00.000Z',
      }),
    ]);

    renderDashboard();

    fireEvent.click(await screen.findByRole('tab', { name: /Избранные\s*2/ }));

    const names = screen
      .getAllByRole('link', { name: /favorite/ })
      .map(link => link.textContent);
    expect(names[0]).toContain('New favorite');
    expect(names[1]).toContain('Old favorite');
  });

  it('toggles favorites through the gateway', async () => {
    renderDashboard();

    const alphaLink = await screen.findByRole('link', { name: /Alpha/ });
    const star = within(alphaLink).getByRole('button', {
      name: 'В избранное',
    });
    fireEvent.click(star);

    expect(setProjectFavoriteMock).toHaveBeenCalledWith('project-1', true);
    expect(
      within(alphaLink).getByRole('button', { name: 'Убрать из избранного' })
    ).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('tab', { name: /Избранные/ }));
    expect(screen.getByRole('link', { name: /Alpha/ })).toBeVisible();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('reverts the star and alerts when the favorite request fails', async () => {
    setProjectFavoriteMock.mockRejectedValueOnce(new Error('boom'));

    renderDashboard();

    const betaLink = await screen.findByRole('link', { name: /Beta/ });
    await screen.findByRole('tab', { name: /Избранные\s*1/ });
    fireEvent.click(
      within(betaLink).getByRole('button', { name: 'Убрать из избранного' })
    );

    expect(setProjectFavoriteMock).toHaveBeenCalledWith('project-2', false);
    expect(
      await within(betaLink).findByRole('button', {
        name: 'Убрать из избранного',
      })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(showAlertMock).toHaveBeenCalledWith({
      message: 'Не удалось обновить избранное.',
      type: 'error',
    });
  });

  it('shows inline error with retry when projects fail to load', async () => {
    getRecentProjectsMock.mockRejectedValueOnce(new Error('boom'));

    renderDashboard();

    expect(
      await screen.findByText('Не удалось загрузить проекты')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Повторить/ }));

    expect(await screen.findByRole('link', { name: /Alpha/ })).toBeVisible();
    expect(getRecentProjectsMock).toHaveBeenCalledTimes(2);
  });

  it('shows onboarding when the user has no projects', async () => {
    getRecentProjectsMock.mockResolvedValue([]);

    renderDashboard();

    expect(
      await screen.findByRole('heading', {
        name: 'Добро пожаловать в Denvic Visual Transformer',
      })
    ).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Создать проект/ }));
    expect(screen.getByText('create project modal')).toBeInTheDocument();
  });
});
