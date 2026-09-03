import {
  type ColumnBaseType,
  validatePartitionGrouping,
} from '@/features/node/db-partitioning-grouping-input';

import type {
  ReadTableFromDBV3ValidationResult,
  ReadTableFromDBV3Values,
} from './types';

type ValidateReadTableFromDBV3Args = {
  inputData?: ReadTableFromDBV3Values | null | undefined;
  isPartitionColumnRequired: boolean;
  partitionColumnType: ColumnBaseType;
};

export const validateReadTableFromDBV3 = ({
  inputData,
  isPartitionColumnRequired,
  partitionColumnType,
}: ValidateReadTableFromDBV3Args): ReadTableFromDBV3ValidationResult => {
  const errors: ReadTableFromDBV3ValidationResult['errors'] = {};

  if (!inputData?.table_name) {
    errors.table_name = 'Выберите таблицу';
  }

  if (isPartitionColumnRequired && !inputData?.partition_col) {
    errors.partition_col =
      'Выберите колонку сегментации: у таблицы нет одиночного primary key';
  }

  if (
    (inputData?.partition_grouping ||
      inputData?.npartitions ||
      inputData?.max_rows_per_partition) &&
    !inputData?.partition_col
  ) {
    errors.partition_col =
      'Выберите колонку сегментации для параметров партиционирования';
  }

  const groupingValidation = validatePartitionGrouping(
    inputData?.partition_grouping,
    partitionColumnType
  );

  if (!groupingValidation.isValid) {
    errors.partition_grouping =
      groupingValidation.error || 'Invalid partition grouping configuration.';
  }

  return {
    errors,
    partitionGroupingErrors: groupingValidation.isValid
      ? undefined
      : groupingValidation.fieldErrors,
    isValid: Object.keys(errors).length === 0,
  };
};
