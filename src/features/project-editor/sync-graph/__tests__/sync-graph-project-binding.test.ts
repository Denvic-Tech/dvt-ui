import { createAsyncThunk } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';

import {
  flushGraphOperations,
  syncGraphActions,
  syncGraphReducer,
} from '@/features/project-editor/sync-graph/model/slice';

import { graphActions } from '@/entities/project-editor/graph';

const { projectIdMock } = vi.hoisted(() => ({ projectIdMock: vi.fn() }));

vi.mock('@/app/providers/store/helpers', () => ({
  createAppAsyncThunk: (
    typePrefix: string,
    payloadCreator: (...args: any[]) => unknown,
    options?: Record<string, unknown>
  ) => createAsyncThunk(typePrefix, payloadCreator as any, options as any),
}));

vi.mock('@/shared/gatewayClient', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  client: {
    projects: {
      projectId: (id: string) => {
        projectIdMock(id);
        return {
          graphOps: {
            post: () => Promise.reject(new Error('offline')),
          },
        };
      },
    },
  },
}));

const createNode = () =>
  graphActions.createNodes({
    nodes: [
      {
        id: 'node-1',
        position: { x: 0, y: 0 },
        data: { name: 'reader', displayName: 'Reader', inputValues: {} },
      },
    ] as any,
  });

describe('features/sync-graph project binding', () => {
  it('pins a non-empty outbox to the first bound project only', () => {
    const empty = syncGraphReducer(
      undefined,
      syncGraphActions.bindOutboxProject('project-a')
    );
    expect(empty.projectId).toBeNull();

    const pending = syncGraphReducer(undefined, createNode());
    const bound = syncGraphReducer(
      pending,
      syncGraphActions.bindOutboxProject('project-a')
    );
    const rebound = syncGraphReducer(
      bound,
      syncGraphActions.bindOutboxProject('project-b')
    );

    expect(rebound.projectId).toBe('project-a');
  });

  it('releases the binding once the outbox is flushed or replaced', () => {
    const pending = syncGraphReducer(undefined, createNode());
    const bound = syncGraphReducer(
      pending,
      syncGraphActions.bindOutboxProject('project-a')
    );

    const flushed = syncGraphReducer(
      bound,
      flushGraphOperations.fulfilled(
        { ackedIds: bound.outbox.map(op => op.id), response: undefined },
        'request-1'
      )
    );
    expect(flushed.projectId).toBeNull();

    const replaced = syncGraphReducer(
      bound,
      graphActions.setGraph({ nodes: [], edges: [] } as any)
    );
    expect(replaced.projectId).toBeNull();
  });

  it('flushes pending operations to their own project after navigation', async () => {
    const pending = syncGraphReducer(undefined, createNode());
    const syncGraph = syncGraphReducer(
      pending,
      syncGraphActions.bindOutboxProject('project-a')
    );
    const getState = () =>
      ({
        projects: { selectedProject: { id: 'project-b' } },
        syncGraph,
      }) as any;

    await flushGraphOperations()(vi.fn(), getState, undefined);

    expect(projectIdMock).toHaveBeenCalledWith('project-a');
    expect(projectIdMock).not.toHaveBeenCalledWith('project-b');
  });
});
