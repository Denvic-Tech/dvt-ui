import { type ReactNode, useMemo } from 'react';

import {
  applyPartitionGroupingParameter,
  formatPartitionGroupingParameter,
  getAvailablePartitionGroupingModes,
  getInitialPartitionGrouping,
  PARTITION_GROUPING_FIELDS,
  type PartitionGroupingField,
  type PartitionGroupingMode,
} from '@/features/node/db-partitioning-grouping-input';

import { ChevronRightIcon, CloseIcon } from '@/shared/ui/clean-minimal/icons';

import {
  countChangedAdvancedSettings,
  sanitizeTTLCache,
} from '../../lib/helpers';
import type { ReadTableFromDBV3Values } from '../../lib/types';
import type { ReadTableFromDBV3Form } from '../../model/useReadTableFromDBV3Form';

import { DraftInput } from './DraftInput';
import { GhostSelect, type GhostSelectOption } from './GhostSelect';
import {
  Advanced,
  AdvancedBody,
  AdvancedChevron,
  AdvancedLabel,
  AdvancedSummary,
  AdvancedToggle,
  Box,
  ClearButton,
  Form,
  Row,
  RowControls,
  RowError,
  RowLabel,
  RowName,
  Switch,
  SwitchWrap,
} from './SettingsPane.styles';

const ADVANCED_BODY_ID = 'read-table-from-db-v3-advanced';

const formatOptionalNumber = (value: number | null | undefined) =>
  value === null || value === undefined ? '' : String(value);

const getFieldInputMode = (field: PartitionGroupingField) => {
  if (field.kind === 'integer') return 'numeric';
  if (field.kind === 'number') return 'decimal';
  return 'text';
};

type SettingRowProps = {
  label: string;
  error?: string | undefined;
  children: ReactNode;
};

const SettingRow = ({ label, error, children }: SettingRowProps) => (
  <Row>
    <RowLabel>
      <RowName>{label}</RowName>
      {error ? <RowError>{error}</RowError> : null}
    </RowLabel>
    {children}
  </Row>
);

type ParametersTabProps = {
  form: ReadTableFromDBV3Form;
  values: ReadTableFromDBV3Values | undefined;
};

