import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HomeWidgetsSection } from './HomeWidgetsSection';

const {
  refetchMock,
  setWidgetIdsMock,
  useFailingProjectsMock,
  useRuns24hMock,
  useScheduledRunsMock,
  useServicesMock,
  widgetPreference,
} = vi.hoisted(() => ({
  refetchMock: vi.fn(),
  setWidgetIdsMock: vi.fn(),
  useFailingProjectsMock: vi.fn(),
  useRuns24hMock: vi.fn(),
  useScheduledRunsMock: vi.fn(),
  useServicesMock: vi.fn(),
  widgetPreference: { ids: undefined as string[] | undefined },
}));

vi.mock('@/entities/ui-preferences', () => ({
  useHomeWidgetsPreference: () => ({
    setWidgetIds: setWidgetIdsMock,
    widgetIds: widgetPreference.ids,
  }),
}));

vi.mock('@/entities/home-widget', () => ({
  useGetFailingProjectsQuery: () => useFailingProjectsMock(),
  useGetRuns24hQuery: () => useRuns24hMock(),
  useGetScheduledRunsQuery: () => useScheduledRunsMock(),
  useGetServicesQuery: () => useServicesMock(),
}));

const loaded = <T,>(data: T) => ({
  data,
  isError: false,
  refetch: refetchMock,
});

const renderSection = (
  role: 'user' | 'admin' | 'superadmin' | null | undefined
) =>
  render(
    <MemoryRouter>
      <HomeWidgetsSection role={role} />
    </MemoryRouter>
  );

