import { useCallback } from 'react';
import type { Edge } from '@xyflow/react';
import type { Dispatch, SetStateAction } from 'react';

import { useAppDispatch } from '@/app/providers/store';

import {
  applyCustomNodeDataDefaults,
  CustomNodeType,
  graphActions,
} from '@/entities/project-editor/graph';

import type { SubgraphUiSchema } from '@/shared/gatewayClient';

interface UseGraphCreatesProps {
  setGraphNodes: Dispatch<SetStateAction<CustomNodeType[]>>;
  setGraphEdges: Dispatch<SetStateAction<Edge[]>>;
  setSubgraphs?: Dispatch<SetStateAction<SubgraphUiSchema[]>>;
}

export const useGraphCreates = ({
  setGraphNodes,
  setGraphEdges,
  setSubgraphs,
}: UseGraphCreatesProps) => {
  const dispatch = useAppDispatch();

  const normalizeNodesToCreate = useCallback(
    (nodesToCreate: CustomNodeType[]) =>
      nodesToCreate.map(node => ({
        ...node,
        data: applyCustomNodeDataDefaults(node.data),
      })),
    []
  );

  const createGraphNodes = useCallback(
    async (nodesToCreate: CustomNodeType[]) => {
      const normalizedNodesToCreate = normalizeNodesToCreate(nodesToCreate);
      setGraphNodes(nodes => [...nodes, ...normalizedNodesToCreate]);
      dispatch(graphActions.createNodes({ nodes: normalizedNodesToCreate }));
    },
    [dispatch, normalizeNodesToCreate, setGraphNodes]
  );

  const createGraphEdges = useCallback(
    async (edgesToCreate: Edge[]) => {
      setGraphEdges(edges => [...edges, ...edgesToCreate]);
      dispatch(graphActions.createEdges({ edges: edgesToCreate }));
    },
    [dispatch, setGraphEdges]
  );

  const createGraphEntities = useCallback(
    async (
      nodesToCreate: CustomNodeType[],
      edgesToCreate: Edge[],
      subgraphsToCreate: SubgraphUiSchema[] = []
    ) => {
      const normalizedNodesToCreate = normalizeNodesToCreate(nodesToCreate);
      setGraphNodes(nodes => [...nodes, ...normalizedNodesToCreate]);
      setGraphEdges(edges => [...edges, ...edgesToCreate]);
      setSubgraphs?.(subgraphs => [...subgraphs, ...subgraphsToCreate]);
      dispatch(
        graphActions.createEntities({
          nodes: normalizedNodesToCreate,
          edges: edgesToCreate,
          subgraphs: subgraphsToCreate,
        })
      );
    },
    [
      dispatch,
      normalizeNodesToCreate,
      setGraphEdges,
      setGraphNodes,
      setSubgraphs,
    ]
  );

  return {
    createGraphNodes,
    createGraphEdges,
    createGraphEntities,
  };
};
