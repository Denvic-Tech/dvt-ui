import { useCallback, useMemo } from 'react';
import { Edge, useReactFlow } from '@xyflow/react';

import { useAlert } from '@/app/notifications';
import { useAppSelector } from '@/app/providers/store';

import {
  type CustomEdgeType,
  CustomNodeType,
  generateShortEdgeID,
  generateShortNodeID,
  generateShortSubgraphID,
  normalizeSerializedGraph,
} from '@/entities/project-editor/graph';

import type { SubgraphUiSchema } from '@/shared/gatewayClient';
import { wrapConstInputValues } from '@/shared/lib/node-input-values';

export interface ImportGraphParams {
  onCreate: (payload: {
    nodes?: CustomNodeType[];
    edges?: Edge[];
    subgraphs?: SubgraphUiSchema[];
  }) => Promise<void>;
}

const normalizeInputValues = (
  inputValues: Record<string, unknown> | undefined
) => wrapConstInputValues(inputValues ?? {});

const normalizeImportedNode = (node: any): any => {
  if (typeof node !== 'object' || node === null) {
    return node;
  }

  const data =
    typeof node.data === 'object' && node.data !== null ? node.data : {};
  const inputValues =
    'inputValues' in data
      ? data.inputValues
      : 'values' in data
        ? data.values
        : undefined;

  const resolvedDisplayName =
    typeof data.displayName === 'string' && data.displayName.length > 0
      ? data.displayName
      : typeof data.name === 'string'
        ? data.name
        : String(node.id ?? '');

  const resolvedName =
    typeof data.name === 'string' && data.name.length > 0
      ? data.name
      : typeof (node as { name?: unknown }).name === 'string'
        ? String((node as { name?: unknown }).name)
        : resolvedDisplayName;

  const normalizedData = {
    ...data,
    name: resolvedName,
    displayName: resolvedDisplayName,
    inputValues: normalizeInputValues(
      typeof inputValues === 'object' && inputValues !== null
        ? (inputValues as Record<string, unknown>)
        : undefined
    ),
  };

  return {
    ...node,
    data: normalizedData,
  };
};

/**
 * Hook for importing graph from JSON file
 */
