import { skipToken } from '@reduxjs/toolkit/query';

import { useAppSelector } from '@/app/providers/store';

import {
  getDatasetQualifiedName,
  useGetDatasetQuery,
} from '@/entities/data/data-catalog';
import type { LineageRef } from '@/entities/data/lineage';
import { selectNodeDataMap } from '@/entities/project-editor/graph';

const shortId = (id: string) => (id.length > 8 ? `${id.slice(0, 8)}…` : id);

export interface LineageRefLabel {
  /** Таблица источника или имя ноды. */
  owner: string;
  /** Колонка внутри владельца. */
  column: string | null;
  /** `владелец.колонка` для подписи в одну строку. */
  text: string;
}

const joinLabel = (owner: string, column: string | null) =>
  column ? `${owner}.${column}` : owner;

/**
 * Человекочитаемая ссылка на поле: `таблица.колонка` для датасета каталога
 * или `Имя ноды.колонка` для колонки на порту другой ноды.
 */
export const useLineageRefLabel = (
  ref: LineageRef | null | undefined
): LineageRefLabel | null => {
  const datasetId = ref?.kind === 'ds' ? ref.dataset_id : null;
  const { data: dataset } = useGetDatasetQuery(
    datasetId ? { datasetId, includeFields: true } : skipToken
  );
  const nodeData = useAppSelector(state =>
    ref?.kind === 'node' && ref.node_id
      ? selectNodeDataMap(state)[ref.node_id]
      : undefined
  );

  if (!ref) {
    return null;
  }

  if (ref.kind === 'ds') {
    const field = dataset?.fields?.find(item => item.id === ref.field_id);
    const owner = dataset
      ? getDatasetQualifiedName(dataset.locator)
      : datasetId
        ? `датасет ${shortId(datasetId)}`
        : 'источник';
    const column = field?.name ?? ref.column ?? null;
    return { owner, column, text: joinLabel(owner, column) };
  }

  const owner =
    nodeData?.displayName ||
    nodeData?.name ||
    (ref.node_id ? `нода ${shortId(ref.node_id)}` : 'нода');
  const column = ref.column ?? null;
  return { owner, column, text: joinLabel(owner, column) };
};
