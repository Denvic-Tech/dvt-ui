import { useCallback, useEffect, useMemo } from 'react';
import TuneIcon from '@mui/icons-material/Tune';
import { Alert, Box, Stack, Tooltip, Typography } from '@mui/material';

import { NodeModalStepperExtensionProps } from '@/app/providers/node-extensions';

import { useNodeConnections } from '@/features/node/get-node-connections';

import { ColumnDropdownSelect } from '@/entities/data/dataframe';

import type {
  Column,
  DataFrameMetadata,
  DbMetadata as DBMetadata,
  InputDefinitionModel,
} from '@/shared/gatewayClient';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';

import {
  applyUpsertKeyToTypedTableConfig,
  buildColumnSelectorOptionsFromMapping,
  buildSelectedWriteTargetLabel,
  type ExtensionState,
  findWriteTargetTable,
  getLiteralStringValue,
  resolveCreationMode,
  type WriteDataFrameToDBValues,
} from '../lib/helpers';

import {
  HeaderBadge,
  HeaderBadges,
  HeaderIcon,
  HeaderLeft,
  HeaderTitle,
  SettingsContent,
  SettingsHeader,
  StepCard,
} from './WriteSettingsStep/index.styles';
import {
  FieldGroup,
  FieldLabel,
  SegmentButton,
  SegmentedControl,
  WriteModeLabel,
  WriteModeTitle,
  WriteModeTooltipIcon,
} from './styles';

