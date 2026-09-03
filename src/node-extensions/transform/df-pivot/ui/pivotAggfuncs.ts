export const PIVOT_AGG_FUNCS = [
  'mean',
  'sum',
  'count',
  'first',
  'last',
] as const;

export const PIVOT_DEFAULT_AGG_FUNC = 'first';

export type PivotAggFunc = (typeof PIVOT_AGG_FUNCS)[number];

const NON_NUMERIC_PIVOT_AGG_FUNCS: PivotAggFunc[] = ['count', 'first', 'last'];
const ALL_PIVOT_AGG_FUNCS: PivotAggFunc[] = [...PIVOT_AGG_FUNCS];

const PIVOT_AGG_FUNC_SET = new Set<string>(PIVOT_AGG_FUNCS);

function unwrapNullableDtype(dtype: string): string {
  let current = dtype.trim().toUpperCase();

  while (current.startsWith('NULLABLE(') && current.endsWith(')')) {
    current = current.slice('NULLABLE('.length, -1).trim().toUpperCase();
  }

  return current;
}

function isNumericDtype(dtype: string): boolean {
  return /(INT|INTEGER|BIGINT|SMALLINT|TINYINT|UINT|FLOAT|DOUBLE|DECIMAL|NUMERIC|REAL|NUMBER)/.test(
    dtype
  );
}

function isBooleanDtype(dtype: string): boolean {
  return /(BOOL|BOOLEAN)/.test(dtype);
}

function isTimedeltaDtype(dtype: string): boolean {
  return /(TIMEDELTA|DURATION|INTERVAL)/.test(dtype);
}

function isTemporalDtype(dtype: string): boolean {
  return /(DATETIME|TIMESTAMP|DATE|TIME)/.test(dtype);
}

function isStringLikeDtype(dtype: string): boolean {
  return /(STRING|TEXT|VARCHAR|CHAR|UUID)/.test(dtype);
}

function isCategoryLikeDtype(dtype: string): boolean {
  return /(CATEGORY|ENUM)/.test(dtype);
}

function normalizeDtype(dtype?: string | null): string | null {
  if (!dtype) {
    return null;
  }

  const normalized = unwrapNullableDtype(String(dtype));
  return normalized.length > 0 ? normalized : null;
}

export function isPivotAggFunc(
  value: string | null | undefined
): value is PivotAggFunc {
  return value != null && PIVOT_AGG_FUNC_SET.has(value);
}

export function getAllowedPivotAggFuncs(dtype?: string | null): PivotAggFunc[] {
  const normalizedDtype = normalizeDtype(dtype);

  if (!normalizedDtype) {
    return NON_NUMERIC_PIVOT_AGG_FUNCS;
  }

  if (
    isNumericDtype(normalizedDtype) ||
    isBooleanDtype(normalizedDtype) ||
    isTimedeltaDtype(normalizedDtype)
  ) {
    return ALL_PIVOT_AGG_FUNCS;
  }

  if (
    isTemporalDtype(normalizedDtype) ||
    isStringLikeDtype(normalizedDtype) ||
    isCategoryLikeDtype(normalizedDtype)
  ) {
    return NON_NUMERIC_PIVOT_AGG_FUNCS;
  }

  return NON_NUMERIC_PIVOT_AGG_FUNCS;
}

export function isPivotAggFuncAllowed(
  func: string | null | undefined,
  dtype?: string | null
): func is PivotAggFunc {
  return isPivotAggFunc(func) && getAllowedPivotAggFuncs(dtype).includes(func);
}

export function normalizePivotAggFunc(
  func: string | null | undefined,
  dtype?: string | null,
  fallback: PivotAggFunc = PIVOT_DEFAULT_AGG_FUNC
): PivotAggFunc {
  if (isPivotAggFuncAllowed(func, dtype)) {
    return func;
  }

  const allowedFuncs = getAllowedPivotAggFuncs(dtype);
  if (allowedFuncs.includes(fallback)) {
    return fallback;
  }

  return allowedFuncs[0] ?? PIVOT_DEFAULT_AGG_FUNC;
}
