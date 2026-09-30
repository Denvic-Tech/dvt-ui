import { useCallback, useEffect, useId, useMemo } from 'react';
import { Alert, Box } from '@mui/material';

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

import { WriteModeExample } from './WriteModeExample';
import {
  ModeDescription,
  ModeDetails,
  ModeDetailsTitle,
  ModeKeyField,
  ModeOption,
  ModeOptionHeading,
  ModeOptionHint,
  ModeOptions,
  ModeOptionText,
  ModeRadio,
  ModeSectionLabel,
  ModeSidebar,
  WriteModePanel,
} from './WriteModeStep.styles';

const MODE_CONTENT: Record<
  string,
  {
    title: string;
    hint: string;
    description: string;
  }
> = {
  append: {
    title: 'Добавить',
    hint: 'Дописать строки к существующим',
    description:
      'Строки DataFrame добавляются в конец таблицы. Текущие данные не меняются — при повторном запуске возможны дубли.',
  },
  truncate: {
    title: 'Перезаписать',
    hint: 'Очистить таблицу и записать заново',
    description:
      'Перед записью таблица полностью очищается. В ней останутся только строки из DataFrame.',
  },
  upsert: {
    title: 'Обновить или добавить',
    hint: 'Сопоставить строки по ключу',
    description:
      'Строки с совпадающим ключом обновляются, остальные добавляются. При повторной записи строки сопоставляются по тому же ключу.',
  },
};

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
  const modeGroupId = useId();
  const keyLabelId = useId();

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
    const options = writeModeOptions.some(
      option => option.toLowerCase() === 'upsert'
    )
      ? [...writeModeOptions]
      : [...writeModeOptions, 'upsert'];
    const order = ['append', 'truncate', 'upsert'];
    return options.sort((left, right) => {
      const leftIndex = order.indexOf(left.toLowerCase());
      const rightIndex = order.indexOf(right.toLowerCase());
      return (
        (leftIndex < 0 ? order.length : leftIndex) -
        (rightIndex < 0 ? order.length : rightIndex)
      );
    });
  }, [writeModeOptions]);

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

  const mode = selectedWriteMode?.toLowerCase() ?? '';
  const selectedContent = MODE_CONTENT[mode];

  return (
    <WriteModePanel>
      <ModeSidebar role='radiogroup' aria-label='Режим записи'>
        <ModeSectionLabel
          sx={{
            px: '10px',
            pt: '4px',
            fontFamily: 'Inter, sans-serif',
            color: '#9b9ba6',
            fontSize: 12,
          }}
        >
          Режим записи
        </ModeSectionLabel>
        <ModeOptions>
          {writeModeDisplayOptions.map(option => {
            const content = MODE_CONTENT[option.toLowerCase()];
            const selected = selectedWriteMode === option;
            const unavailable =
              !selectedTargetLabel || !writeModeOptions.includes(option);
            return (
              <ModeOption
                key={option}
                selected={selected}
                unavailable={unavailable}
                title={
                  unavailable
                    ? 'Режим недоступен для текущей таблицы или подключения'
                    : undefined
                }
              >
                <ModeRadio
                  type='radio'
                  name={modeGroupId}
                  value={option}
                  checked={selected}
                  disabled={unavailable}
                  onChange={() => handleWriteModeChange(option)}
                />
                <ModeOptionText>
                  <ModeOptionHeading>
                    <span>{content?.title ?? option}</span>
                    <code>{option}</code>
                  </ModeOptionHeading>
                  {content ? (
                    <ModeOptionHint>{content.hint}</ModeOptionHint>
                  ) : null}
                </ModeOptionText>
              </ModeOption>
            );
          })}
        </ModeOptions>
      </ModeSidebar>
      <ModeDetails>
        {!selectedTargetLabel ? (
          <Alert severity='info'>Сначала выберите целевую таблицу.</Alert>
        ) : selectedWriteMode ? (
          <>
            <div>
              <ModeDetailsTitle>
                {selectedContent?.title ?? selectedWriteMode}
                <span>в</span>
                <code>{selectedTargetLabel}</code>
              </ModeDetailsTitle>
              {selectedContent ? (
                <ModeDescription>{selectedContent.description}</ModeDescription>
              ) : null}
              {mode === 'upsert' ? (
                <ModeKeyField>
                  <ModeSectionLabel id={keyLabelId} sx={{ mb: '6px' }}>
                    Ключ
                  </ModeSectionLabel>
                  <Box
                    role='group'
                    aria-labelledby={keyLabelId}
                    sx={{ maxWidth: 308 }}
                  >
                    <ColumnDropdownSelect
                      value={localInputData?.upsert_config?.key_column ?? ''}
                      onChange={handleUpsertKeyChange}
                      columns={upsertColumns}
                      placeholder='Выберите колонку-ключ'
                      disabled={upsertColumns.length === 0}
                      allowNew
                    />
                  </Box>
                  {isTableNew && selectedCreationMode === 'typed' ? (
                    <ModeDescription sx={{ fontSize: 12, mt: 1 }}>
                      {upsertTableCreationHint}
                    </ModeDescription>
                  ) : null}
                </ModeKeyField>
              ) : null}
            </div>
            <WriteModeExample
              mode={mode}
              keyColumn={localInputData?.upsert_config?.key_column ?? ''}
            />
          </>
        ) : (
          <ModeDescription>Выберите режим записи.</ModeDescription>
        )}
      </ModeDetails>
    </WriteModePanel>
  );
};
