import type {
  ExplainStep,
  FieldExplanation,
  LineageDescriptionProvenance,
  LineageOp,
  LineageRef,
  NodeField,
  NodeFieldsStatus,
} from './types';

interface LineageOpAppearance {
  label: string;
  description: string;
  /**
   * Короткая пометка изменения для списка колонок; `null` — колонка
   * дошла до ноды без изменений.
   */
  change: string | null;
}

export const LINEAGE_OP_APPEARANCE: Record<LineageOp, LineageOpAppearance> = {
  source: {
    label: 'Из источника',
    description: 'Колонка прочитана из источника данных этой нодой.',
    change: null,
  },
  pass: {
    label: 'Без изменений',
    description: 'Колонка прошла через ноду без изменений.',
    change: null,
  },
  rename: {
    label: 'Переименована',
    description: 'Колонка пришла на вход под другим именем.',
    change: 'имя',
  },
  compute: {
    label: 'Вычислена',
    description: 'Значения колонки вычислены из других колонок.',
    change: 'новая',
  },
  aggregate: {
    label: 'Агрегирована',
    description: 'Значения колонки получены агрегацией строк.',
    change: 'агрегат',
  },
  merge: {
    label: 'Слита',
    description: 'Колонка объединена из нескольких входов.',
    change: 'слита',
  },
  unknown: {
    label: 'Не определено',
    description: 'Не удалось определить, как нода получила колонку.',
    change: 'неизвестно',
  },
};

/** Изменила ли нода колонку (иначе она пришла с входа или из источника как есть). */
export const isFieldChanged = (field: Pick<NodeField, 'op'>): boolean =>
  LINEAGE_OP_APPEARANCE[field.op].change !== null;

interface LineageProvenanceAppearance {
  label: string;
  description: string;
}

export const LINEAGE_DESCRIPTION_PROVENANCE_APPEARANCE: Record<
  LineageDescriptionProvenance,
  LineageProvenanceAppearance
> = {
  declared: {
    label: 'Задано вручную',
    description: 'Описание задано пользователем в каталоге данных.',
  },
  source: {
    label: 'Из источника',
    description: 'Комментарий к колонке, прочитанный из источника.',
  },
  inherited: {
    label: 'Унаследовано',
    description: 'Описание унаследовано от поля источника без изменений.',
  },
  derived: {
    label: 'Выведено',
    description: 'Описание собрано из описаний исходных колонок.',
  },
  none: {
    label: 'Без описания',
    description: 'У колонки нет описания.',
  },
  unknown: {
    label: 'Неизвестно',
    description: 'Происхождение описания не определено.',
  },
};

interface NodeFieldsStatusAppearance {
  label: string;
  description: string;
  severity: 'success' | 'warning' | 'error';
}

export const NODE_FIELDS_STATUS_APPEARANCE: Record<
  NodeFieldsStatus,
  NodeFieldsStatusAppearance
> = {
  resolved: {
    label: 'Состав определён',
    description: 'Все колонки порта восстановлены.',
    severity: 'success',
  },
  partially_resolved: {
    label: 'Определён частично',
    description: 'Часть колонок или их происхождение восстановить не удалось.',
    severity: 'warning',
  },
  unresolved: {
    label: 'Не определён',
    description: 'Состав колонок порта восстановить не удалось.',
    severity: 'error',
  },
};

const uniqueNonEmpty = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(values.filter((value): value is string => Boolean(value)))
  );

/** Колонки, из которых получено поле (по ссылкам `deps`), без дублей. */
export const getFieldDependencyColumns = (field: NodeField): string[] =>
  uniqueNonEmpty((field.deps ?? []).map(dep => dep.column ?? dep.field_id));

/**
 * Прежнее имя переименованной колонки или `null`, если операция не rename
 * либо имя восстановить не удалось.
 */
