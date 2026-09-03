import type {
  StepLoadingConditionContext,
  StepOnContinueContext,
} from '@/app/providers/node-extensions';

import { requireDbConnectionId } from '@/entities/data/db-connection/model/catalogNormalizers';

import {
  client,
  type DataFrameMetadata,
  type DbMetadata as DBMetadata,
} from '@/shared/gatewayClient';
import { isDialectSupportsSchemas } from '@/shared/lib/db-metadata';
import { ApiError } from '@/shared/lib/errors';

export type WriteDataFrameToDBValues = {
  table_name?: string | null;
  database_name?: string | null | undefined;
  schema_name?: string | null | undefined;
  chunksize?: number | null;
  min_batch_rows?: number | null;
  index_col?: string | null;
  write_mode?: string | null;
  use_clickhouse_connect_driver?: boolean | null;
  create_table_sql?: string | null;
};

export interface ExtensionState {
  inputConnectionMetadata?: DBMetadata | null;
  inputDataframeMetadata?: DataFrameMetadata | null;
  isTableNew?: boolean;
  isCreateSqlLoading?: boolean;
  isCreateTableLoading?: boolean;
  createSqlError?: string | null;
  createTableError?: string | null;
  createTableSuccess?: string | null;
  createTableSuccessAt?: number | null;
  lastCreateSqlKey?: string | null;
  lastCreateTableKey?: string | null;
  invalidateCatalog?: () => void;
}

const CREATE_TABLE_SUCCESS_TRANSITION_DELAY_MS = 2000;

export const normalizeName = (name: string | null | undefined): string => {
  return (name ?? '').trim().toLowerCase();
};

const isNonEmpty = (value: string | null | undefined): boolean => {
  return Boolean(value && value.trim().length > 0);
};

export const shouldShowCreateTableSql = (
  inputValues: WriteDataFrameToDBValues,
  isTableNew: boolean
): boolean => {
  void inputValues;
  return isTableNew;
};

export const buildCreateSqlCacheKey = (
  inputValues: WriteDataFrameToDBValues,
  dataframeMetadata?: DataFrameMetadata | null,
  connectionMetadata?: DBMetadata | null
): string => {
  const columnsFingerprint = (dataframeMetadata?.columns ?? [])
    .map(column => `${column.name}:${String(column.dtype ?? '')}`)
    .join('|');

  return [
    inputValues.table_name ?? '',
    inputValues.database_name ?? '',
    inputValues.schema_name ?? '',
    inputValues.index_col ?? '',
    connectionMetadata?.connection_id ?? '',
    connectionMetadata?.connection_revision ?? '',
    columnsFingerprint,
  ].join('::');
};

export const isPrepareStepValid = (
  inputValues: WriteDataFrameToDBValues,
  sharedState?: ExtensionState
): boolean => {
  if (!isNonEmpty(inputValues?.table_name)) {
    return false;
  }
  if (!isNonEmpty(inputValues?.index_col)) {
    return false;
  }

  if (
    sharedState?.inputConnectionMetadata &&
    isDialectSupportsSchemas(sharedState?.inputConnectionMetadata.dialect) &&
    !isNonEmpty(inputValues?.schema_name)
  ) {
    return false;
  }

  const isTableNew = sharedState?.isTableNew ?? false;
  if (!isTableNew && !isNonEmpty(inputValues?.write_mode)) {
    return false;
  }

  const requiresCreateSql = shouldShowCreateTableSql(inputValues, isTableNew);
  if (!requiresCreateSql) {
    return true;
  }

  if (sharedState?.isCreateSqlLoading || sharedState?.isCreateTableLoading) {
    return false;
  }

  if (
    !sharedState?.inputConnectionMetadata ||
    !sharedState?.inputDataframeMetadata
  ) {
    return false;
  }

  return isNonEmpty(inputValues?.create_table_sql);
};

