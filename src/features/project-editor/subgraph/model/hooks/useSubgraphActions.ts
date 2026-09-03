import { useCallback } from 'react';

import { useAppDispatch } from '@/app/providers/store';
import { graphActions } from '@/entities/project-editor/graph';
import type { SubgraphUiSchema } from '@/shared/gatewayClient';

export const useSubgraphActions = () => {
  const dispatch = useAppDispatch();

  const createSubgraphs = useCallback(
    (subgraphs: SubgraphUiSchema[]) => {
      dispatch(graphActions.createSubgraphs({ subgraphs }));
    },
    [dispatch]
  );

  const updateSubgraphs = useCallback(
    (subgraphs: (Partial<SubgraphUiSchema> & { id: string })[]) => {
      dispatch(graphActions.updateSubgraphs({ subgraphs }));
    },
    [dispatch]
  );

  const deleteSubgraphs = useCallback(
    (ids: string[]) => {
      dispatch(graphActions.deleteSubgraphs({ ids }));
    },
    [dispatch]
  );

  const bindNodesToSubgraph = useCallback(
    (items: { id: string; subgraphId: string | null }[]) => {
      dispatch(graphActions.updateNodeSubgraphBindings({ items }));
    },
    [dispatch]
  );

  const bindEdgesToSubgraph = useCallback(
    (items: { id: string; subgraphId: string | null }[]) => {
      dispatch(graphActions.updateEdgeSubgraphBindings({ items }));
    },
    [dispatch]
  );

  return {
    createSubgraphs,
    updateSubgraphs,
    deleteSubgraphs,
    bindNodesToSubgraph,
    bindEdgesToSubgraph,
  };
};
