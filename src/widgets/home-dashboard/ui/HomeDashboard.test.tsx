import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  DBConnectionRecord,
  DBConnectionStatus,
} from '@/entities/data/db-connection';

import type { ProjectReadSchema, UserReadSchema } from '@/shared/gatewayClient';

import { HomeDashboard } from './HomeDashboard.tsx';

const {
  createNewProjectMock,
  fetchCatalogMock,
  fetchConnectionsMock,
  getAllMock,
  getConnectionStatusMock,
  navigateMock,
  showAlertMock,
  useBuildVersionMock,
  useConnectionsMock,
  useCurrentUserMock,
  useProjectsMock,
} = vi.hoisted(() => ({
  createNewProjectMock: vi.fn(),
  fetchCatalogMock: vi.fn(),
  fetchConnectionsMock: vi.fn(),
  getAllMock: vi.fn(),
  getConnectionStatusMock: vi.fn(),
  navigateMock: vi.fn(),
  showAlertMock: vi.fn(),
  useBuildVersionMock: vi.fn(),
  useConnectionsMock: vi.fn(),
  useCurrentUserMock: vi.fn(),
  useProjectsMock: vi.fn(),
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
  useAlert: () => ({
    showAlert: showAlertMock,
  }),
}));

vi.mock('@/features/profile/build-version-info', () => ({
  useBuildVersion: () => useBuildVersionMock(),
}));

vi.mock('@/entities/user', () => ({
  normalizeRole: (role: string | null | undefined) =>
    role === 'superadmin' || role === 'admin' || role === 'user' ? role : null,
  useCurrentUser: () => useCurrentUserMock(),
}));

vi.mock('@/entities/project/projects', () => ({
  CreateProjectModal: ({
    open,
  }: {
    loading?: boolean;
    onClose: () => void;
    onCreate: (payload: { name: string }) => void;
    open: boolean;
  }) => (open ? <div>create project modal</div> : null),
  useProjects: () => useProjectsMock(),
}));

vi.mock('@/entities/admin/admin', () => ({
  useAdmin: () => ({
    loadUsers: vi.fn(),
    users: [],
    usersLoading: false,
  }),
}));

vi.mock('@/entities/admin/organizations', () => ({
  useOrganizations: () => ({
    loadOrganizations: vi.fn(),
    organizations: [],
    organizationsLoading: false,
  }),
}));

vi.mock('@/entities/data/db-connection', () => ({
  ConnectionLogo: () => <div>connection-logo</div>,
  DatabaseConnectionCreateUpdateModal: ({ open }: { open: boolean }) =>
    open ? <div>db connection modal</div> : null,
  DBConnectionsManager: () => <div>db connections manager</div>,
  getConnectionTypeLabel: (type: string) =>
    ({
      clickhouse: 'ClickHouse',
      kafka: 'Kafka',
      postgres: 'Postgres',
    })[type] ?? type,
  useConnections: () => useConnectionsMock(),
}));

