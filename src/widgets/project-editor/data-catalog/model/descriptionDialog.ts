import {
  type ColumnOccurrence,
  type DescriptionTarget,
  getRowOriginLabel,
  hasRowDescription,
  type ProjectColumnRow,
} from '@/entities/data/lineage';

import {
  type ColumnGroup,
  type ColumnTree,
  getRowChainIndex,
  getRowChainNodes,
} from './columnTree';

/** Что редактируется: описание строки или новое уточнение в ноде цепочки. */
export interface DescriptionEditing {
  rowId: string;
  /** Нода, с которой начнётся уточнение; без неё правится сама строка. */
  occurrence: ColumnOccurrence | null;
}

/** Данные для общего `ColumnDescriptionDialog` из `entities/data/lineage`. */
export interface DescriptionDialogModel {
  title: string;
  name: string;
  meta: string;
  isRefine: boolean;
  /** Текст до этой ноды; показывается только для уточнений. */
  previous: string | null;
  initialValue: string;
  placeholder: string | null;
  hint: string;
  /** Описание всегда пишется в ноду проекта (`scope: 'project'`). */
  target: DescriptionTarget | null;
  canDelete: boolean;
  deleteLabel: string;
}

const occurrenceTarget = (item: ColumnOccurrence): DescriptionTarget => ({
  scope: 'project',
  node_id: item.node_id,
  port: item.port,
  column: item.column,
});

/** Цель в ноде проекта: из `targets` строки, иначе из её стартовой ноды. */
const projectTarget = (row: ProjectColumnRow): DescriptionTarget | null =>
  row.targets?.find(target => target.scope === 'project') ??
  (row.start.node_id && row.start.column
    ? {
        scope: 'project',
        node_id: row.start.node_id,
        port: row.start.port ?? null,
        column: row.start.column,
      }
    : null);

const inheritanceHint = (nodeName: string) =>
  `Запишется в ноду «${nodeName}» и будет наследоваться ниже по цепочке.`;

const previousDescription = (
  tree: ColumnTree,
  group: ColumnGroup,
  chainIndex: number
): string | null => {
  const prev = group.chain[chainIndex - 1];
  const owner = prev ? tree.rowOfOccurrence.get(prev.ref.key) : undefined;
  return owner?.description?.trim() || null;
};

const rowContext = (row: ProjectColumnRow, dependencyNames: string[]) => {
  if (row.kind === 'dataset_field') {
    return getRowOriginLabel(row);
  }
  return dependencyNames.length
    ? `вычисляемая из ${dependencyNames.join(', ')}`
    : `вычисляемая в ноде ${getRowOriginLabel(row)}`;
};

export const getDescriptionDialogModel = (
  tree: ColumnTree,
  editing: DescriptionEditing,
  dependencyNames: string[]
): DescriptionDialogModel | null => {
  const group = tree.groupOf.get(editing.rowId);
  const row = group?.rows.find(item => item.id === editing.rowId);
  if (!group || !row) {
    return null;
  }

  const nodes = getRowChainNodes(row);
  const { occurrence } = editing;

  if (occurrence) {
    const chainIndex = group.chain.findIndex(
      item => item.ref.key === occurrence.ref.key
    );
    return {
      title: 'Уточнить описание',
      name: occurrence.column,
      meta: `с ноды ${chainIndex + 1} «${occurrence.node_name}»`,
      isRefine: true,
      previous: row.description?.trim() || null,
      initialValue: '',
      placeholder: null,
      hint: inheritanceHint(occurrence.node_name),
      target: occurrenceTarget(occurrence),
      canDelete: false,
      deleteLabel: '',
    };
  }

  const chainIndex = getRowChainIndex(group, row);
  const isRefine = row !== group.host;
  // Своё описание — только записанное в ноде; описание поля таблицы
  // (`ds`) здесь не меняется и показывается подсказкой как текущее.
  const own =
    row.description_provenance === 'declared' &&
    row.description_source?.kind !== 'ds'
      ? (row.description ?? '')
      : '';
  const current = !own && hasRowDescription(row) ? row.description : null;

  return {
    title: isRefine
      ? own
        ? 'Уточнение описания'
        : 'Уточнить описание'
      : 'Описание колонки',
    name: row.name,
    meta: isRefine
      ? `с ноды ${chainIndex + 1} «${nodes[0]?.node_name ?? ''}»`
      : rowContext(row, dependencyNames),
    isRefine,
    previous: isRefine ? previousDescription(tree, group, chainIndex) : null,
    initialValue: own,
    placeholder: current ? `Сейчас: ${current}` : null,
    hint: inheritanceHint(nodes[0]?.node_name ?? 'ноду'),
    target: projectTarget(row),
    canDelete: Boolean(own.trim()),
    deleteLabel: isRefine ? 'Убрать уточнение' : 'Удалить',
  };
};
