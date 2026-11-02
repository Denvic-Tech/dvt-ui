import type {
  ColumnDescriptionPatch,
  NodeField,
} from '@/entities/data/lineage';

export type { ColumnDescriptionPatch, NodeField };

/** Минимум строки согласования, нужный для связи колонки БД с колонкой DF. */
export type WriteColumnResolutionRowLike = {
  db_name?: string | null;
  source_name?: string | null;
};