describe('widgets/home-dashboard/HomeWidgetsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    widgetPreference.ids = undefined;

    useRuns24hMock.mockReturnValue(
      loaded({
        generated_at: '2026-10-14T12:00:00Z',
        window_start: '2026-10-13T12:00:00Z',
        window_end: '2026-10-14T12:00:00Z',
        bucket_minutes: 60,
        total: 142,
        success: 138,
        error: 4,
        cancelled: 0,
        running: 0,
        success_ratio: 0.97,
        buckets: [
          {
            start: '2026-10-14T10:00:00Z',
            total: 6,
            success: 5,
            error: 1,
            cancelled: 0,
            running: 0,
          },
        ],
      })
    );
    useFailingProjectsMock.mockReturnValue(
      loaded({
        generated_at: '2026-10-14T12:00:00Z',
        window_start: '2026-10-07T12:00:00Z',
        window_end: '2026-10-14T12:00:00Z',
        items: [
          {
            project_id: 'p-1',
            project_name: 'crm_sync_b24',
            error_count: 10,
            total_count: 24,
            last_error_at: '2026-10-14T11:00:00Z',
            consecutive_failures: 3,
          },
        ],
      })
    );
    useScheduledRunsMock.mockReturnValue(
      loaded({
        generated_at: '2026-10-14T12:00:00Z',
        total_schedules: 6,
        disabled_schedules: 1,
        items: [
          {
            project_id: 'p-2',
            project_name: 'wdb_orders_daily',
            cron: '0 3 * * *',
            next_run_time: '2026-10-15T03:00:00Z',
            last_run_status: 'SUCCESS',
            last_run_time: '2026-10-14T03:00:00Z',
          },
        ],
      })
    );
    useServicesMock.mockReturnValue(
      loaded({
        generated_at: '2026-10-14T12:00:00Z',
        system_state: 'ready',
        services: [
          {
            name: 'gateway',
            status: 'online',
            latency_ms: 42,
            uptime_seconds: 100,
          },
        ],
        workers: { total: 3, online: 3, busy: 1 },
      })
    );
  });

  it('shows only widgets allowed for a regular user', () => {
    renderSection('user');

    expect(
      screen.getByRole('region', { name: 'Запуски за 24 ч' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Проблемные проекты' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Ближайшие запуски' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Сервисы' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('142')).toBeInTheDocument();
    expect(screen.getByText('3 подряд')).toBeInTheDocument();
  });

  it('shows every widget for superadmin with section links', () => {
    renderSection('superadmin');

    const schedules = screen.getByRole('region', { name: 'Ближайшие запуски' });
    expect(within(schedules).getByText('wdb_orders_daily')).toBeVisible();
    expect(
      within(schedules).getByRole('link', { name: /Открыть/ })
    ).toHaveAttribute('href', '/profile/schedule');

    const services = screen.getByRole('region', { name: 'Сервисы' });
    expect(within(services).getByText('42 ms')).toBeInTheDocument();
    expect(within(services).queryByText('Система')).not.toBeInTheDocument();
  });

  it('keeps the saved order and drops unavailable widgets', () => {
    widgetPreference.ids = ['services', 'runs-24h', 'unknown'];

    renderSection('user');

    expect(
      screen.getByRole('region', { name: 'Запуски за 24 ч' })
    ).toBeVisible();
    expect(
      screen.queryByRole('region', { name: 'Проблемные проекты' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Сервисы' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Добавить виджет/ })
    ).toBeInTheDocument();
  });

  it('toggles widgets in the picker', () => {
    widgetPreference.ids = ['runs-24h'];

    renderSection('user');

    fireEvent.click(screen.getByRole('button', { name: /Выбрать виджеты/ }));
    const panel = screen.getByRole('presentation');
    expect(within(panel).getByText('Выбрано 1 из 2')).toBeInTheDocument();

    fireEvent.click(
      within(panel).getByRole('switch', { name: 'Проблемные проекты' })
    );
    expect(setWidgetIdsMock).toHaveBeenCalledWith([
      'runs-24h',
      'failing-projects',
    ]);

    fireEvent.click(
      within(panel).getByRole('switch', { name: 'Запуски за 24 ч' })
    );
    expect(setWidgetIdsMock).toHaveBeenLastCalledWith([]);
  });

  it('renders skeleton while loading and retries after an error', () => {
    widgetPreference.ids = ['runs-24h', 'failing-projects'];
    useRuns24hMock.mockReturnValue({
      data: undefined,
      isError: false,
      refetch: refetchMock,
    });
    useFailingProjectsMock.mockReturnValue({
      data: undefined,
      isError: true,
      refetch: refetchMock,
    });

    renderSection('user');

    const runs = screen.getByRole('region', { name: 'Запуски за 24 ч' });
    expect(runs.querySelector('[aria-busy="true"]')).not.toBeNull();

    const failing = screen.getByRole('region', { name: 'Проблемные проекты' });
    expect(within(failing).getByText('Данные недоступны')).toBeVisible();
    fireEvent.click(within(failing).getByRole('button', { name: /Повторить/ }));
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not mount or fetch widgets until the role is known', () => {
    renderSection(undefined);

    expect(screen.getByRole('region', { name: 'Виджеты' })).toHaveAttribute(
      'aria-busy',
      'true'
    );
    expect(useRuns24hMock).not.toHaveBeenCalled();
    expect(useFailingProjectsMock).not.toHaveBeenCalled();
    expect(useScheduledRunsMock).not.toHaveBeenCalled();
    expect(useServicesMock).not.toHaveBeenCalled();
  });

  it('never queries admin-only widgets for a regular user', () => {
    widgetPreference.ids = ['services', 'scheduled-runs', 'runs-24h'];

    renderSection('user');

    expect(useServicesMock).not.toHaveBeenCalled();
    expect(useScheduledRunsMock).not.toHaveBeenCalled();
    expect(useRuns24hMock).toHaveBeenCalled();
  });

  it('shows the empty state when nothing is selected', () => {
    widgetPreference.ids = [];

    renderSection('user');

    expect(
      screen.getByRole('button', {
        name: /Добавить виджет.*Выберите виджеты разделов/,
      })
    ).toBeInTheDocument();
  });
});
