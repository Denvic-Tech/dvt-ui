import type {
  DbColumn,
  TableColumnActionInput,
  WriteColumnResolutionRow,
} from '@/shared/gatewayClient';

export type CommentOverrides = Record<string, string | null>;
export const normalizeComment = (
  value: string | null | undefined
): string | null => (value === '' || value == null ? null : value);

export const commentValue = (
  overrides: CommentOverrides | undefined,
  key: string,
  fallback: string | null | undefined
): string | null =>
  overrides && Object.prototype.hasOwnProperty.call(overrides, key)
    ? normalizeComment(overrides[key])
    : normalizeComment(fallback);

export const commentTargetKey = (
  connectionId: string | null | undefined,
  database: string | null | undefined,
  schema: string | null | undefined,
  table: string | null | undefined
): string =>
  JSON.stringify([
    connectionId ?? null,
    database ?? null,
    schema ?? null,
    table ?? null,
  ]);

export function mergeCommentActions(
  actions: TableColumnActionInput[],
  rows: WriteColumnResolutionRow[],
  overrides: CommentOverrides = {},
  sourceOverrides: CommentOverrides = {},
  commentsSupported = true
): TableColumnActionInput[] {
  if (!commentsSupported)
    return actions
      .filter(action => action.type !== 'set_column_comment')
      .map(action =>
        action.column
          ? { ...action, column: { ...action.column, comment: null } }
          : action
      );
  const byTarget = new Map(
    rows.filter(row => row.db_name).map(row => [row.db_name!, row])
  );
  const result: TableColumnActionInput[] = actions
    .filter(action => action.type !== 'set_column_comment')
    .map(action => {
      if (!action.column || action.type === 'drop_column') return action;
      const row =
        byTarget.get(action.column_name) ??
        rows.find(
          item => item.suggested_action?.column_name === action.column_name
        );
      const comment =
        action.type === 'recreate_column'
          ? commentValue(
              overrides,
              action.column_name,
              row ? row.db_comment : action.column.comment
            )
          : commentValue(
              sourceOverrides,
              row?.source_name ?? action.column_name,
              row?.source_comment ?? action.column.comment
            );
      return { ...action, column: { ...action.column, comment } };
    });
  const structuralNames = new Set(result.map(action => action.column_name));
  for (const [name, draft] of Object.entries(overrides)) {
    const row = byTarget.get(name);
    if (
      !row ||
      structuralNames.has(name) ||
      normalizeComment(draft) === normalizeComment(row.db_comment)
    )
      continue;
    result.push({
      type: 'set_column_comment',
      column_name: name,
      comment: normalizeComment(draft),
    });
  }
  return result;
}

export function commentsForRecreatedColumns(
  columns: DbColumn[],
  rows: WriteColumnResolutionRow[],
  overrides: CommentOverrides = {},
  commentsSupported = true
): DbColumn[] {
  if (!commentsSupported)
    return columns.map(column => ({ ...column, comment: null }));
  const byTarget = new Map(
    rows.filter(row => row.db_name).map(row => [row.db_name!, row])
  );
  return columns.map(column => {
    const row = byTarget.get(column.name);
    return row
      ? {
          ...column,
          comment: commentValue(overrides, column.name, row.db_comment),
        }
      : column;
  });
}