export const getFieldPreviousName = (field: NodeField): string | null => {
  if (field.op !== 'rename') {
    return null;
  }

  const [previous] = getFieldDependencyColumns(field);
  const candidate = previous ?? field.origin.column ?? null;
  return candidate && candidate !== field.name ? candidate : null;
};

export const isSameLineageRef = (
  left: LineageRef | null | undefined,
  right: LineageRef | null | undefined
): boolean => Boolean(left && right && left.key === right.key);

/** Фильтр по подстроке в имени, описании или исходных колонках. */
export const filterNodeFields = (
  fields: NodeField[],
  query: string
): NodeField[] => {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return fields;
  }

  return fields.filter(field =>
    [
      field.name,
      field.description,
      ...getFieldDependencyColumns(field),
      field.origin.column,
    ].some(value => value?.toLowerCase().includes(needle))
  );
};

export interface ExplainTreeNode {
  step: ExplainStep;
  children: ExplainTreeNode[];
}

/**
 * Дерево объяснения с корнем в запрошенной колонке: дети узла — его прямые
 * родители по lineage (для `upstream`) или потребители (для `downstream`).
 *
 * Если бэкенд отдаёт `deps`, связи берутся из них. Иначе дерево строится по
 * глубине: шаг глубины N+1 считается ребёнком первого ещё не занятого шага
 * глубины N, что точно для линейных цепочек и приближённо для ветвящихся.
 */
export const buildExplainTree = (
  explanation: Pick<FieldExplanation, 'root' | 'steps'>
): ExplainTreeNode | null => {
  const steps = explanation.steps ?? [];
  if (!steps.length) {
    return null;
  }

  const byKey = new Map(steps.map(step => [step.ref.key, step]));
  const root = byKey.get(explanation.root.key) ?? steps[0];
  const hasDeps = steps.some(step => Array.isArray(step.deps));
  const visited = new Set<string>();

  const build = (step: ExplainStep): ExplainTreeNode => {
    visited.add(step.ref.key);

    const childSteps = hasDeps
      ? (step.deps ?? [])
          .map(dep => byKey.get(dep.key))
          .filter(
            (candidate): candidate is ExplainStep =>
              Boolean(candidate) && !visited.has(candidate!.ref.key)
          )
      : steps.filter(
          candidate =>
            candidate.depth === step.depth + 1 &&
            !visited.has(candidate.ref.key)
        );

    // Помечаем детей до рекурсии, иначе сиблинги одной глубины в режиме
    // без `deps` разберут друг друга как собственных потомков.
    childSteps.forEach(child => visited.add(child.ref.key));
    return { step, children: childSteps.map(build) };
  };

  return build(root);
};

/** Шаги дерева в порядке обхода в глубину с уровнем вложенности для отрисовки. */
export const flattenExplainTree = (
  tree: ExplainTreeNode | null
): Array<{ step: ExplainStep; level: number; isLast: boolean }> => {
  const result: Array<{ step: ExplainStep; level: number; isLast: boolean }> =
    [];
  const walk = (node: ExplainTreeNode, level: number, isLast: boolean) => {
    result.push({ step: node.step, level, isLast });
    node.children.forEach((child, index) =>
      walk(child, level + 1, index === node.children.length - 1)
    );
  };
  if (tree) {
    walk(tree, 0, true);
  }
  return result;
};

export interface LineagePathRow {
  step: ExplainStep;
  /** Прямые входы шага — следующие шаги ближе к источнику. */
  inputs: ExplainStep[];
  /** Уровень ветвления: 0 для основной цепочки, +1 на каждую развилку. */
  branch: number;
  /**
   * Поле датасета, из которого нода-источник прочитала колонку. Отдельным
   * шагом не показывается: «Из таблицы …» выводится в строке самой ноды.
   */
  sourceRef: LineageRef | null;
  /** Сколько шагов без изменений свёрнуто между этой строкой и предыдущей. */
  collapsedBefore: number;
  /** Шаг без изменений внутри цепочки (виден только в режиме «Весь путь»). */
  isPassThrough: boolean;
}

