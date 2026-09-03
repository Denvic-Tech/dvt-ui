export const SELECT_VARIABLE_AGG_FUNCS = [
  'first',
  'last',
  'count',
  'sum',
  'mean',
  'min',
  'max',
  'nunique',
  'std',
  'var',
] as const;

export const DEFAULT_SELECT_VARIABLE_AGG_FUNC = 'first';

export type SelectVariableAggFunc = (typeof SELECT_VARIABLE_AGG_FUNCS)[number];

export type SelectedVariableConfig = {
  source_column_name: string;
  agg_func: SelectVariableAggFunc;
};

export type SelectedVariablesValue = Record<string, SelectedVariableConfig>;

export type SelectedVariableDraftRow = {
  id: string;
  variableName: string;
  sourceColumnName: string;
  aggFunc: SelectVariableAggFunc | '';
};

export type SelectedVariableDraftPatch = Partial<
  Omit<SelectedVariableDraftRow, 'id'>
>;

export type SelectedVariableFieldErrors = Partial<
  Record<'variableName' | 'sourceColumnName' | 'aggFunc', string>
>;

export type SelectedVariablesValidationResult = {
  isValid: boolean;
  generalErrors: string[];
  rowErrors: Record<string, SelectedVariableFieldErrors>;
  flatErrors: string[];
  readyRowsCount: number;
};

const NUMERIC_ONLY_AGG_FUNCS = new Set<SelectVariableAggFunc>([
  'sum',
  'mean',
  'std',
  'var',
]);

const COMMON_AGG_FUNCS: SelectVariableAggFunc[] = [
  'first',
  'last',
  'count',
  'nunique',
];

const ORDERED_AGG_FUNCS: SelectVariableAggFunc[] = ['min', 'max'];

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isAggFunc = (value: unknown): value is SelectVariableAggFunc =>
  typeof value === 'string' &&
  SELECT_VARIABLE_AGG_FUNCS.includes(value as SelectVariableAggFunc);

const isNumericLikeDtype = (dtype: string | null | undefined): boolean => {
  if (!dtype) {
    return false;
  }

  const normalized = String(dtype).toUpperCase();
  return (
    normalized.includes('INT') ||
    normalized.includes('FLOAT') ||
    normalized.includes('DOUBLE') ||
    normalized.includes('DECIMAL') ||
    normalized.includes('NUMBER')
  );
};

export const createSelectedVariableDraftRow = (
  id: string,
  overrides: Partial<Omit<SelectedVariableDraftRow, 'id'>> = {}
): SelectedVariableDraftRow => ({
  id,
  variableName: '',
  sourceColumnName: '',
  aggFunc: '',
  ...overrides,
});

export const applySelectedVariableDraftRowPatch = ({
  row,
  patch,
  getColumnDtype,
}: {
  row: SelectedVariableDraftRow;
  patch: SelectedVariableDraftPatch;
  getColumnDtype: (columnName: string) => string | null | undefined;
}): SelectedVariableDraftRow => {
  const hasVariableNamePatch = Object.prototype.hasOwnProperty.call(
    patch,
    'variableName'
  );
  const hasSourceColumnPatch = Object.prototype.hasOwnProperty.call(
    patch,
    'sourceColumnName'
  );
  const hasAggFuncPatch = Object.prototype.hasOwnProperty.call(
    patch,
    'aggFunc'
  );
  const nextRow: SelectedVariableDraftRow = {
    ...row,
    ...patch,
  };

  if (hasSourceColumnPatch) {
    const nextSourceColumnName = nextRow.sourceColumnName.trim();

    if (
      !hasVariableNamePatch &&
      !row.variableName.trim() &&
      nextSourceColumnName
    ) {
      nextRow.variableName = nextSourceColumnName;
    }

    if (!nextSourceColumnName) {
      nextRow.aggFunc = '';
      return nextRow;
    }

    const availableAggFuncs = getAvailableAggFuncsForColumn(
      getColumnDtype(nextSourceColumnName)
    );

    nextRow.aggFunc =
      nextRow.aggFunc &&
      availableAggFuncs.includes(nextRow.aggFunc as SelectVariableAggFunc)
        ? nextRow.aggFunc
        : DEFAULT_SELECT_VARIABLE_AGG_FUNC;

    return nextRow;
  }

  if (hasAggFuncPatch) {
    nextRow.aggFunc =
      typeof nextRow.aggFunc === 'string' && isAggFunc(nextRow.aggFunc)
        ? nextRow.aggFunc
        : '';
  }

  return nextRow;
};

export const normalizeSelectedVariablesValue = (
  value: unknown
): SelectedVariablesValue => {
  if (!isObjectRecord(value)) {
    return {};
  }

  const result: SelectedVariablesValue = {};

  for (const [variableName, rawConfig] of Object.entries(value)) {
    if (!variableName.trim() || !isObjectRecord(rawConfig)) {
      continue;
    }

    const sourceColumnName =
      typeof rawConfig['source_column_name'] === 'string'
        ? rawConfig['source_column_name'].trim()
        : '';
    const aggFunc = rawConfig['agg_func'];

    if (!sourceColumnName || !isAggFunc(aggFunc)) {
      continue;
    }

    result[variableName.trim()] = {
      source_column_name: sourceColumnName,
      agg_func: aggFunc,
    };
  }

  return result;
};

