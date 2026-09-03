import React from 'react';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import { FormHelperText, Typography } from '@mui/material';

import {
  type ColumnBaseType,
  type PartitionGrouping,
  PartitionGroupingInput,
} from '@/features/node/db-partitioning-grouping-input';
import {
  ErrorBadge,
  FieldGroup,
  FieldLabel,
  StyledInput,
} from '@/features/node/db-target-selector/ui/styles';

import { ColumnDropdownSelect } from '@/entities/data/dataframe';

import type { DbColumn } from '@/shared/gatewayClient';
import {
  type ExpressionAccordionAppearance,
  ExpressionAccordionInput,
} from '@/shared/ui/node-input';

import type {
  ReadTableFromDBV3Errors,
  ReadTableFromDBV3Values,
} from '../../lib/types';

const NOOP = () => undefined;

type OptionsSectionProps = {
  appearance?: ExpressionAccordionAppearance;
  columns: DbColumn[];
  disabled?: boolean;
  disabledReason?: string | undefined;
  errors: ReadTableFromDBV3Errors;
  hasError: boolean;
  isOpen: boolean;
  loading?: boolean;
  isPartitionColumnRequired: boolean;
  onLimitChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onMaxRowsPerPartitionChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onNPartitionsChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPartitionColumnSelect: (columnName: string) => void;
  onPartitionGroupingChange: (grouping: PartitionGrouping | null) => void;
  onTTLCacheChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggle: () => void;
  partitionColumnType: ColumnBaseType;
  partitionGroupingErrors?: Record<string, string> | undefined;
  selectedTableName?: string | null | undefined;
  stepNumber?: number | undefined;
  values?: ReadTableFromDBV3Values | undefined;
};

export const OptionsSection: React.FC<OptionsSectionProps> = ({
  appearance,
  columns,
  disabled = false,
  disabledReason,
  errors,
  hasError,
  isOpen,
  loading = false,
  isPartitionColumnRequired,
  onLimitChange,
  onMaxRowsPerPartitionChange,
  onNPartitionsChange,
  onPartitionColumnSelect,
  onPartitionGroupingChange,
  onTTLCacheChange,
  onToggle,
  partitionColumnType,
  partitionGroupingErrors,
  selectedTableName,
  stepNumber,
  values,
}) => {
  return (
    <ExpressionAccordionInput
      appearance={appearance}
      inputDefinition={undefined}
      value={values}
      onChange={NOOP}
      isOpen={isOpen}
      onToggle={onToggle}
      icon={<SettingsIcon sx={{ fontSize: 18 }} />}
      title='Параметры'
      required
      stepNumber={stepNumber}
      hasError={hasError}
      disabled={disabled}
      disabledReason={disabledReason}
      loading={loading}
      loadingVariant='title-wave'
      collapsedValue={values?.limit ? `Лимит ${values.limit}` : 'Вся таблица'}
      badge={
        hasError ? (
          <ErrorBadge>
            <ErrorOutlineIcon sx={{ fontSize: 12 }} />
            Error
          </ErrorBadge>
        ) : undefined
      }
    >
      <div data-testid='node-extensions/extract/read-table-from-db-v3/read-table-parameters-tab'>
        <FieldGroup>
          <FieldLabel>
            Колонка сегментации
            {isPartitionColumnRequired && (
              <Typography
                component='span'
                sx={{ color: 'error.main', ml: 0.5 }}
              >
                *
              </Typography>
            )}
          </FieldLabel>
          <ColumnDropdownSelect
            value={values?.partition_col || ''}
            onChange={onPartitionColumnSelect}
            columns={columns}
            placeholder='Not selected'
            testIds={{
              root: 'entities/data/dataframe/segmentation-column-select',
              trigger:
                'entities/data/dataframe/segmentation-column-select-toggle',
              searchInput:
                'entities/data/dataframe/segmentation-column-search-input',
              option: 'entities/data/dataframe/segmentation-column-option',
            }}
            disabled={!selectedTableName}
            error={!!errors.partition_col}
          />
          {errors.partition_col && (
            <FormHelperText error sx={{ mt: 0.5, mx: 0 }}>
              {errors.partition_col}
            </FormHelperText>
          )}
        </FieldGroup>

        <FieldGroup>
          <FieldLabel>Кастомная группировка для сегментации</FieldLabel>
          <PartitionGroupingInput
            value={values?.partition_grouping}
            onChange={onPartitionGroupingChange}
            columnType={partitionColumnType}
            disabled={!values?.partition_col}
            error={!!errors.partition_grouping}
            fieldErrors={partitionGroupingErrors}
          />
          {errors.partition_grouping && (
            <FormHelperText error sx={{ mt: 0.5, mx: 0 }}>
              {errors.partition_grouping}
            </FormHelperText>
          )}
        </FieldGroup>

        <FieldGroup>
          <FieldLabel>Количество партиций (npartitions)</FieldLabel>
          <StyledInput
            type='number'
            min={1}
            step={1}
            value={values?.npartitions ?? ''}
            onChange={onNPartitionsChange}
            disabled={!values?.partition_col}
          />
          {errors.npartitions && (
            <FormHelperText error sx={{ mt: 0.5, mx: 0 }}>
              {errors.npartitions}
            </FormHelperText>
          )}
        </FieldGroup>

        <FieldGroup>
          <FieldLabel>
            Макс. строк в партиции (max_rows_per_partition)
          </FieldLabel>
          <StyledInput
            type='number'
            min={1}
            step={1}
            value={values?.max_rows_per_partition ?? ''}
            onChange={onMaxRowsPerPartitionChange}
            disabled={!values?.partition_col}
          />
          {errors.max_rows_per_partition && (
            <FormHelperText error sx={{ mt: 0.5, mx: 0 }}>
              {errors.max_rows_per_partition}
            </FormHelperText>
          )}
        </FieldGroup>

        <FieldGroup>
          <FieldLabel>Лимит строк (1..1000000)</FieldLabel>
          <StyledInput
            type='number'
            min={1}
            max={1_000_000}
            step={1}
            value={values?.limit ?? ''}
            onChange={onLimitChange}
          />
          {errors.limit && (
            <FormHelperText error sx={{ mt: 0.5, mx: 0 }}>
              {errors.limit}
            </FormHelperText>
          )}
        </FieldGroup>

        <FieldGroup>
          <FieldLabel>
            Время жизни кэша сек. (если 0, берется TTL из config)
          </FieldLabel>
          <StyledInput
            type='number'
            min={0}
            step={1}
            value={values?.TTL_CACHE ?? 0}
            onChange={onTTLCacheChange}
          />
        </FieldGroup>
      </div>
    </ExpressionAccordionInput>
  );
};