export const extractApiErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (error instanceof ApiError) {
    const detail = (error.payload.meta as any)?.exc_data?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }

    if (
      typeof error.payload.detail === 'string' &&
      error.payload.detail.trim()
    ) {
      return error.payload.detail;
    }

    if (
      typeof error.payload.message === 'string' &&
      error.payload.message.trim()
    ) {
      return error.payload.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

const buildCreateTableKey = (
  inputValues: WriteDataFrameToDBValues,
  connectionMetadata?: DBMetadata | null
): string => {
  return [
    inputValues.table_name ?? '',
    inputValues.database_name ?? '',
    inputValues.schema_name ?? '',
    inputValues.create_table_sql ?? '',
    connectionMetadata?.connection_id ?? '',
    connectionMetadata?.connection_revision ?? '',
  ].join('::');
};

const ensureTruncateWriteMode = (
  context: StepLoadingConditionContext<WriteDataFrameToDBValues, ExtensionState>
): void => {
  const currentMode = (context.inputValues.write_mode ?? '')
    .trim()
    .toLowerCase();
  if (currentMode === 'truncate') {
    return;
  }

  context.setLocalInputData?.(prev => ({
    ...(prev ?? {}),
    write_mode: 'truncate',
  }));
};

export const prepareWriteStepOnContinue = async (
  context: StepOnContinueContext<WriteDataFrameToDBValues, ExtensionState>
): Promise<void> => {
  const { inputValues, sharedState, setSharedState } = context;
  const isTableNew = sharedState?.isTableNew ?? false;
  const requiresCreateTable = shouldShowCreateTableSql(inputValues, isTableNew);

  setSharedState(prev => ({
    ...(prev ?? {}),
    createTableError: null,
    createTableSuccess: null,
    createTableSuccessAt: null,
    isCreateTableLoading: false,
    lastCreateTableKey: requiresCreateTable
      ? null
      : (prev?.lastCreateTableKey ?? null),
  }));
};

export const isWriteStepReady = async (
  context: StepLoadingConditionContext<WriteDataFrameToDBValues, ExtensionState>
): Promise<boolean> => {
  const isTableNew = context.sharedState?.isTableNew ?? false;
  if (!isTableNew) {
    return true;
  }

  if (context.sharedState?.isCreateTableLoading) {
    return false;
  }

  if (context.sharedState?.createTableSuccess) {
    const successTimestamp = context.sharedState?.createTableSuccessAt ?? null;
    if (successTimestamp == null) {
      return false;
    }

    const elapsed = Date.now() - successTimestamp;
    return elapsed >= CREATE_TABLE_SUCCESS_TRANSITION_DELAY_MS;
  }

  if (context.sharedState?.createTableError) {
    return false;
  }

  return false;
};

export const createTableOnWriteStepEnter = async (
  context: StepLoadingConditionContext<WriteDataFrameToDBValues, ExtensionState>
): Promise<void> => {
  const { inputValues, sharedState, setSharedState } = context;
  const isTableNew = sharedState?.isTableNew ?? false;

  if (!isTableNew) {
    setSharedState(prev => ({
      ...(prev ?? {}),
      isCreateTableLoading: false,
      createTableSuccessAt: null,
    }));
    return;
  }

  const connectionMetadata = sharedState?.inputConnectionMetadata;
  const createTableSql = (inputValues.create_table_sql ?? '').trim();

  if (!connectionMetadata) {
    setSharedState(prev => ({
      ...(prev ?? {}),
      createTableError:
        'Нет метаданных подключения. Вернитесь на предыдущий шаг и обновите вход connection.',
      createTableSuccess: null,
      createTableSuccessAt: null,
      isCreateTableLoading: false,
      lastCreateTableKey: null,
    }));
    return;
  }

  if (!createTableSql) {
    setSharedState(prev => ({
      ...(prev ?? {}),
      createTableError:
        'SQL для создания таблицы пуст. Вернитесь на предыдущий шаг и обновите CREATE TABLE SQL.',
      createTableSuccess: null,
      createTableSuccessAt: null,
      isCreateTableLoading: false,
      lastCreateTableKey: null,
    }));
    return;
  }

  const createTableKey = buildCreateTableKey(inputValues, connectionMetadata);
  if (
    sharedState?.lastCreateTableKey === createTableKey &&
    !sharedState?.createTableError &&
    !!sharedState?.createTableSuccess
  ) {
    ensureTruncateWriteMode(context);

    setSharedState(prev => ({
      ...(prev ?? {}),
      isCreateTableLoading: false,
      createTableSuccessAt: prev?.createTableSuccessAt ?? null,
    }));
    return;
  }

  setSharedState(prev => ({
    ...(prev ?? {}),
    createTableError: null,
    createTableSuccess: null,
    createTableSuccessAt: null,
    isCreateTableLoading: true,
  }));

  try {
    const response = await client.utils.ddl.createTable.post(
      {
        body: {
          mode: 'from_sql',
          connection_id: requireDbConnectionId(connectionMetadata),
          table_ddl: createTableSql,
          database_name: inputValues.database_name ?? null,
          schema_name: inputValues.schema_name ?? null,
          on_exists: 'error',
        },
      },
      { silent: true }
    );

    sharedState?.invalidateCatalog?.();

    ensureTruncateWriteMode(context);

    setSharedState(prev => ({
      ...(prev ?? {}),
      createTableError: null,
      createTableSuccess:
        response.data.message || 'Таблица успешно создана на стороне gateway.',
      createTableSuccessAt: Date.now(),
      isCreateTableLoading: false,
      lastCreateTableKey: createTableKey,
    }));
  } catch (error: unknown) {
    const errorMessage = extractApiErrorMessage(
      error,
      'Не удалось создать таблицу.'
    );

    setSharedState(prev => ({
      ...(prev ?? {}),
      createTableError: errorMessage,
      createTableSuccess: null,
      createTableSuccessAt: null,
      isCreateTableLoading: false,
      lastCreateTableKey: null,
    }));
  }
};
