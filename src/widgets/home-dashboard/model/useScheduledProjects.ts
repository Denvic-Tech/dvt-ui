import * as React from 'react';

import type { ProjectScheduleResponse } from '@/shared/gatewayClient';

import { homeDashboardApi } from '../api/homeDashboardApi';

import type { HomeProject } from './types';

export type ScheduledProjectItem = {
  project: HomeProject;
  schedule: ProjectScheduleResponse;
};

type ScheduleState = {
  error: unknown;
  loading: boolean;
  schedules: ProjectScheduleResponse[] | null;
};

const IDLE_STATE: ScheduleState = {
  error: null,
  loading: false,
  schedules: null,
};

const toTime = (value: string | null | undefined): number => {
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
};

/** Active schedules first, then by the nearest next run. */
const compareSchedules = (
  left: ProjectScheduleResponse,
  right: ProjectScheduleResponse
): number =>
  Number(Boolean(left.disabled)) - Number(Boolean(right.disabled)) ||
  toTime(left.next_run_time) - toTime(right.next_run_time);

/** The scheduler entry already carries the name and recent runs. */
const toHomeProject = (schedule: ProjectScheduleResponse): HomeProject => ({
  id: schedule.project_id,
  name: schedule.project_name?.trim() || 'Без названия',
  last_runs: schedule.recent_runs ?? [],
});

/**
 * Projects with a scheduler entry from `/projects/scheduler/scheduled`
 * (admin+). Nothing is requested while `enabled` is false.
 */
export const useScheduledProjects = (enabled: boolean) => {
  const [state, setState] = React.useState<ScheduleState>(IDLE_STATE);
  const requestIdRef = React.useRef(0);

  const reload = React.useCallback(() => {
    const requestId = ++requestIdRef.current;
    setState(prev => ({ ...prev, error: null, loading: true }));

    homeDashboardApi
      .getProjectSchedules()
      .then(schedules => {
        if (requestId === requestIdRef.current) {
          setState({ error: null, loading: false, schedules });
        }
      })
      .catch((error: unknown) => {
        if (requestId === requestIdRef.current) {
          setState({ error, loading: false, schedules: null });
        }
      });
  }, []);

  React.useEffect(() => {
    if (!enabled) {
      requestIdRef.current += 1;
      setState(IDLE_STATE);
      return undefined;
    }

    reload();

    return () => {
      requestIdRef.current += 1;
    };
  }, [enabled, reload]);

  const { schedules } = state;

  const items = React.useMemo<ScheduledProjectItem[] | null>(
    () =>
      schedules
        ? [...schedules].sort(compareSchedules).map(schedule => ({
            project: toHomeProject(schedule),
            schedule,
          }))
        : null,
    [schedules]
  );

  const scheduleByProjectId = React.useMemo(
    () =>
      new Map(
        (schedules ?? []).map(schedule => [schedule.project_id, schedule])
      ),
    [schedules]
  );

  return {
    enabled,
    error: state.error,
    items,
    loading: state.loading,
    reload,
    scheduleByProjectId,
  };
};

export type ScheduledProjectsState = ReturnType<typeof useScheduledProjects>;