export const hydrateSelectedVariableRows = (
  value: unknown,
  createId: () => string
): SelectedVariableDraftRow[] =>
  Object.entries(normalizeSelectedVariablesValue(value)).map(
    ([variableName, config]) =>
      createSelectedVariableDraftRow(createId(), {
        variableName,
        sourceColumnName: config.source_column_name,
        aggFunc: config.agg_func,
      })
  );

export const serializeSelectedVariableRows = (
  rows: SelectedVariableDraftRow[]
): SelectedVariablesValue => {
  const result: SelectedVariablesValue = {};

  for (const row of rows) {
    const variableName = row.variableName.trim();
    const sourceColumnName = row.sourceColumnName.trim();

    if (!variableName || !sourceColumnName || !isAggFunc(row.aggFunc)) {
      continue;
    }

    result[variableName] = {
      source_column_name: sourceColumnName,
      agg_func: row.aggFunc,
    };
  }

  return result;
};

export const isBlankSelectedVariableRow = (
  row: SelectedVariableDraftRow
): boolean =>
  !row.variableName.trim() && !row.sourceColumnName.trim() && !row.aggFunc;

export const getAvailableAggFuncsForColumn = (
  dtype: string | null | undefined
): SelectVariableAggFunc[] => {
  const funcs = [...COMMON_AGG_FUNCS, ...ORDERED_AGG_FUNCS];

  if (isNumericLikeDtype(dtype)) {
    funcs.push(
      ...SELECT_VARIABLE_AGG_FUNCS.filter(aggFunc =>
        NUMERIC_ONLY_AGG_FUNCS.has(aggFunc)
      )
    );
  }

  return Array.from(new Set(funcs));
};

export const validateSelectedVariableRows = ({
  rows,
  availableColumnNames,
}: {
  rows: SelectedVariableDraftRow[];
  availableColumnNames?: string[];
}): SelectedVariablesValidationResult => {
  const normalizedColumnNames = new Set(
    (availableColumnNames ?? []).map(columnName => columnName.trim())
  );
  const shouldValidateColumnExistence = normalizedColumnNames.size > 0;
  const rowErrors: Record<string, SelectedVariableFieldErrors> = {};
  const generalErrors: string[] = [];
  const meaningfulRows = rows.filter(row => !isBlankSelectedVariableRow(row));
  const nameUsage = new Map<string, string[]>();

  for (const row of meaningfulRows) {
    const variableName = row.variableName.trim();
    const sourceColumnName = row.sourceColumnName.trim();
    const nextErrors: SelectedVariableFieldErrors = {};

    if (!variableName) {
      nextErrors.variableName = 'Укажите имя выходной переменной.';
    } else {
      const usedInRows = nameUsage.get(variableName) ?? [];
      usedInRows.push(row.id);
      nameUsage.set(variableName, usedInRows);
    }

    if (!sourceColumnName) {
      nextErrors.sourceColumnName = 'Выберите колонку DataFrame.';
    } else if (
      shouldValidateColumnExistence &&
      !normalizedColumnNames.has(sourceColumnName)
    ) {
      nextErrors.sourceColumnName =
        'Выбранная колонка отсутствует в подключённом DataFrame.';
    }

    if (!row.aggFunc) {
      nextErrors.aggFunc = 'Выберите функцию агрегации.';
    } else if (!isAggFunc(row.aggFunc)) {
      nextErrors.aggFunc = 'Выбрана неподдерживаемая функция агрегации.';
    }

    if (Object.keys(nextErrors).length > 0) {
      rowErrors[row.id] = nextErrors;
    }
  }

  for (const rowIds of nameUsage.values()) {
    if (rowIds.length < 2) {
      continue;
    }

    for (const rowId of rowIds) {
      rowErrors[rowId] = {
        ...rowErrors[rowId],
        variableName: 'Имя переменной должно быть уникальным.',
      };
    }
  }

  if (meaningfulRows.length === 0) {
    generalErrors.push('Добавьте хотя бы одну переменную для извлечения.');
  }

  const rowIndexById = new Map(rows.map((row, index) => [row.id, index + 1]));
  const flatErrors = [
    ...generalErrors,
    ...Object.entries(rowErrors).flatMap(([rowId, fieldErrors]) =>
      Object.values(fieldErrors)
        .filter((message): message is string => Boolean(message))
        .map(message => `Строка ${rowIndexById.get(rowId) ?? '?'}: ${message}`)
    ),
  ];

  return {
    isValid: generalErrors.length === 0 && Object.keys(rowErrors).length === 0,
    generalErrors,
    rowErrors,
    flatErrors,
    readyRowsCount: Object.keys(serializeSelectedVariableRows(rows)).length,
  };
};