export const WriteModeStep = ({
  id: nodeID,
  isOpen,
  nodeDefinition,
  localInputData,
  setLocalInputData,
  setSharedState,
  sharedState,
}: NodeModalStepperExtensionProps<
  WriteDataFrameToDBValues,
  ExtensionState
>) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const { confirm } = useConfirmDialog();

  const inputConnectionMetadata = useMemo(() => {
    return getConnectedInputMetadata('connection') as DBMetadata | null;
  }, [getConnectedInputMetadata]);
  const inputDataframeMetadata = useMemo(() => {
    return getConnectedInputMetadata('df') as DataFrameMetadata | null;
  }, [getConnectedInputMetadata]);
  const dataframeColumns = useMemo<Column[]>(() => {
    return inputDataframeMetadata?.columns ?? [];
  }, [inputDataframeMetadata?.columns]);

  const getInputDefinition = useCallback(
    (attrName: string): InputDefinitionModel | undefined => {
      const inputDefinitions = nodeDefinition.input_definitions ?? {};
      return (
        inputDefinitions[attrName] ??
        Object.values(inputDefinitions).find(
          inputDefinition => inputDefinition.attr_name === attrName
        )
      );
    },
    [nodeDefinition.input_definitions]
  );

  const writeModeInputDef = useMemo(() => {
    return getInputDefinition('write_mode');
  }, [getInputDefinition]);

  const writeModeOptions = useMemo(() => {
    const options = writeModeInputDef?.options;
    if (!Array.isArray(options)) {
      return [] as string[];
    }

    return options
      .filter((option): option is string => typeof option === 'string')
      .filter(option => option.toLowerCase() !== 'recreate');
  }, [writeModeInputDef?.options]);

  const writeModeDisplayOptions = useMemo(() => {
    const hasUpsert = writeModeOptions.some(
      option => option.toLowerCase() === 'upsert'
    );
    return hasUpsert ? writeModeOptions : [...writeModeOptions, 'upsert'];
  }, [writeModeOptions]);

  const writeModeDescription = useMemo(() => {
    if (typeof writeModeInputDef?.description !== 'string') {
      return null;
    }

    return writeModeInputDef.description.trim() || null;
  }, [writeModeInputDef?.description]);

  const localizedWriteModeDescription = useMemo(() => {
    if (!writeModeDescription) {
      return null;
    }

    const normalized = writeModeDescription
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    const defaultDescription =
      "mode for writing to the table: 'truncate' truncates the table, 'append' adds data, 'recreate' drops and creates the table again.";

    if (normalized === defaultDescription) {
      return "Режим записи в таблицу: 'truncate' очищает таблицу, 'append' добавляет данные, 'upsert' обновляет/добавляет по key column.";
    }

    return writeModeDescription;
  }, [writeModeDescription]);

  const normalizeWriteMode = useCallback(
    (mode?: string | null) => {
      if (!mode) {
        return null;
      }

      const normalized = mode.toLowerCase();
      return (
        writeModeOptions.find(option => option.toLowerCase() === normalized) ??
        null
      );
    },
    [writeModeOptions]
  );

  const selectedWriteMode = useMemo(() => {
    return normalizeWriteMode(localInputData?.write_mode ?? null);
  }, [localInputData?.write_mode, normalizeWriteMode]);

  const selectedTargetLabel = useMemo(() => {
    return buildSelectedWriteTargetLabel(localInputData);
  }, [localInputData]);

  const selectedTable = useMemo(() => {
    return findWriteTargetTable(inputConnectionMetadata, localInputData);
  }, [inputConnectionMetadata, localInputData]);
  const isTableNew = useMemo(() => {
    return (
      sharedState?.isTableNew ??
      Boolean(
        getLiteralStringValue(localInputData?.table_name) && !selectedTable
      )
    );
  }, [localInputData?.table_name, selectedTable, sharedState?.isTableNew]);
  const selectedCreationMode = useMemo(() => {
    return resolveCreationMode(sharedState, localInputData);
  }, [localInputData, sharedState]);
  const upsertTableCreationHint = useMemo(() => {
    const connectionKind =
      inputConnectionMetadata?.dialect?.toLowerCase() ?? '';

    if (connectionKind.includes('clickhouse')) {
      return 'При создании таблицы выбранная колонка будет добавлена в Order by и получит ограничение NOT NULL.';
    }
    if (
      connectionKind.includes('postgresql') ||
      connectionKind.includes('postgres')
    ) {
      return 'При создании таблицы для выбранной колонки будет создан индекс, а сама колонка получит ограничение NOT NULL.';
    }

    return 'При создании таблицы выбранная колонка получит ограничение NOT NULL.';
  }, [inputConnectionMetadata]);

  const upsertColumns = useMemo<Column[]>(() => {
    if (selectedTable?.columns?.length) {
      return selectedTable.columns;
    }

    if (
      selectedCreationMode === 'typed' &&
      localInputData?.column_mapping?.length
    ) {
      return buildColumnSelectorOptionsFromMapping(
        localInputData.column_mapping
      );
    }

    return dataframeColumns;
  }, [
    dataframeColumns,
    localInputData?.column_mapping,
    selectedCreationMode,
    selectedTable?.columns,
  ]);

  useEffect(() => {
    if (!isOpen || !selectedTargetLabel) {
      return;
    }
    if (writeModeOptions.length === 0) {
      return;
    }
    if (localInputData?.write_mode != null || selectedWriteMode) {
      return;
    }

    const fallback = normalizeWriteMode('truncate') ?? writeModeOptions[0];
    if (!fallback) {
      return;
    }

    setLocalInputData(prev => ({
      ...(prev ?? {}),
      write_mode: fallback,
    }));
  }, [
    isOpen,
    localInputData?.write_mode,
    normalizeWriteMode,
    selectedTargetLabel,
    selectedWriteMode,
    setLocalInputData,
    writeModeOptions,
  ]);

  const requestTruncateConfirm = useCallback(
    (tableLabel: string) =>
      confirm({
        title: 'Подтвердить TRUNCATE?',
        message: `Режим TRUNCATE очистит таблицу "${tableLabel}" перед записью данных.\nПродолжить?`,
        confirmLabel: 'Продолжить',
        cancelLabel: 'Отмена',
        confirmColor: 'error',
      }),
    [confirm]
  );

  useEffect(() => {
    setSharedState(prev => ({
      ...(prev ?? {}),
      requestTruncateConfirm,
    }));
  }, [requestTruncateConfirm, setSharedState]);

  const handleWriteModeChange = useCallback(
    (mode: string) => {
      if (!mode || !writeModeOptions.includes(mode)) {
        return;
      }

      setLocalInputData(prev => ({
        ...(prev ?? {}),
        write_mode: mode,
        upsert_config:
          mode.toLowerCase() === 'upsert'
            ? (prev?.upsert_config ?? null)
            : null,
      }));
      setSharedState(prev => ({
        ...(prev ?? {}),
        createTableError: null,
        createTableSuccess: null,
        createTableSuccessAt: null,
        isCreateTableLoading: false,
        lastCreateTableKey: null,
      }));
    },
    [setLocalInputData, setSharedState, writeModeOptions]
  );

  const handleUpsertKeyChange = useCallback(
    (keyColumn: string) => {
      setLocalInputData(prev => {
        const nextValues = prev ?? {};

        if (isTableNew && selectedCreationMode === 'typed') {
          return applyUpsertKeyToTypedTableConfig({
            values: nextValues,
            keyColumn,
            connectionMetadata: inputConnectionMetadata,
          });
        }

        return {
          ...nextValues,
          upsert_config: keyColumn.trim()
            ? { key_column: keyColumn.trim() }
            : null,
        };
      });
      setSharedState(prev => ({
        ...(prev ?? {}),
        createTableError: null,
        createTableSuccess: null,
        createTableSuccessAt: null,
        isCreateTableLoading: false,
        lastCreateTableKey: null,
      }));
    },
    [
      inputConnectionMetadata,
      isTableNew,
      selectedCreationMode,
      setLocalInputData,
      setSharedState,
    ]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%',
        height: '100%',
        minHeight: 0,
      }}
    >
      <StepCard>
        <SettingsHeader>
          <HeaderLeft>
            <HeaderIcon>
              <TuneIcon />
            </HeaderIcon>
            <HeaderTitle>Режим записи</HeaderTitle>
          </HeaderLeft>
          <HeaderBadges>
            {selectedTargetLabel ? (
              <HeaderBadge>Таблица: {selectedTargetLabel}</HeaderBadge>
            ) : null}
            {isTableNew ? <HeaderBadge>Новая таблица</HeaderBadge> : null}
          </HeaderBadges>
        </SettingsHeader>

        <SettingsContent>
          {!selectedTargetLabel ? (
            <Alert severity='info'>Сначала выберите целевую таблицу.</Alert>
          ) : null}

          {selectedTargetLabel ? (
            <FieldGroup sx={{ mt: 0, mb: 0 }}>
              <WriteModeLabel>
                <WriteModeTitle>Режим записи</WriteModeTitle>
                <Tooltip
                  title={
                    <Typography sx={{ whiteSpace: 'pre-line', fontSize: 12 }}>
                      {localizedWriteModeDescription ||
                        'append — добавить к существующим данным\ntruncate — очистить таблицу и записать\nupsert — обновить/добавить по key column'}
                    </Typography>
                  }
                  arrow
                  placement='top'
                >
                  <WriteModeTooltipIcon>
                    <span>?</span>
                  </WriteModeTooltipIcon>
                </Tooltip>
              </WriteModeLabel>

              <SegmentedControl>
                {writeModeDisplayOptions.map(option => {
                  const isSelected = selectedWriteMode === option;

                  return (
                    <SegmentButton
                      key={option}
                      type='button'
                      selected={isSelected}
                      aria-pressed={isSelected}
                      onClick={() => handleWriteModeChange(option)}
                    >
                      {option}
                    </SegmentButton>
                  );
                })}
              </SegmentedControl>
            </FieldGroup>
          ) : null}

          {selectedWriteMode?.toLowerCase() === 'upsert' ? (
            <FieldGroup sx={{ mt: 1, mb: 0 }}>
              <Stack direction='row' alignItems='center' sx={{ mb: 0.75 }}>
                <FieldLabel style={{ marginBottom: 0 }}>
                  Upsert key column
                </FieldLabel>
              </Stack>
              <ColumnDropdownSelect
                value={localInputData?.upsert_config?.key_column ?? ''}
                onChange={handleUpsertKeyChange}
                columns={upsertColumns}
                placeholder='Выберите колонку ключа upsert...'
                disabled={upsertColumns.length === 0}
                allowNew
              />
              {isTableNew && selectedCreationMode === 'typed' ? (
                <Alert severity='info' variant='outlined' sx={{ mt: 1.5 }}>
                  {upsertTableCreationHint}
                </Alert>
              ) : null}
            </FieldGroup>
          ) : null}
        </SettingsContent>
      </StepCard>
    </Box>
  );
};
