import { createAsyncThunk } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';

import {
  createProjectTask,
  projectTaskActions,
  projectTaskReducer,
} from '../slice';

vi.mock('@/app/providers/store/helpers', () => ({
  createAppAsyncThunk: createAsyncThunk,
}));

vi.mock('@/entities/project/project-task', () => ({
  projectTaskApi: {},
}));

describe('projectTask slice', () => {
  it('resets task state to the initial values', () => {
    const withTask = projectTaskReducer(
      undefined,
      createProjectTask.fulfilled({ task_id: 'task-1' } as never, 'request-1', {
        projectID: 'p1',
        mode: 'metadata_only',
        forceExec: true,
        targetNodes: null,
      })
    );
    expect(withTask.lastTaskID).toBe('task-1');

    const reset = projectTaskReducer(
      withTask,
      projectTaskActions.resetProjectTask()
    );

    expect(reset).toEqual(projectTaskReducer(undefined, { type: 'unknown' }));
    expect(reset.lastTaskID).toBeNull();
  });
});
