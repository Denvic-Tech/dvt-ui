import { useCallback } from 'react';
import { Edge, MarkerType } from '@xyflow/react';

import { useNodeConnectionValidation } from '@/features/node/validate-node-connection';

import {
  CustomNodeType,
  generateShortEdgeID,
} from '@/entities/project-editor/graph';

/**
 * Hook for automatic reconnection of nodes when a middle node is deleted.
 * If a deleted node has both incoming and outgoing edges, and the output
 * of the source node is compatible with the input of the target node,
 * a new edge will be created connecting them.
 */
export const useAutoReconnectNodes = () => {
  const { isValidConnection } = useNodeConnectionValidation();

  /**
   * Calculate new edges that should be created when nodes are deleted.
   *
   * @param nodesToDelete - Nodes being deleted
   * @param allEdges - All current edges in the graph
   * @returns Array of new edges to create
   */
  const calculateReconnectionEdges = useCallback(
    (nodesToDelete: CustomNodeType[], allEdges: Edge[]): Edge[] => {
      const newEdgesToCreate: Edge[] = [];

      // Process each node being deleted
      for (const node of nodesToDelete) {
        const nodeID = node.id;

        // Find all incoming edges (edges pointing TO this node)
        const incomingEdges = allEdges.filter(edge => edge.target === nodeID);

        // Find all outgoing edges (edges FROM this node)
        const outgoingEdges = allEdges.filter(edge => edge.source === nodeID);

        // If the node has both incoming and outgoing edges, try to reconnect
        if (incomingEdges.length > 0 && outgoingEdges.length > 0) {
          // Try all combinations of incoming and outgoing edges
          for (const incomingEdge of incomingEdges) {
            for (const outgoingEdge of outgoingEdges) {
              // Skip if handles are not defined
              if (!incomingEdge.sourceHandle || !outgoingEdge.targetHandle) {
                continue;
              }

              // Create a potential new connection from source of incoming to target of outgoing
              const potentialConnection = {
                source: incomingEdge.source,
                sourceHandle: incomingEdge.sourceHandle,
                target: outgoingEdge.target,
                targetHandle: outgoingEdge.targetHandle,
              };

              // Check if this connection is valid (types are compatible)
              if (isValidConnection(potentialConnection)) {
                // Check if this edge doesn't already exist
                const edgeExists = allEdges.some(
                  edge =>
                    edge.source === potentialConnection.source &&
                    edge.target === potentialConnection.target &&
                    edge.sourceHandle === potentialConnection.sourceHandle &&
                    edge.targetHandle === potentialConnection.targetHandle
                );

                // Also check if we're not creating a duplicate in newEdgesToCreate
                const duplicateInNew = newEdgesToCreate.some(
                  edge =>
                    edge.source === potentialConnection.source &&
                    edge.target === potentialConnection.target &&
                    edge.sourceHandle === potentialConnection.sourceHandle &&
                    edge.targetHandle === potentialConnection.targetHandle
                );

                if (!edgeExists && !duplicateInNew) {
                  // Create the new edge
                  const newEdge: Edge = {
                    id: generateShortEdgeID(),
                    source: potentialConnection.source,
                    target: potentialConnection.target,
                    sourceHandle: potentialConnection.sourceHandle,
                    targetHandle: potentialConnection.targetHandle,
                    type: 'custom',
                    markerEnd: { type: MarkerType.ArrowClosed },
                  };

                  newEdgesToCreate.push(newEdge);
                }
              }
            }
          }
        }
      }

      return newEdgesToCreate;
    },
    [isValidConnection]
  );

  return {
    calculateReconnectionEdges,
  };
};
