import type { DataFrameMetadata } from '@/shared/gatewayClient';

export const BACKEND_FUNCS = [
  'sum',
  'mean',
  'min',
  'max',
  'count',
  'first',
  'last',
  'nunique',
  'std',
  'var',
] as const;

export type BackendFunc = (typeof BACKEND_FUNCS)[number];

const AGG_GROUPS = {
  NUMERIC: ['sum', 'mean', 'std', 'var'] as BackendFunc[],
  COMMON: ['count', 'nunique', 'first', 'last'] as BackendFunc[],
  ORDERED: ['min', 'max'] as BackendFunc[],
};

const isNumericDtype = (dtype: unknown) => {
  const type = String(dtype).toUpperCase();
  return (
    type.includes('INT') ||
    type.includes('FLOAT') ||
    type.includes('DOUBLE') ||
    type.includes('DECIMAL')
  );
};

export const getAvailableAggregationFunctions = ({
  columnName,
  inputMetadata,
  currentFunction,
}: {
  columnName: string;
  inputMetadata?: DataFrameMetadata | undefined;
  currentFunction?: string | undefined;
}): BackendFunc[] => {
  if (!columnName) return [...AGG_GROUPS.COMMON];

  const column = inputMetadata?.columns.find(item => item.name === columnName);
  const options: BackendFunc[] = !column?.dtype
    ? [...BACKEND_FUNCS]
    : [
        ...AGG_GROUPS.COMMON,
        ...AGG_GROUPS.ORDERED,
        ...(isNumericDtype(column.dtype) ? AGG_GROUPS.NUMERIC : []),
      ];

  if (
    currentFunction &&
    BACKEND_FUNCS.includes(currentFunction as BackendFunc)
  ) {
    options.push(currentFunction as BackendFunc);
  }

  return Array.from(new Set(options)).filter(func =>
    BACKEND_FUNCS.includes(func)
  );
};
