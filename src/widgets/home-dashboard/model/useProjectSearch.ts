import * as React from 'react';

import type { ProjectReadSchema } from '@/shared/gatewayClient';

import { homeDashboardApi } from '../api/homeDashboardApi';

const SEARCH_DEBOUNCE_MS = 250;

type ProjectSearchOptions = {
  includeLastRuns?: boolean;
  limit: number;
};

type ProjectSearchState = {
  failed: boolean;
  loading: boolean;
  results: ProjectReadSchema[];
  total: number;
};

const IDLE_STATE: ProjectSearchState = {
  failed: false,
  loading: false,
  results: [],
  total: 0,
};

/** Debounced server-side project search; idle while the query is blank. */
export const useProjectSearch = (
  query: string,
  { includeLastRuns = false, limit }: ProjectSearchOptions
) => {
  const [state, setState] = React.useState<ProjectSearchState>(IDLE_STATE);
  const [attempt, setAttempt] = React.useState(0);
  const normalizedQuery = query.trim();

  React.useEffect(() => {
    if (!normalizedQuery) {
      setState(IDLE_STATE);
      return undefined;
    }

    let cancelled = false;
    setState(prev => ({ ...prev, failed: false, loading: true }));

    const timer = window.setTimeout(() => {
      homeDashboardApi
        .searchProjects(normalizedQuery, { includeLastRuns, limit })
        .then(({ projects, total }) => {
          if (!cancelled) {
            setState({
              failed: false,
              loading: false,
              results: projects,
              total,
            });
          }
        })
        .catch(() => {
          if (!cancelled) {
            setState({ ...IDLE_STATE, failed: true });
          }
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [attempt, includeLastRuns, limit, normalizedQuery]);

  const retry = React.useCallback(() => setAttempt(value => value + 1), []);

  return { ...state, retry };
};
