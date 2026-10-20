import type {
  ExplainStepSchema,
  FieldExplanationSchema,
  LineageGapSchema,
  LineageRefSchema,
  NodeFieldSchema,
  NodeFieldsResponseSchema,
} from '@/shared/gatewayClient';

export type LineageRef = LineageRefSchema;
export type NodeField = NodeFieldSchema;
export type NodeFields = NodeFieldsResponseSchema;
export type LineageGap = LineageGapSchema;

/**
 * Шаг объяснения. `deps` — прямые родители шага; бэкенд отдаёт их начиная
 * с версии, где цепочку можно восстановить как дерево, поэтому поле
 * необязательное: без него дерево строится по глубине.
 */
export type ExplainStep = ExplainStepSchema & { deps?: LineageRef[] };

export type FieldExplanation = Omit<FieldExplanationSchema, 'steps'> & {
  steps?: ExplainStep[];
};

/** Операция, которой нода получила колонку на своём порту. */
export type LineageOp = NodeFieldSchema['op'];

/** Откуда взялось описание колонки. */
export type LineageDescriptionProvenance = NonNullable<
  NodeFieldSchema['description_provenance']
>;

/** Насколько полно бэкенд восстановил состав колонок порта. */
export type NodeFieldsStatus = NodeFieldsResponseSchema['status'];

export type ExplainDirection = FieldExplanationSchema['direction'];

export interface GetNodeFieldsArg {
  projectId: string;
  nodeId: string;
  /** Порт ноды; без него бэкенд выбирает основной выход (или вход у синков). */
  port?: string | null;
}

export interface GetFieldExplanationArg {
  projectId: string;
  nodeId: string;
  column: string;
  port?: string | null;
  direction?: ExplainDirection;
  maxDepth?: number;
}