vi.mock('@/entities/project/projects/api/projectsApi', () => ({
  projectsApi: {
    getAll: (...args: unknown[]) => getAllMock(...args),
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

const createUser = ({
  email,
  organization_id,
  ...overrides
}: Partial<UserReadSchema> & {
  email: string;
  organization_id: string;
}): UserReadSchema => ({
  email,
  organization_id,
  role: 'user',
  user_name: 'Алексей',
  ...overrides,
});

const createConnection = ({
  id,
  kind = 'database',
  name,
  properties = {},
  type = 'clickhouse',
  ...overrides
}: Partial<DBConnectionRecord> & {
  id: string;
  name: string;
}): DBConnectionRecord => ({
  created_at: null,
  deleted_at: null,
  driver: null,
  driver_options: null,
  id,
  kind,
  labels: null,
  metadata: null,
  name,
  organization_id: null,
  properties,
  issues: [],
  raw_properties: null,
  raw_driver_options: null,
  raw_secrets: null,
  secrets: null,
  type,
  updated_at: null,
  user_id: null,
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
    createNewProjectMock.mockReset();
    fetchCatalogMock.mockReset();
    fetchConnectionsMock.mockReset();
    getAllMock.mockReset();
    getConnectionStatusMock.mockReset();
    navigateMock.mockReset();
    showAlertMock.mockReset();
    useConnectionsMock.mockReset();
    useCurrentUserMock.mockReset();
    useProjectsMock.mockReset();
    useBuildVersionMock.mockReset();

    useCurrentUserMock.mockReturnValue({
      loading: false,
      user: createUser({
        email: 'alexey@example.com',
        organization_id: 'org-1',
        role: 'user',
      }),
    });
    useProjectsMock.mockReturnValue({
      createNewProject: createNewProjectMock,
    });
    useBuildVersionMock.mockReturnValue({
      versionInfo: { version: 'v1.19.0rc5' },
      isLoading: false,
      loadBuildVersion: vi.fn(),
    });
    useConnectionsMock.mockReturnValue({
      catalog: null,
      connections: [
        createConnection({
          id: 'connection-1',
          name: 'ERP(Clickhouse) - dvt_user',
          properties: { host: '10.0.4.21' },
          type: 'clickhouse',
        }),
        createConnection({
          id: 'connection-2',
          kind: 'queue',
          name: 'localhost:9092',
          properties: { bootstrap_servers: 'localhost' },
          type: 'kafka',
        }),
      ],
      error: null,
      fetchCatalog: fetchCatalogMock,
      fetchConnections: fetchConnectionsMock,
      getConnectionStatus: getConnectionStatusMock,
      loadingState: {
        isChecking: false,
        isCreating: false,
        isDeleting: false,
        isFetching: false,
        isFetchingCatalog: false,
        isUpdating: false,
      },
    });
    getConnectionStatusMock.mockImplementation(
      (id: string): DBConnectionStatus | undefined =>
        id === 'connection-1'
          ? {
              connected: true,
              exception: null,
              id,
              message: null,
              name: 'ERP(Clickhouse) - dvt_user',
            }
          : undefined
    );
    getAllMock.mockResolvedValue([
      createProject({
        id: 'project-1',
        name: 'Alpha',
        last_runs: [
          {
            finished_at: '2026-06-18T15:00:00.000Z',
            message: 'Успешно завершён',
            queued_at: '2026-06-18T14:50:00.000Z',
            started_at: '2026-06-18T14:55:00.000Z',
            status: 'SUCCESS',
            task_id: 'task-1',
            termination_reason: null,
          },
        ],
        updated_at: '2026-06-18T15:00:00.000Z',
      }),
      createProject({
        id: 'project-2',
        name: 'Beta',
        last_runs: [
          {
            finished_at: '2026-06-17T09:00:00.000Z',
            message: 'Traceback: boom',
            queued_at: '2026-06-17T08:50:00.000Z',
            started_at: '2026-06-17T08:55:00.000Z',
            status: 'ERROR',
            task_id: 'task-2',
            termination_reason: null,
          },
        ],
        updated_at: '2026-06-17T09:00:00.000Z',
      }),
    ]);
  });

  it('renders greeting, requests recent projects and hides admin-only section for regular users', async () => {
    renderDashboard();

    expect(getAllMock).toHaveBeenCalledWith({
      sortBy: 'updated_at',
      sortOrder: 'desc',
    });
    expect(fetchConnectionsMock).toHaveBeenCalledTimes(1);
    expect(fetchCatalogMock).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('heading', { name: /добр(ое|ый) /i })
    ).toBeInTheDocument();
    expect(screen.getByText('v1.19.0rc5')).toBeInTheDocument();
    expect(screen.getByText('Продолжить работу')).toBeInTheDocument();
    expect(screen.getByText('Подключения')).toBeInTheDocument();
    expect(screen.getByText('ERP(Clickhouse) - dvt_user')).toBeInTheDocument();
    expect(screen.getByText('ClickHouse · 10.0.4.21')).toBeInTheDocument();
    expect(screen.getByText('localhost:9092')).toBeInTheDocument();
    expect(screen.getByText('Kafka · localhost')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Управление' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Добавить подключение' })
    ).toBeInTheDocument();
    expect(await screen.findByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.queryByText('Traceback: boom')).not.toBeInTheDocument();
    expect(
      screen.getByTitle('Последний запуск завершился ошибкой')
    ).toBeInTheDocument();
    expect(screen.queryByText('Администрирование')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Все проекты' })).toHaveAttribute(
      'href',
      '/projects'
    );
  });

  it('shows admin section for superadmin without organization switcher', async () => {
    useCurrentUserMock.mockReturnValue({
      loading: false,
      user: createUser({
        email: 'superadmin@example.com',
        organization_id: 'org-1',
        role: 'superadmin',
        user_name: 'Root',
      }),
    });

    renderDashboard();

    expect(await screen.findByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Администрирование')).toBeInTheDocument();
    expect(screen.queryByText(/switcher:/)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Создать проект/i })
    ).toBeEnabled();
  });

  it('shows empty state when recent projects list is empty', async () => {
    getAllMock.mockResolvedValue([]);

    renderDashboard();

    expect(
      await screen.findByText('Пока нет недавних проектов')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Создать проект$/i })
    ).toBeEnabled();
    expect(
      screen.queryByRole('link', { name: 'Все проекты' })
    ).not.toBeInTheDocument();
  });

  it('shows inline alert and notification when recent projects request fails', async () => {
    getAllMock.mockRejectedValue(new Error('boom'));

    renderDashboard();

    expect(
      await screen.findByText(
        'Не все данные домашней страницы удалось загрузить'
      )
    ).toBeInTheDocument();
    expect(showAlertMock).toHaveBeenCalledWith({
      message: 'boom',
      type: 'error',
    });
  });

  it('does not render the removed command bar', () => {
    renderDashboard();

    expect(
      screen.queryByRole('button', { name: 'Открыть поиск по проектам' })
    ).not.toBeInTheDocument();
  });
});
