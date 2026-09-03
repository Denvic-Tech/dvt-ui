import type { DataFrameMetadataInput, DataType } from '@/shared/gatewayClient';
import { zDataFrameMetadataInput, zDataType } from '@/shared/gatewayClient';

export type DataFrameMetadataEditorMode = 'ui' | 'json';

export type DataFrameMetadataDraftRow = {
  id: string;
  dtype: DataType;
  name: string;
  nullable: boolean;
};

export const DATA_FRAME_DATA_TYPES = zDataType.options;

const makeDraftId = () => {
  return `df-meta-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
};

export const createEmptyDataFrameMetadata = (): DataFrameMetadataInput => ({
  type: 'DATAFRAME',
  columns: [],
});

export const createEmptyDataFrameMetadataDraftRow =
  (): DataFrameMetadataDraftRow => ({
    id: makeDraftId(),
    dtype: 'STRING',
    name: '',
    nullable: false,
  });

export const normalizeDataFrameMetadataInput = (
  value: unknown
): DataFrameMetadataInput | null => {
  const parsed = zDataFrameMetadataInput.safeParse(value);

  if (!parsed.success) {
    return null;
  }

  return parsed.data as DataFrameMetadataInput;
};

export const hydrateDataFrameMetadataDraftRows = (
  metadata?: DataFrameMetadataInput | null
): DataFrameMetadataDraftRow[] => {
  return (metadata?.columns ?? []).map(column => ({
    id: makeDraftId(),
    dtype: column.dtype,
    name: column.name,
    nullable: Boolean(column.nullable),
  }));
};

const buildColumnFromDraftRow = (
  row: DataFrameMetadataDraftRow,
  originalColumn?: DataFrameMetadataInput['columns'][number] | null
): DataFrameMetadataInput['columns'][number] => {
  const nextColumn: DataFrameMetadataInput['columns'][number] = {
    name: row.name.trim(),
    dtype: row.dtype,
    nullable: row.nullable,
    index: originalColumn?.index ?? null,
  };

  if (originalColumn?.dtype_metadata !== undefined) {
    nextColumn.dtype_metadata = originalColumn.dtype_metadata ?? null;
  }

  return nextColumn;
};

export const serializeDataFrameMetadataDraftRows = (
  rows: DataFrameMetadataDraftRow[],
  baseMetadata?: DataFrameMetadataInput | null
): DataFrameMetadataInput => {
  const originalColumns = baseMetadata?.columns ?? [];

  return {
    ...(baseMetadata ?? createEmptyDataFrameMetadata()),
    type: 'DATAFRAME',
    columns: rows.map((row, index) => {
      return buildColumnFromDraftRow(row, originalColumns[index]);
    }),
  };
};

export const validateDataFrameMetadataDraftRows = (
  rows: DataFrameMetadataDraftRow[]
): string[] => {
  const errors: string[] = [];

  if (rows.length === 0) {
    errors.push('Добавьте хотя бы одну колонку.');
    return errors;
  }

  const normalizedNames = new Set<string>();

  rows.forEach((row, index) => {
    const columnIndex = index + 1;
    const trimmedName = row.name.trim();

    if (!trimmedName) {
      errors.push(`Колонка ${columnIndex}: укажите имя.`);
      return;
    }

    const normalizedName = trimmedName.toLowerCase();

    if (normalizedNames.has(normalizedName)) {
      errors.push(`Колонка ${columnIndex}: имя "${trimmedName}" повторяется.`);
    } else {
      normalizedNames.add(normalizedName);
    }

    if (!DATA_FRAME_DATA_TYPES.includes(row.dtype)) {
      errors.push(
        `Колонка ${columnIndex}: тип "${row.dtype}" не поддерживается.`
      );
    }
  });

  return errors;
};

export const parseDataFrameMetadataJson = (
  value: string
): { errors: string[]; metadata: DataFrameMetadataInput | null } => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return {
      errors: ['Вставьте JSON с metadata DataFrame.'],
      metadata: null,
    };
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(trimmedValue);
  } catch {
    return {
      errors: ['JSON невалиден. Проверьте синтаксис.'],
      metadata: null,
    };
  }

  const parsedMetadata = zDataFrameMetadataInput.safeParse(parsedJson);

  if (!parsedMetadata.success) {
    return {
      errors: parsedMetadata.error.issues.map(issue => issue.message),
      metadata: null,
    };
  }

  return {
    errors: [],
    metadata: normalizeDataFrameMetadataInput(parsedMetadata.data),
  };
};
