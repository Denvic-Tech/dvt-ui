import * as React from 'react';

import { homeDashboardApi } from '../api/homeDashboardApi';

import type { HomeProject } from './types';

const getUpdatedTime = (project: HomeProject): number => {
  const time = new Date(
    project.updated_at ?? project.created_at ?? ''
  ).getTime();
  return Number.isFinite(time) ? time : 0;
};

/** Most recently modified first, like the «Недавние» tab. */
const sortByUpdated = (projects: HomeProject[]): HomeProject[] =>
  [...projects].sort(
    (left, right) => getUpdatedTime(right) - getUpdatedTime(left)
  );

type FavoritesState = {
  error: unknown;
  /** Server list of favorites; `null` until it has loaded successfully. */
  favorites: HomeProject[] | null;
  loading: boolean;
};

/**
 * Favorites list plus optimistic star toggling. Until the list loads, the
 * star state falls back to `is_favorite` from the project payload.
 */
export const useFavoriteProjects = () => {
  const [state, setState] = React.useState<FavoritesState>({
    error: null,
    favorites: null,
    loading: true,
  });
  const [overrides, setOverrides] = React.useState<
    Readonly<Record<string, boolean>>
  >({});
  const pendingRef = React.useRef(new Set<string>());
  const requestIdRef = React.useRef(0);

  const reload = React.useCallback(() => {
    const requestId = ++requestIdRef.current;
    setState(prev => ({ ...prev, error: null, loading: true }));

    homeDashboardApi
      .getFavoriteProjects()
      .then(favorites => {
        if (requestId === requestIdRef.current) {
          setState({
            error: null,
            favorites: sortByUpdated(favorites),
            loading: false,
          });
          setOverrides({});
        }
      })
      .catch((error: unknown) => {
        if (requestId === requestIdRef.current) {
          setState({ error, favorites: null, loading: false });
        }
      });
  }, []);

  React.useEffect(() => {
    reload();

    return () => {
      requestIdRef.current += 1;
    };
  }, [reload]);

  const favoriteIds = React.useMemo(
    () =>
      state.favorites
        ? new Set(state.favorites.map(project => project.id))
        : null,
    [state.favorites]
  );

  const isFavorite = React.useCallback(
    (project: HomeProject): boolean =>
      overrides[project.id] ??
      (favoriteIds
        ? favoriteIds.has(project.id)
        : Boolean(project.is_favorite)),
    [favoriteIds, overrides]
  );

  const applyLocally = React.useCallback(
    (project: HomeProject, favorite: boolean) => {
      setOverrides(current => ({ ...current, [project.id]: favorite }));
      setState(prev => {
        if (!prev.favorites) {
          return prev;
        }

        const rest = prev.favorites.filter(item => item.id !== project.id);
        return {
          ...prev,
          favorites: favorite
            ? sortByUpdated([...rest, { ...project, is_favorite: true }])
            : rest,
        };
      });
    },
    []
  );

  /** Resolves when the server confirms; reverts and rethrows on failure. */
  const toggleFavorite = React.useCallback(
    async (project: HomeProject): Promise<void> => {
      if (pendingRef.current.has(project.id)) {
        return;
      }

      const next = !isFavorite(project);
      pendingRef.current.add(project.id);
      applyLocally(project, next);

      try {
        await homeDashboardApi.setProjectFavorite(project.id, next);
      } catch (error) {
        applyLocally(project, !next);
        throw error;
      } finally {
        pendingRef.current.delete(project.id);
      }
    },
    [applyLocally, isFavorite]
  );

  return {
    error: state.error,
    favorites: state.favorites,
    isFavorite,
    loading: state.loading,
    reload,
    toggleFavorite,
  };
};