export interface LineagePath {
  rows: LineagePathRow[];
  /** Число шагов в режиме «Весь путь». */
  totalCount: number;
  /** Число шагов в режиме «Только изменения». */
  changesCount: number;
}

/**
 * Путь колонки сверху вниз: от текущей ноды к источникам. Шаги `pass` в
 * середине цепочки (не корень и с единственным входом) при `showAll = false`
 * сворачиваются в счётчик `collapsedBefore` следующей видимой строки.
 */
export const buildLineagePath = (
  tree: ExplainTreeNode | null,
  showAll: boolean
): LineagePath => {
  const rows: LineagePathRow[] = [];
  let totalCount = 0;
  let passThroughCount = 0;

  const walk = (
    node: ExplainTreeNode,
    branch: number,
    collapsedBefore: number,
    isRoot: boolean
  ) => {
    let children = node.children;
    let sourceRef: LineageRef | null = null;
    const [onlyChild] = children;

    if (
      node.step.op === 'source' &&
      node.step.ref.kind === 'node' &&
      children.length === 1 &&
      onlyChild.step.ref.kind === 'ds' &&
      !onlyChild.children.length
    ) {
      sourceRef = onlyChild.step.ref;
      children = [];
    }

    const isPassThrough =
      !isRoot && node.step.op === 'pass' && children.length === 1;
    totalCount += 1;
    if (isPassThrough) {
      passThroughCount += 1;
    }

    if (isPassThrough && !showAll) {
      walk(children[0], branch, collapsedBefore + 1, false);
      return;
    }

    rows.push({
      step: node.step,
      inputs: children.map(child => child.step),
      branch,
      sourceRef,
      collapsedBefore,
      isPassThrough,
    });

    const childBranch = children.length > 1 ? branch + 1 : branch;
    children.forEach(child => walk(child, childBranch, 0, false));
  };

  if (tree) {
    walk(tree, 0, 0, true);
  }

  return {
    rows,
    totalCount,
    changesCount: totalCount - passThroughCount,
  };
};

/** Минимум о ребре графа, нужный для сопоставления с шагами lineage. */
export interface LineageGraphEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
}

export interface LineageChain {
  nodeIDs: string[];
  edgeIDs: string[];
}

const stripOutputPrefix = (handle: string) => handle.replace(/^output-/, '');

/**
 * Ноды и рёбра холста, по которым колонка дошла до текущей ноды. Поля
 * датасетов на холсте не рисуются и пропускаются. Ребро ищется между
 * нодой шага и ближайшей нижестоящей нодой (другой) по выходному порту
 * шага; без порта подходит любое ребро между этими нодами.
 */
export const collectLineageChain = (
  tree: ExplainTreeNode | null,
  edges: readonly LineageGraphEdge[]
): LineageChain => {
  const nodeIDs = new Set<string>();
  const edgeIDs = new Set<string>();

  const walk = (node: ExplainTreeNode, consumerNodeID: string | null) => {
    const { step } = node;
    const nodeID =
      step.ref.kind === 'node' ? (step.node_id ?? step.ref.node_id) : null;

    if (nodeID) {
      nodeIDs.add(nodeID);

      if (consumerNodeID && consumerNodeID !== nodeID) {
        const port = step.port ?? step.ref.port ?? null;
        edges.forEach(edge => {
          if (
            edge.source === nodeID &&
            edge.target === consumerNodeID &&
            (!port ||
              !edge.sourceHandle ||
              stripOutputPrefix(edge.sourceHandle) === stripOutputPrefix(port))
          ) {
            edgeIDs.add(edge.id);
          }
        });
      }
    }

    const nextConsumer = nodeID ?? consumerNodeID;
    node.children.forEach(child => walk(child, nextConsumer));
  };

  if (tree) {
    walk(tree, null);
  }

  return { nodeIDs: Array.from(nodeIDs), edgeIDs: Array.from(edgeIDs) };
};
