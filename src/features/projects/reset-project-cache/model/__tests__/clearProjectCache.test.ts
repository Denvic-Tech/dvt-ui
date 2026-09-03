import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearProjectCache } from '../clearProjectCache.ts';

const { projectCacheApiMock } = vi.hoisted(() => ({
  projectCacheApiMock: {
    clear: vi.fn(),
  },
}));

vi.mock('@/app/providers/store/helpers', async () => {
  const actual = await vi.importActual<
    typeof import('@/app/providers/store/helpers')
  >('@/app/providers/store/helpers');

  return {
    createAppAsyncThunk: actual.createAppAsyncThunk,
  };
});

vi.mock('@/entities/project/project-cache/api.ts', () => ({
  projectCacheApi: projectCacheApiMock,
}));

vi.mock('@/entities/data/dataframe', () => ({
  clearDataFrameCache: () => ({
    type: 'dataframe/clearDataFrameCache',
  }),
}));

vi.mock('@/entities/data/json-data', () => ({
  clearJsonDataCache: () => ({
    type: 'jsonData/clearJsonDataCache',
  }),
}));

vi.mock('@/entities/node/node-metadata', () => ({
  resetNodesMetadata: () => ({
    type: 'nodeMetadata/resetNodesMetadata',
  }),
}));

vi.mock('@/entities/node/node-dataframe-viewer', () => ({
  nodeDataFrameViewerActions: {
    close: () => ({
      type: 'nodeDataFrameViewer/close',
    }),
  },
}));

vi.mock('@/entities/node/node-json-viewer', () => ({
  nodeJsonViewerActions: {
    close: () => ({
      type: 'nodeJsonViewer/close',
    }),
  },
}));

vi.mock('@/entities/node/node-meta-viewer', () => ({
  nodeMetaViewerActions: {
    close: () => ({
      type: 'nodeMetaViewer/close',
    }),
  },
}));

const getDispatchedActionTypes = (dispatch: ReturnType<typeof vi.fn>) =>
  dispatch.mock.calls.map(([action]) => (action as { type: string }).type);

describe('features/projects/reset-project-cache/clearProjectCache', () => {
  beforeEach(() => {
    projectCacheApiMock.clear.mockReset();
  });

  it('clears backend cache and resets relevant UI state on success', async () => {
    const response = { success: true, message: 'ok' } as any;
    projectCacheApiMock.clear.mockResolvedValue(response);

    const dispatch = vi.fn((action: unknown) => action);
    const getState = () =>
      ({
        projects: {
          selectedProject: {
            id: 'project-1',
          },
        },
      }) as any;

    const result = await clearProjectCache()(
      dispatch,
      getState,
      undefined as never
    );

    expect(projectCacheApiMock.clear).toHaveBeenCalledWith('project-1');
    expect(result.type).toBe('cache/clearProjectCache/fulfilled');
    expect(result.payload).toEqual(response);
    expect(getDispatchedActionTypes(dispatch)).toEqual([
      'cache/clearProjectCache/pending',
      'dataframe/clearDataFrameCache',
      'jsonData/clearJsonDataCache',
      'nodeMetadata/resetNodesMetadata',
      'nodeDataFrameViewer/close',
      'nodeJsonViewer/close',
      'nodeMetaViewer/close',
      'cache/clearProjectCache/fulfilled',
    ]);
  });

  it('rejects when selected project is missing and does not reset UI state', async () => {
    const dispatch = vi.fn((action: unknown) => action);
    const getState = () =>
      ({
        projects: {
          selectedProject: null,
        },
      }) as any;

    const result = await clearProjectCache()(
      dispatch,
      getState,
      undefined as never
    );

    expect(projectCacheApiMock.clear).not.toHaveBeenCalled();
    expect(result.type).toBe('cache/clearProjectCache/rejected');
    expect(result.payload).toMatchObject({
      code: 'UNKNOWN',
      message: 'Не удалось определить проект для очистки кэша',
    });
    expect(getDispatchedActionTypes(dispatch)).toEqual([
      'cache/clearProjectCache/pending',
      'cache/clearProjectCache/rejected',
    ]);
  });

  it('maps backend failure and skips local reset actions', async () => {
    projectCacheApiMock.clear.mockRejectedValue(new Error('backend down'));

    const dispatch = vi.fn((action: unknown) => action);
    const getState = () =>
      ({
        projects: {
          selectedProject: {
            id: 'project-1',
          },
        },
      }) as any;

    const result = await clearProjectCache()(
      dispatch,
      getState,
      undefined as never
    );

    expect(projectCacheApiMock.clear).toHaveBeenCalledWith('project-1');
    expect(result.type).toBe('cache/clearProjectCache/rejected');
    expect(result.payload).toMatchObject({
      code: 'UNKNOWN',
      message: 'Не удалось очистить кэш проекта',
    });
    expect(getDispatchedActionTypes(dispatch)).toEqual([
      'cache/clearProjectCache/pending',
      'cache/clearProjectCache/rejected',
    ]);
  });
});
