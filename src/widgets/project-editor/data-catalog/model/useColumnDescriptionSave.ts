import { useCallback } from 'react';

import { useAppDispatch } from '@/app/providers/store';

import { useSetDatasetDescriptionsMutation } from '@/entities/data/data-catalog';
import {
  type DescriptionTarget,
  invalidateProjectColumns,
  useSetNodeColumnDescriptionsMutation,
} from '@/entities/data/lineage';

export interface SaveColumnDescriptionInput {
  target: DescriptionTarget;
  /** `null` удаляет описание. */
  description: string | null;
}

const errorMessage = (error: unknown): string | null => {
  if (!error) {
    return null;
  }
  return typeof error === 'object' && 'message' in error
    ? String((error as { message: unknown }).message)
    : 'Не удалось сохранить описание.';
};

/**
 * Запись описания строки общего слоя в её цель: аннотация ноды (`project`) или
 * поле таблицы (`global`). После записи в таблицу общий список колонок
 * перезапрашивается: наследование могло измениться во всём проекте.
 */
export const useColumnDescriptionSave = (projectId: string | null) => {
  const dispatch = useAppDispatch();
  const [patchNode, nodeState] = useSetNodeColumnDescriptionsMutation();
  const [patchDataset, datasetState] = useSetDatasetDescriptionsMutation();

  const save = useCallback(
    async ({ target, description }: SaveColumnDescriptionInput) => {
      if (!projectId) {
        return false;
      }

      if (target.scope === 'global') {
        if (!target.dataset_id || !target.field_id) {
          return false;
        }
        const result = await patchDataset({
          datasetId: target.dataset_id,
          fields: [{ field_id: target.field_id, description }],
        });
        if ('error' in result) {
          return false;
        }
        dispatch(invalidateProjectColumns(projectId));
        return true;
      }

      if (!target.node_id || !target.column) {
        return false;
      }
      const result = await patchNode({
        projectId,
        nodeId: target.node_id,
        port: target.port ?? null,
        fields: [{ column: target.column, description }],
      });
      return !('error' in result);
    },
    [dispatch, patchDataset, patchNode, projectId]
  );

  const reset = useCallback(() => {
    nodeState.reset();
    datasetState.reset();
  }, [datasetState, nodeState]);

  return {
    save,
    reset,
    isSaving: nodeState.isLoading || datasetState.isLoading,
    error: errorMessage(nodeState.error ?? datasetState.error),
  };
};
