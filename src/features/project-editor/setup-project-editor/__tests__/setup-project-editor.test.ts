import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  useParamsMock,
  connectWsMock,
  loadNodeDefinitionsMock,
  createProjectTaskMock,
  getGraphMock,
} = vi.hoisted(() => ({
  useParamsMock: vi.fn(() => ({ projectID: 'project-123' })),
  connectWsMock: vi.fn(),
  loadNodeDefinitionsMock: vi.fn(async () => ({ reader: {}, writer: {} })),
  createProjectTaskMock: vi.fn(async () => ({ task_id: 'task-1' })),
  getGraphMock: vi.fn(async () => ({
    nodes: [{ id: 'node-1' }],
    edges: [],
    subgraphs: [],
  })),
}));

vi.mock('react-router-dom', () => ({
  useParams: useParamsMock,
}));

vi.mock('@/entities/node/node-definition', () => ({
  useNodeDefinitions: () => ({
    status: 'idle',
    loadNodeDefinitions: loadNodeDefinitionsMock,
  }),
}));

vi.mock('@/app/realtime/websocket', () => ({
  useWebSocketConnection: () => ({
    status: 'disconnected',
    connectWs: connectWsMock,
  }),
}));

vi.mock('@/entities/project/project-task', () => ({
  useProjectTask: () => ({
    lastProjectTaskID: null,
    createProjectTask: createProjectTaskMock,
  }),
}));

vi.mock('@/entities/project-editor/graph', () => ({
  graphApi: {
    getGraph: getGraphMock,
  },
}));

import { useProjectEditorSetup } from '@/features/project-editor/setup-project-editor';

describe('features/setup-project-editor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useParamsMock.mockReturnValue({ projectID: 'project-123' });
    loadNodeDefinitionsMock.mockResolvedValue({ reader: {}, writer: {} });
    createProjectTaskMock.mockResolvedValue({ task_id: 'task-1' });
    getGraphMock.mockResolvedValue({
      nodes: [{ id: 'node-1' }],
      edges: [],
      subgraphs: [],
    });
  });

  it('initializes websocket, node definitions and first task for non-empty graph', async () => {
    renderHook(() => useProjectEditorSetup());

    await waitFor(() => {
      expect(connectWsMock).toHaveBeenCalledWith('project-123');
      expect(loadNodeDefinitionsMock).toHaveBeenCalledTimes(1);
      expect(getGraphMock).toHaveBeenCalledWith('project-123');
      expect(createProjectTaskMock).toHaveBeenCalledWith(
        'project-123',
        'metadata_only',
        true
      );
    });
  });

  it('does not create metadata task for empty graph', async () => {
    getGraphMock.mockResolvedValueOnce({
      nodes: [],
      edges: [],
      subgraphs: [],
    });

    renderHook(() => useProjectEditorSetup());

    await waitFor(() => {
      expect(connectWsMock).toHaveBeenCalledWith('project-123');
      expect(loadNodeDefinitionsMock).toHaveBeenCalledTimes(1);
      expect(getGraphMock).toHaveBeenCalledWith('project-123');
    });

    expect(createProjectTaskMock).not.toHaveBeenCalled();
  });
});