export const useImportGraph = ({ onCreate }: ImportGraphParams) => {
  const { fitView } = useReactFlow<CustomNodeType>();
  const { showNotification } = useAlert();
  const nodesByID = useAppSelector(state => state.graph.nodesByID);
  const edgesByID = useAppSelector(state => state.graph.edgesByID);
  const subgraphsByID = useAppSelector(state => state.graph.subgraphsByID);

  const existingNodeIDs = useMemo(
    () => new Set(Object.keys(nodesByID)),
    [nodesByID]
  );
  const existingEdgeIDs = useMemo(
    () => new Set(Object.keys(edgesByID)),
    [edgesByID]
  );
  const existingSubgraphIDs = useMemo(
    () => new Set(Object.keys(subgraphsByID)),
    [subgraphsByID]
  );

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = event => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        showNotification({
          type: 'error',
          title: 'Ошибка при загрузке файла',
          description: 'Файл должен быть в формате JSON.',
          group: 'pipeline-loader',
        });
        console.error(
          `File is not a JSON file. File name: ${file.name}, File type: ${file.type}`
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const text = e.target?.result as string;
          const parsedGraph = JSON.parse(text);

          if (!parsedGraph.nodes) {
            console.error("Invalid JSON format: Missing 'nodes' field.");
            showNotification({
              type: 'error',
              title: 'Некорректный JSON',
              description: 'Отсутствует поле "nodes"',
              group: 'pipeline-loader',
            });
            return;
          }

          const normalizedGraph = normalizeSerializedGraph({
            nodes: Array.isArray(parsedGraph.nodes)
              ? parsedGraph.nodes.map(normalizeImportedNode)
              : [],
            edges: parsedGraph.edges,
            subgraphs: parsedGraph.subgraphs,
          });
          const loadedNodes: CustomNodeType[] = normalizedGraph.nodes;
          const loadedEdges: CustomEdgeType[] = normalizedGraph.edges;
          const loadedSubgraphs: SubgraphUiSchema[] = normalizedGraph.subgraphs;

          const usedNodeIDs = new Set(existingNodeIDs);
          const nodeIdMap = new Map<string, string>();

          const normalizedNodes = loadedNodes.map(node => {
            const currentId = node.id;
            let nextId = currentId;

            if (!nextId || usedNodeIDs.has(nextId)) {
              do {
                nextId = generateShortNodeID();
              } while (usedNodeIDs.has(nextId));
            }

            usedNodeIDs.add(nextId);
            if (currentId && nextId !== currentId) {
              nodeIdMap.set(currentId, nextId);
            }

            return nextId === currentId ? node : { ...node, id: nextId };
          });

          const availableNodeIDs = new Set(
            normalizedNodes.map(node => node.id)
          );
          const usedEdgeIDs = new Set(existingEdgeIDs);
          const usedSubgraphIDs = new Set(existingSubgraphIDs);
          const subgraphIdMap = new Map<string, string>();
          const normalizedEdges: CustomEdgeType[] = loadedEdges
            .map(edge => {
              const source = nodeIdMap.get(edge.source) ?? edge.source;
              const target = nodeIdMap.get(edge.target) ?? edge.target;

              if (
                !source ||
                !target ||
                !availableNodeIDs.has(source) ||
                !availableNodeIDs.has(target)
              ) {
                return null;
              }

              let nextId = edge.id;
              if (!nextId || usedEdgeIDs.has(nextId)) {
                do {
                  nextId = generateShortEdgeID();
                } while (usedEdgeIDs.has(nextId));
              }

              usedEdgeIDs.add(nextId);

              return {
                ...edge,
                id: nextId,
                source,
                target,
              };
            })
            .filter((edge): edge is CustomEdgeType => Boolean(edge));

          const normalizedSubgraphs = loadedSubgraphs.map(subgraph => {
            const currentId = subgraph.id;
            let nextId = currentId;

            if (!nextId || usedSubgraphIDs.has(nextId)) {
              do {
                nextId = generateShortSubgraphID();
              } while (usedSubgraphIDs.has(nextId));
            }

            usedSubgraphIDs.add(nextId);
            if (currentId && nextId !== currentId) {
              subgraphIdMap.set(currentId, nextId);
            }

            return nextId === currentId
              ? subgraph
              : { ...subgraph, id: nextId };
          });

          const nodesWithSubgraphs = normalizedNodes.map(node =>
            node.subgraphId && subgraphIdMap.has(node.subgraphId)
              ? {
                  ...node,
                  subgraphId:
                    subgraphIdMap.get(node.subgraphId) ?? node.subgraphId,
                }
              : node
          );

          const edgesWithSubgraphs = normalizedEdges.map(edge =>
            edge.subgraphId && subgraphIdMap.has(edge.subgraphId)
              ? {
                  ...edge,
                  subgraphId:
                    subgraphIdMap.get(edge.subgraphId) ?? edge.subgraphId,
                }
              : edge
          );

          await onCreate({
            nodes: nodesWithSubgraphs,
            edges: edgesWithSubgraphs,
            subgraphs: normalizedSubgraphs,
          });
          await fitView();

          showNotification({
            type: 'success',
            title: 'Пайплайн загружен',
            description:
              `${normalizedNodes.length} нод(ы), ` +
              `${normalizedEdges.length} ребра(ёв), ` +
              `${normalizedSubgraphs.length} subgraph(ов)`,
            group: 'pipeline-loader',
          });
        } catch (error) {
          showNotification({
            type: 'error',
            title: 'Ошибка при загрузке/создании графа',
            description: `${error}`,
            group: 'pipeline-loader',
          });
          console.error('Invalid JSON or onCreate failed:', error);
        }
      };

      reader.readAsText(file);
    };

    input.click();
  }, [
    existingEdgeIDs,
    existingNodeIDs,
    existingSubgraphIDs,
    fitView,
    onCreate,
    showNotification,
  ]);

  return { handleImport };
};
