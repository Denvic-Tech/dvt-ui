import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import { NodeModalStepperExtensionProps } from '@/app/providers/node-extensions';

import { useNodeConnections } from '@/features/node/get-node-connections';

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

import { UpsertKeySelect } from './UpsertKeySelect';
import { WriteModeExample } from './WriteModeExample';
import {
  ModeBox,
  ModeButton,
  ModeDescription,
  ModeEmpty,
  ModeHead,
  ModeKeyHint,
  ModeList,
  ModeMain,
  ModeTitle,
  WriteModeRoot,
} from './WriteModeStep.styles';

const MODE_CONTENT: Record<
  string,
  {
    title: string;
    description: string;
    /** Путь иконки 16×16 (макет: `.zsi`). */
    icon: string;
  }
> = {
  append: {
    title: 'Добавить',
    description:
      'Новые строки дописываются к существующим. Текущие данные в таблице не меняются.',
    icon: 'M2.5 4h8M2.5 8h8M2.5 12h4.5M12 9.5v5M9.5 12h5',
  },
  truncate: {
    title: 'Перезаписать',
    description:
      'Перед записью таблица полностью очищается. В ней останутся только строки из DF.',
    icon: 'M13 8a5 5 0 1 1-1.46-3.54M13.2 2.8v3h-3',
  },
  upsert: {
    title: 'Обновить или добавить',
    description:
      'Строки с совпадающим ключом обновляются, остальные добавляются.',
    icon: 'M2.5 4.5h3.5l4 7h3.5M2.5 11.5h3.5l1.6-2.8M11.5 2.5l2 2-2 2M11.5 9.5l2 2-2 2M8.4 7.3l1.6-2.8h3.5',
  },
};

const UNAVAILABLE_MODE_TITLE =
  'Режим недоступен для текущей таблицы или подключения';

const ModeIcon = ({ path }: { path: string | undefined }) => (
  <span className='mode-icon' aria-hidden='true'>
    {path ? (
      <svg
        width='15'
        height='15'
        viewBox='0 0 16 16'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <path d={path} />
      </svg>
    ) : null}
  </span>
);

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
  const modeButtonsRef = useRef<Map<string, HTMLButtonElement>>(new Map());

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
  const availableModes = useMemo(
    () =>
      selectedTargetLabel
        ? writeModeDisplayOptions.filter(option =>
            writeModeOptions.includes(option)
          )
        : [],
    [selectedTargetLabel, writeModeDisplayOptions, writeModeOptions]
  );
  const focusableMode =
    selectedWriteMode && availableModes.includes(selectedWriteMode)
      ? selectedWriteMode
      : (availableModes[0] ?? null);

  // Радиогруппа: стрелки переключают режим и переносят фокус.
  const handleModeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? 1
        : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? -1
          : 0;
    if (!step || availableModes.length === 0) return;
    event.preventDefault();
    const currentIndex = focusableMode
      ? availableModes.indexOf(focusableMode)
      : -1;
    const nextMode =
      availableModes[
        (currentIndex + step + availableModes.length) % availableModes.length
      ];
    if (!nextMode) return;
    handleWriteModeChange(nextMode);
    modeButtonsRef.current.get(nextMode)?.focus();
  };

  return (
    <WriteModeRoot>
      <ModeList
        role='radiogroup'
        aria-label='Режим записи'
        onKeyDown={handleModeKeyDown}
      >
        {writeModeDisplayOptions.map(option => {
          const content = MODE_CONTENT[option.toLowerCase()];
          const selected = selectedWriteMode === option;
          const unavailable = !availableModes.includes(option);
          return (
            <ModeButton
              key={option}
              ref={node => {
                if (node) modeButtonsRef.current.set(option, node);
                else modeButtonsRef.current.delete(option);
              }}
              type='button'
              role='radio'
              aria-checked={selected}
              active={selected}
              disabled={unavailable}
              tabIndex={option === focusableMode ? 0 : -1}
              title={unavailable ? UNAVAILABLE_MODE_TITLE : undefined}
              onClick={() => handleWriteModeChange(option)}
            >
              <ModeIcon path={content?.icon} />
              <span className='mode-name'>{content?.title ?? option}</span>
            </ModeButton>
          );
        })}
      </ModeList>
      <ModeMain>
        {!selectedTargetLabel ? (
          <ModeEmpty>Сначала выберите целевую таблицу.</ModeEmpty>
        ) : selectedWriteMode ? (
          <>
            <ModeHead>
              <ModeTitle>
                <span className='mode-title'>
                  {selectedContent?.title ?? selectedWriteMode}
                </span>
                <span className='mode-code'>{mode}</span>
              </ModeTitle>
              {selectedContent ? (
                <ModeDescription>{selectedContent.description}</ModeDescription>
              ) : null}
            </ModeHead>
            {mode === 'upsert' ? (
              <ModeBox>
                <UpsertKeySelect
                  value={localInputData?.upsert_config?.key_column ?? ''}
                  columns={upsertColumns}
                  onChange={handleUpsertKeyChange}
                  disabled={upsertColumns.length === 0}
                />
                {isTableNew && selectedCreationMode === 'typed' ? (
                  <ModeKeyHint>{upsertTableCreationHint}</ModeKeyHint>
                ) : null}
              </ModeBox>
            ) : null}
            <WriteModeExample mode={mode} />
          </>
        ) : (
          <ModeEmpty>Выберите режим записи.</ModeEmpty>
        )}
      </ModeMain>
    </WriteModeRoot>
  );
};