export const ParametersTab = ({ form, values }: ParametersTabProps) => {
  const partitionColumn = values?.partition_col || null;
  const grouping = values?.partition_grouping ?? null;
  const groupingFields = grouping
    ? (PARTITION_GROUPING_FIELDS[grouping.mode] ?? [])
    : [];
  const changedAdvancedCount = countChangedAdvancedSettings(values);
  const isTtlFromConfig = sanitizeTTLCache(values?.TTL_CACHE) === 0;

  const columnOptions = useMemo<GhostSelectOption[]>(
    () =>
      form.availableColumns.map(column => ({
        value: column.name,
        label: column.name,
        type: column.dtype,
      })),
    [form.availableColumns]
  );
  const modeOptions = useMemo<GhostSelectOption[]>(
    () =>
      getAvailablePartitionGroupingModes(form.partitionColumnType).map(
        option => ({
          value: option.value,
          label: option.label,
          title: option.description,
        })
      ),
    [form.partitionColumnType]
  );

  const handleModeSelect = (mode: string) => {
    if (grouping?.mode === mode) return;
    form.handlePartitionGroupingChange(
      getInitialPartitionGrouping(mode as PartitionGroupingMode)
    );
  };

  const handleGroupingParameterChange = (key: string, rawValue: string) => {
    if (!grouping) return;
    form.handlePartitionGroupingChange(
      applyPartitionGroupingParameter(grouping, key, rawValue)
    );
  };

  const renderGroupingField = (field: PartitionGroupingField) => {
    const fieldValue = grouping?.[field.key];
    const error = form.partitionGroupingErrors?.[field.key];

    if (field.kind === 'boolean') {
      const checked =
        typeof fieldValue === 'boolean'
          ? fieldValue
          : field.defaultValue === true;
      return (
        <SettingRow key={field.key} label={field.label} error={error}>
          <SwitchWrap>
            <Switch
              type='button'
              role='switch'
              aria-checked={checked}
              aria-label={field.label}
              onClick={() =>
                handleGroupingParameterChange(field.key, String(!checked))
              }
            />
          </SwitchWrap>
        </SettingRow>
      );
    }

    if (field.kind === 'select') {
      const selectedValue =
        typeof fieldValue === 'string'
          ? fieldValue
          : typeof field.defaultValue === 'string'
            ? field.defaultValue
            : null;
      return (
        <SettingRow key={field.key} label={field.label} error={error}>
          <GhostSelect
            ariaLabel={field.label}
            options={field.options ?? []}
            value={selectedValue}
            placeholder='Выберите значение'
            invalid={Boolean(error)}
            onSelect={nextValue =>
              handleGroupingParameterChange(field.key, nextValue)
            }
          />
        </SettingRow>
      );
    }

    return (
      <SettingRow key={field.key} label={field.label} error={error}>
        <DraftInput
          value={formatPartitionGroupingParameter(field, fieldValue)}
          onChange={event =>
            handleGroupingParameterChange(field.key, event.target.value)
          }
          ariaLabel={field.label}
          placeholder={field.placeholder}
          inputMode={getFieldInputMode(field)}
          invalid={Boolean(error)}
        />
      </SettingRow>
    );
  };

  return (
    <Form data-testid='node-extensions/extract/read-table-from-db-v3/read-table-parameters-tab'>
      <Box>
        <SettingRow
          label='Колонка сегментации'
          error={form.errors.partition_col}
        >
          <RowControls>
            {partitionColumn && !form.isPartitionColumnRequired ? (
              <ClearButton
                type='button'
                className='row-clear'
                aria-label='Сбросить колонку сегментации'
                title='Сбросить колонку сегментации'
                onClick={() => form.handlePartitionColumnSelect('')}
              >
                <CloseIcon />
              </ClearButton>
            ) : null}
            <GhostSelect
              ariaLabel='Колонка сегментации'
              options={columnOptions}
              value={partitionColumn}
              placeholder='Выберите колонку'
              searchPlaceholder='Поиск колонки'
              disabled={columnOptions.length === 0}
              invalid={Boolean(form.errors.partition_col)}
              onSelect={form.handlePartitionColumnSelect}
              testId='node-extensions/extract/read-table-from-db-v3/segmentation-column-select'
            />
          </RowControls>
        </SettingRow>

        <SettingRow label='Группировка' error={form.errors.partition_grouping}>
          <RowControls>
            {grouping ? (
              <ClearButton
                type='button'
                className='row-clear'
                aria-label='Сбросить группировку'
                title='Сбросить группировку'
                onClick={() => form.handlePartitionGroupingChange(null)}
              >
                <CloseIcon />
              </ClearButton>
            ) : null}
            <GhostSelect
              ariaLabel='Режим группировки'
              options={modeOptions}
              value={grouping?.mode ?? null}
              placeholder={
                partitionColumn
                  ? 'Выберите режим группировки'
                  : 'Сначала выберите колонку'
              }
              disabled={!partitionColumn}
              invalid={Boolean(form.errors.partition_grouping)}
              onSelect={handleModeSelect}
            />
          </RowControls>
        </SettingRow>

        {groupingFields.map(renderGroupingField)}
      </Box>

      <Advanced>
        <AdvancedToggle
          type='button'
          aria-expanded={form.isAdvancedOpen}
          aria-controls={ADVANCED_BODY_ID}
          onClick={() => form.setIsAdvancedOpen(open => !open)}
        >
          <AdvancedChevron open={form.isAdvancedOpen}>
            <ChevronRightIcon size={14} strokeWidth={1.7} />
          </AdvancedChevron>
          <AdvancedLabel>Дополнительные настройки</AdvancedLabel>
          {changedAdvancedCount > 0 ? (
            <AdvancedSummary invalid={form.sectionErrors.advanced}>
              Изменено: {changedAdvancedCount}
            </AdvancedSummary>
          ) : null}
        </AdvancedToggle>

        {form.isAdvancedOpen ? (
          <AdvancedBody id={ADVANCED_BODY_ID}>
            <SettingRow
              label='Количество партиций'
              error={form.errors.npartitions}
            >
              <DraftInput
                value={formatOptionalNumber(values?.npartitions)}
                onChange={form.handleNPartitionsChange}
                ariaLabel='Количество партиций'
                placeholder='Авто'
                invalid={Boolean(form.errors.npartitions)}
              />
            </SettingRow>
            <SettingRow
              label='Макс. строк в партиции'
              error={form.errors.max_rows_per_partition}
            >
              <DraftInput
                value={formatOptionalNumber(values?.max_rows_per_partition)}
                onChange={form.handleMaxRowsPerPartitionChange}
                ariaLabel='Макс. строк в партиции'
                placeholder='Авто'
                invalid={Boolean(form.errors.max_rows_per_partition)}
              />
            </SettingRow>
            <SettingRow label='Лимит строк' error={form.errors.limit}>
              <DraftInput
                value={formatOptionalNumber(values?.limit)}
                onChange={form.handleLimitChange}
                ariaLabel='Лимит строк, от 1 до 1 000 000'
                placeholder='1 – 1 000 000'
                invalid={Boolean(form.errors.limit)}
              />
            </SettingRow>
            <SettingRow label='Время жизни кэша, сек'>
              <DraftInput
                value={String(sanitizeTTLCache(values?.TTL_CACHE))}
                onChange={form.handleTTLCacheChange}
                ariaLabel='Время жизни кэша в секундах, 0 — из конфигурации'
                suffix={isTtlFromConfig ? 'из конфигурации' : null}
              />
            </SettingRow>
          </AdvancedBody>
        ) : null}
      </Advanced>
    </Form>
  );
};
