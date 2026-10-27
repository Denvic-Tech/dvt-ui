import type {
  ColumnDescriptionPatchSchema,
  ColumnOccurrenceSchema,
  ColumnRowSchema,
  DescriptionTargetSchema,
  ExplainStepSchema,
  FieldExplanationSchema,
  LineageGapSchema,
  LineageRefSchema,
  NodeFieldSchema,
  NodeFieldsResponseSchema,
  ProjectColumnsResponseSchema,
  ProjectOrphanedAnnotationSchema,
  UnresolvedPortSchema,
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

/** Изменение описания колонки: `description: null` удаляет описание ноды. */
export type ColumnDescriptionPatch = ColumnDescriptionPatchSchema;

export interface SetNodeColumnDescriptionsArg {
  projectId: string;
  nodeId: string;
  /** Порт ноды, к колонкам которого относятся описания. */
  port?: string | null;
  fields: ColumnDescriptionPatch[];
}

/** Все колонки проекта: строки-отрезки `rows`, группы по origin, пробелы lineage. */
export type ProjectColumns = ProjectColumnsResponseSchema;

/**
 * Строка общего слоя: отрезок цепочки, на котором не меняются имя колонки и
 * текст описания. Переименование и уточнение в ноде начинают новую строку.
 */
export type ProjectColumnRow = ColumnRowSchema;
export type ColumnOccurrence = ColumnOccurrenceSchema;
/** Куда пишется описание строки: аннотация ноды (`project`) или поле таблицы (`global`). */
export type DescriptionTarget = DescriptionTargetSchema;
export type UnresolvedPort = UnresolvedPortSchema;
export type OrphanedAnnotation = ProjectOrphanedAnnotationSchema;

export interface GetProjectColumnsArg {
  projectId: string;
}
