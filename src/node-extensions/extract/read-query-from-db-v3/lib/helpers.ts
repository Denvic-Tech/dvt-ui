import { StepLoadingConditionContext } from '@/app/providers/node-extensions';

import {
  ColumnBaseType,
  validatePartitionGrouping,
} from '@/features/node/db-partitioning-grouping-input';

import { client, type DataFrameMetadata } from '@/shared/gatewayClient';
import { ApiError } from '@/shared/lib/errors';
import { isExpressionValue } from '@/shared/lib/node-input-values';
import { sanitizeSqlForBackend } from '@/shared/lib/sql';
import { isNonEmpty } from '@/shared/lib/string';

import type { ExtensionState } from '../lib/types';
import type { DBQueryV3Values } from '../ui/QueryEditorStep';

const toOptionalInteger = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.floor(parsed);
};

const getBaseType = (dtype: string | null | undefined): ColumnBaseType => {
  if (!dtype) return 'UNKNOWN';

  const type = dtype.toUpperCase();

  if (type.includes('DATE') || type.includes('TIME')) return 'DATETIME';

  if (
    type.includes('STRING') ||
    type.includes('VARCHAR') ||
    type.includes('TEXT') ||
    type.includes('CHAR')
  ) {
    return 'STRING';
  }

  if (
    type.includes('FLOAT') ||
    type.includes('DOUBLE') ||
    type.includes('DECIMAL') ||
    type.includes('INT') ||
    type.includes('NUMERIC')
  ) {
    return 'NUMERIC';
  }

  if (type.includes('BOOL')) return 'BOOL';

  return 'UNKNOWN';
};

const getPartitionColumnType = (
  metadata: DataFrameMetadata | null | undefined,
  partitionCol: string | undefined
): ColumnBaseType => {
  if (!metadata || !partitionCol) return 'UNKNOWN';

  const columns = Array.isArray(metadata.columns) ? metadata.columns : [];
  const column = columns.find(item => item.name === partitionCol);

  return getBaseType(column?.dtype ? String(column.dtype) : null);
};

export const isQueryValid = (
  inputValues: DBQueryV3Values,
  sharedState?: ExtensionState
): boolean => {
  const query =
    isExpressionValue(inputValues?.sql_code) &&
    inputValues?.sql_code.expression_kind === 'template'
      ? inputValues.sql_code.value
      : String(inputValues?.sql_code ?? '');
  const cleaned = sanitizeSqlForBackend(query);
  const hasConnection = !!sharedState?.connectionID?.trim();
  return isNonEmpty(cleaned) && hasConnection;
};

export const isMetadataReady = (
  context: StepLoadingConditionContext<DBQueryV3Values, ExtensionState>
): boolean => {
  const sharedState = context.sharedState;
  if (sharedState?.isMetadataLoading) {
    return false;
  }

  if (sharedState?.metadata) {
    return true;
  }

  return !!sharedState?.error;
};

export const fetchMetadataOnEnter = async (
  context: StepLoadingConditionContext<DBQueryV3Values, ExtensionState>
): Promise<void> => {
  const sqlQuery = sanitizeSqlForBackend(
    isExpressionValue(context.inputValues?.sql_code) &&
      context.inputValues?.sql_code.expression_kind === 'template'
      ? context.inputValues.sql_code.value
      : String(context.inputValues?.sql_code ?? '')
  );
  const connectionId = context.sharedState?.connectionID ?? null;

  context.setSharedState(prev => ({
    ...(prev ?? {}),
    isMetadataLoading: true,
    error: null,
    metadata: null,
  }));

  if (!connectionId || !connectionId.trim()) {
    context.setSharedState(prev => ({
      ...(prev ?? {}),
      error: 'Connection is not selected',
      isMetadataLoading: false,
    }));
    return;
  }

  if (!sqlQuery) {
    context.setSharedState(prev => ({
      ...(prev ?? {}),
      error: 'SQL query is empty',
      isMetadataLoading: false,
    }));
    return;
  }

  try {
    const response = await client.utils.sqlCodeMetadata.post({
      body: {
        project_id: context.projectID,
        connection_id: connectionId,
        sql_code: sqlQuery,
      },
    });

    const dataframeMetadata = response.data.dataframe_metadata;

    if (!dataframeMetadata) {
      context.setSharedState(prev => ({
        ...(prev ?? {}),
        error: `Provided SQL statement not return any data`,
        isMetadataLoading: false,
      }));
      return;
    }

    context.setSharedState(prev => ({
      ...(prev ?? {}),
      metadata: dataframeMetadata,
      error: null,
      isMetadataLoading: false,
    }));
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      const meta = error.payload.meta;
      const errorMessage =
        typeof (meta as any)?.exc_data?.detail === 'string'
          ? (meta as any).exc_data.detail
          : 'Failed to fetch metadata';

      context.setSharedState(prev => ({
        ...(prev ?? {}),
        error: errorMessage,
        isMetadataLoading: false,
      }));
      return;
    }

    context.setSharedState(prev => ({
      ...(prev ?? {}),
      error: 'Failed to fetch metadata',
      isMetadataLoading: false,
    }));
  }
};

export const isPartitionStepValid = (
  inputValues: DBQueryV3Values,
  sharedState?: ExtensionState
): boolean => {
  if (sharedState?.isMetadataLoading) {
    return false;
  }

  const partitionCol = inputValues?.partition_col?.trim();

  if (!partitionCol) {
    return false;
  }

  const npartitionsRaw = inputValues?.npartitions;
  const maxRowsRaw = inputValues?.max_rows_per_partition;

  const npartitions = toOptionalInteger(npartitionsRaw);
  if (
    npartitionsRaw !== undefined &&
    npartitionsRaw !== null &&
    (!Number.isInteger(npartitions) || (npartitions ?? 0) < 1)
  ) {
    return false;
  }

  const maxRowsPerPartition = toOptionalInteger(maxRowsRaw);
  if (
    maxRowsRaw !== undefined &&
    maxRowsRaw !== null &&
    (!Number.isInteger(maxRowsPerPartition) || (maxRowsPerPartition ?? 0) < 1)
  ) {
    return false;
  }

  const columnType = getPartitionColumnType(
    sharedState?.metadata,
    partitionCol
  );
  const groupingValidation = validatePartitionGrouping(
    inputValues?.partition_grouping,
    columnType
  );
  if (!groupingValidation.isValid) {
    return false;
  }

  return true;
};
