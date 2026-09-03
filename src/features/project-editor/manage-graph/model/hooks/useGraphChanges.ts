import { useCallback } from 'react';
import type { Edge, EdgeChange, NodeChange, XYPosition } from '@xyflow/react';

import { useAppDispatch } from '@/app/providers/store';

import {
  changeGraphEdges,
  changeGraphNodes,
  CustomNodeType,
  updateGraphNodePositions,
} from '@/entities/project-editor/graph';

interface UseGraphChangeProps {
  onGraphNodesChanges: (changes: NodeChange<CustomNodeType>[]) => void;
  onGraphEdgesChanges: (changes: EdgeChange<Edge>[]) => void;
}

export const useGraphChanges = ({
  onGraphNodesChanges,
  onGraphEdgesChanges,
}: UseGraphChangeProps) => {
  const dispatch = useAppDispatch();

  const onGraphNodesChangeLocal = useCallback(
    async (changes: NodeChange<CustomNodeType>[]) => {
      onGraphNodesChanges(changes);
      if (!changes.length) return;

      const positionUpdates: { nodeID: string; position: XYPosition }[] = [];
      const otherChanges: NodeChange<CustomNodeType>[] = [];

      for (const change of changes) {
        if (change.type === 'position') {
          if (change.dragging) {
            continue;
          }
          const nextPosition = change.position ?? change.positionAbsolute;
          if (!nextPosition) {
            continue;
          }
          positionUpdates.push({
            nodeID: change.id,
            position: { x: nextPosition.x, y: nextPosition.y },
          });
          continue;
        }
        otherChanges.push(change);
      }

      if (otherChanges.length) {
        dispatch(changeGraphNodes(otherChanges));
      }

      if (positionUpdates.length) {
        dispatch(updateGraphNodePositions(positionUpdates));
      }
    },
    [dispatch, onGraphNodesChanges]
  );

  const onGraphEdgesChangeLocal = useCallback(
    async (changes: EdgeChange<Edge>[]) => {
      onGraphEdgesChanges(changes);
      dispatch(changeGraphEdges(changes));
    },
    [dispatch, onGraphEdgesChanges]
  );

  return {
    onGraphNodesChanges: onGraphNodesChangeLocal,
    onGraphEdgesChanges: onGraphEdgesChangeLocal,
  };
};
