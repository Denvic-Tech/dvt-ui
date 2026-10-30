import type {
  ColumnDescriptionPatch,
  NodeField,
  WriteColumnResolutionRowLike,
} from './catalogDescriptions.types';
import { type CommentOverrides, normalizeComment } from './columnComments';

export type { WriteColumnResolutionRowLike } from './catalogDescriptions.types';

/** Описания каталога по имени колонки входного DataFrame (порт `df` Write-ноды). */
export type CatalogDescriptions = Record<string, NodeField>;

export const buildCatalogDescriptions = (
  fields: readonly NodeField[] | null | undefined
): CatalogDescriptions => {
  const result: CatalogDescriptions = {};
  for (const field of fields ?? []) {
    result[field.name] = field;
  }
  return result;
};

/**
 * Baseline комментария колонки: описание из каталога (своё или унаследованное),
 * иначе комментарий из метаданных входа, иначе null.
 */
export const resolveCommentBaseline = (
  sourceName: string | null | undefined,
  catalog: CatalogDescriptions | null | undefined,
  metadataComment: string | null | undefined
): string | null => {
  const field = sourceName ? catalog?.[sourceName] : undefined;
  const text = field?.description?.trim();
  if (text) return text;
  return normalizeComment(metadataComment);
};

/**
 * Подпись провенанса под редактором. `ownerLabel` — человекочитаемый источник
 * унаследованного описания (`таблица.колонка` или `Нода.колонка`).
 */
export const describeCatalogProvenance = (
  field: NodeField | null | undefined,
  ownerLabel?: string | null
): string | null => {
  if (!field?.description?.trim()) return null;
  switch (field.description_provenance) {
    case 'declared':
      return 'своё описание';
    case 'source':
      return 'комментарий БД источника';
    case 'inherited':
      return `из каталога: наследуется от ${ownerLabel ?? 'источника'}`;
    default:
      return null;
  }
};

type BuildPatchArgs = {
  /** Правки комментариев новых/типизированных колонок, ключ — имя колонки DF. */
  typedOverrides?: CommentOverrides | undefined;
  /** Правки комментариев колонок существующей таблицы, ключ — имя колонки в БД. */
  dbOverrides?: CommentOverrides | undefined;
  /** Строки согласования: связывают имя в БД с именем колонки DF. */
  rows?: readonly WriteColumnResolutionRowLike[] | null | undefined;
  catalog?: CatalogDescriptions | null | undefined;
  /** Комментарии входа по имени колонки DF: fallback baseline. */
  metadataComments?: Record<string, string | null | undefined> | undefined;
};

/**
 * Что записать в каталог аннотациями входного порта Write-ноды: только правки,
 * отличающиеся от baseline. Пустой текст означает удаление (`description: null`).
 */
export const buildCatalogDescriptionPatch = ({
  typedOverrides,
  dbOverrides,
  rows,
  catalog,
  metadataComments,
}: BuildPatchArgs): ColumnDescriptionPatch[] => {
  const sourceByDbName = new Map<string, string>();
  for (const row of rows ?? []) {
    if (row.db_name && row.source_name) {
      sourceByDbName.set(row.db_name, row.source_name);
    }
  }

  const drafts = new Map<string, string | null>();
  for (const [sourceName, value] of Object.entries(typedOverrides ?? {})) {
    drafts.set(sourceName, normalizeComment(value));
  }
  for (const [dbName, value] of Object.entries(dbOverrides ?? {})) {
    const sourceName = sourceByDbName.get(dbName);
    if (!sourceName) continue;
    drafts.set(sourceName, normalizeComment(value));
  }

  const patch: ColumnDescriptionPatch[] = [];
  for (const [sourceName, value] of drafts) {
    const baseline = resolveCommentBaseline(
      sourceName,
      catalog,
      metadataComments?.[sourceName]
    );
    if (value === baseline) continue;
    patch.push({ column: sourceName, description: value });
  }
  return patch;
};
