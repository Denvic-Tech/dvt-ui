import * as React from 'react';

import type { ProjectReadSchema } from '@/shared/gatewayClient';

import { homeDashboardApi } from '../api/homeDashboardApi';

type HomeProjectsState = {
  error: unknown;
  loading: boolean;
  projects: ProjectReadSchema[];
};

const INITIAL_STATE: HomeProjectsState = {
  error: null,
  loading: true,
  projects: [],
};

export const useHomeProjects = () => {
  const [state, setState] = React.useState<HomeProjectsState>(INITIAL_STATE);
  const requestIdRef = React.useRef(0);

  const reload = React.useCallback(() => {
    const requestId = ++requestIdRef.current;
    setState(prev => ({ ...prev, error: null, loading: true }));

    homeDashboardApi
      .getRecentProjects()
      .then(projects => {
        if (requestId === requestIdRef.current) {
          setState({ error: null, loading: false, projects });
        }
      })
      .catch((error: unknown) => {
        if (requestId === requestIdRef.current) {
          setState({ error, loading: false, projects: [] });
        }
      });
  }, []);

  React.useEffect(() => {
    reload();

    return () => {
      requestIdRef.current += 1;
    };
  }, [reload]);

  return { ...state, reload };
};
