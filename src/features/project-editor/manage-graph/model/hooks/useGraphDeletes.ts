import { useCallback } from 'react';
import type { Edge } from '@xyflow/react';
import type { Dispatch, SetStateAction } from 'react';

import { useAppDispatch } from '@/app/providers/store';

import { CustomNodeType, graphActions } from '@/entities/project-editor/graph';

interface UseGraphDeletesProps {
  setGraphNodes: Dispatch<SetStateAction<CustomNodeType[]>>;
  setGraphEdges: Dispatch<SetStateAction<Edge[]>>;
}

export const useGraphDeletes = ({
  setGraphNodes,
  setGraphEdges,
}: UseGraphDeletesProps) => {
  const dispatch = useAppDispatch();

  const deleteGraphNodes = useCallback(
    async (nodesToDelete: CustomNodeType[]) => {
      const nodeIDs = nodesToDelete.map(node => node.id);
      setGraphNodes(nodes => nodes.filter(node => !nodeIDs.includes(node.id)));
      dispatch(graphActions.deleteNodes({ nodes: nodesToDelete }));
    },
    [dispatch, setGraphNodes]
  );

  const deleteGraphEdges = useCallback(
    async (edgesToDelete: Edge[]) => {
      const edgeIDs = edgesToDelete.map(edge => edge.id);
      setGraphEdges(edges => edges.filter(edge => !edgeIDs.includes(edge.id)));
      dispatch(graphActions.deleteEdges({ edges: edgesToDelete }));
    },
    [dispatch, setGraphEdges]
  );

  const deleteGraphEntities = useCallback(
    // TODO: Optimize
    async (nodesToDelete: CustomNodeType[], edgesToDelete: Edge[]) => {
      const nodeIDs = nodesToDelete.map(node => node.id);
      const edgeIDs = edgesToDelete.map(edge => edge.id);
      setGraphNodes(nodes => nodes.filter(node => !nodeIDs.includes(node.id)));
      setGraphEdges(edges => edges.filter(edge => !edgeIDs.includes(edge.id)));
      dispatch(graphActions.deleteNodes({ nodes: nodesToDelete }));
      dispatch(graphActions.deleteEdges({ edges: edgesToDelete }));
    },
    [dispatch, setGraphEdges, setGraphNodes]
  );

  return {
    deleteGraphNodes,
    deleteGraphEdges,
    deleteGraphEntities,
  };
};
