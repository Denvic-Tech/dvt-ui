import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useProjectEditorSetup } from './hook';

const {
  connectWs,
  createProjectTask,
  disconnectWs,
  graphGetGraph,
  loadNodeDefinitions,
  nodeDefinitionsHook,
  projectTaskHook,
  websocketHook,
} = vi.hoisted(() => ({
  connectWs: vi.fn(),
  createProjectTask: vi.fn(),
  disconnectWs: vi.fn(),
  graphGetGraph: vi.fn(),
  loadNodeDefinitions: vi.fn(),
  nodeDefinitionsHook: vi.fn(),
  projectTaskHook: vi.fn(),
  websocketHook: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ projectID: 'project-1' }),
}));

vi.mock('@/entities/node/node-definition', () => ({
  useNodeDefinitions: () => nodeDefinitionsHook(),
}));

vi.mock('@/entities/project/project-task', () => ({
  useProjectTask: () => projectTaskHook(),
}));

vi.mock('@/app/realtime/websocket', () => ({
  useWebSocketConnection: () => websocketHook(),
}));

vi.mock('@/entities/project-editor/graph', () => ({
  graphApi: {
    getGraph: (...args: unknown[]) => graphGetGraph(...args),
  },
}));

describe('useProjectEditorSetup', () => {
  let websocketStatus: 'disconnected' | 'connected';

  beforeEach(() => {
    vi.clearAllMocks();
    websocketStatus = 'disconnected';

    nodeDefinitionsHook.mockReturnValue({
      status: 'succeeded',
      loadNodeDefinitions,
    });
    projectTaskHook.mockReturnValue({
      lastProjectTaskID: null,
      createProjectTask,
    });
    websocketHook.mockImplementation(() => ({
      status: websocketStatus,
      connectWs,
      disconnectWs,
    }));
    graphGetGraph.mockResolvedValue({ nodes: [{ id: 'node-1' }] });
    createProjectTask.mockResolvedValue({ task_id: 'task-1' });
  });

  it('waits for WebSocket connection before creating the initial metadata task', async () => {
    const { rerender, unmount } = renderHook(() => useProjectEditorSetup());

    await waitFor(() => {
      expect(connectWs).toHaveBeenCalledWith('project-1');
    });
    expect(graphGetGraph).not.toHaveBeenCalled();
    expect(createProjectTask).not.toHaveBeenCalled();

    websocketStatus = 'connected';
    rerender();

    await waitFor(() => {
      expect(createProjectTask).toHaveBeenCalledWith(
        'project-1',
        'metadata_only',
        true
      );
    });
    expect(graphGetGraph).toHaveBeenCalledWith('project-1');

    unmount();
    expect(disconnectWs).toHaveBeenCalledWith('project-1');
  });
});
