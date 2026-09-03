import { createAppAsyncThunk } from '@/app/providers/store/helpers';

import {
  CustomNodeData,
  CustomNodeType,
  selectGraphEdgesRaw,
  selectGraphNodesRaw,
  selectNodeDataMap,
  selectSubgraphsList,
} from '@/entities/project-editor/graph';

export const exportGraphThunk = createAppAsyncThunk<void, void>(
  'graph/export',
  async (_, { getState }) => {
    const state = getState();
    const nodeDataByID = selectNodeDataMap(state);
    const nodes = selectGraphNodesRaw(state);
    const edges = selectGraphEdgesRaw(state);
    const subgraphs = selectSubgraphsList(state);
    const projectId = state.projects.selectedProject?.id ?? null;
    const projectName = state.projects.selectedProject?.name ?? null;

    const mergedNodes = nodes.map(n => {
      const storeData = nodeDataByID[n.id];
      const currentData = (n.data ?? {}) as any;
      const mergedData: CustomNodeData = {
        ...currentData,
        name: storeData?.name ?? currentData.name,
        displayName: storeData?.displayName ?? currentData.displayName,
        inputValues: storeData?.inputValues ?? currentData.inputValues ?? {},
        ...(currentData.metadata ? { metadata: currentData.metadata } : {}),
      };
      const { measured, ...rest } = n as any;
      return { ...rest, data: mergedData } as CustomNodeType;
    });

    const sortedNodes = [...mergedNodes].sort((a, b) =>
      a.id.localeCompare(b.id)
    );
    const sortedEdges = [...edges].sort((a, b) => a.id.localeCompare(b.id));
    const sortedSubgraphs = [...subgraphs].sort((a, b) =>
      a.id.localeCompare(b.id)
    );

    const json = JSON.stringify(
      {
        projectId,
        projectName,
        nodes: sortedNodes,
        edges: sortedEdges,
        subgraphs: sortedSubgraphs,
      },
      null,
      2
    );
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph-export-' + (projectName ?? projectId ?? '') + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }
);
