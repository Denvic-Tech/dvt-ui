import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import type { Column } from '@/shared/gatewayClient';
import type { VariableOutput } from '@/shared/lib/variables';

import {
  type DataFrameSelectVariablesValues,
  type SelectedVariableRowViewModel,
} from './editorTypes';
import {
  applySelectedVariableDraftRowPatch,
  createSelectedVariableDraftRow,
  getAvailableAggFuncsForColumn,
  hydrateSelectedVariableRows,
  normalizeSelectedVariablesValue,
  type SelectedVariableDraftPatch,
  type SelectedVariableDraftRow,
  serializeSelectedVariableRows,
  validateSelectedVariableRows,
} from './helpers';

type UseDataFrameSelectVariablesEditorArgs = Pick<
  NodeModalExtensionProps<DataFrameSelectVariablesValues>,
  'setLocalInputData'
> & {
  columns: Column[];
  isOpen: boolean;
  localInputData: DataFrameSelectVariablesValues;
  setValidationCallback?:
    | NodeModalExtensionProps<DataFrameSelectVariablesValues>['setValidationCallback']
    | undefined;
  setValidationErrors?:
    | NodeModalExtensionProps<DataFrameSelectVariablesValues>['setValidationErrors']
    | undefined;
  variables: VariableOutput[];
};

const resolveNextActiveRowId = ({
  nextRows,
  previousActiveRowId,
  preferredRowId,
}: {
  nextRows: SelectedVariableDraftRow[];
  previousActiveRowId: string | null;
  preferredRowId?: string | null | undefined;
}): string | null => {
  if (nextRows.length === 0) {
    return null;
  }

  if (preferredRowId && nextRows.some(row => row.id === preferredRowId)) {
    return preferredRowId;
  }

  if (
    previousActiveRowId &&
    nextRows.some(row => row.id === previousActiveRowId)
  ) {
    return previousActiveRowId;
  }

  return nextRows[0]?.id ?? null;
};

const toSelectedVariablesFingerprint = (value: unknown): string =>
  JSON.stringify(normalizeSelectedVariablesValue(value));

export const useDataFrameSelectVariablesEditor = ({
  isOpen,
  localInputData,
  setLocalInputData,
  setValidationCallback,
  setValidationErrors,
  columns,
  variables,
}: UseDataFrameSelectVariablesEditorArgs) => {
  const columnsByName = useMemo(
    () => new Map(columns.map(column => [column.name, column])),
    [columns]
  );
  const columnNames = useMemo(
    () => columns.map(column => column.name),
    [columns]
  );
  const suggestedVariablesByName = useMemo(
    () => new Map(variables.map(variable => [variable.name, variable])),
    [variables]
  );

  const nextRowIdRef = useRef(0);
  const createRow = useCallback(
    (overrides: Partial<Omit<SelectedVariableDraftRow, 'id'>> = {}) =>
      createSelectedVariableDraftRow(
        `selected-variable-row-${nextRowIdRef.current++}`,
        overrides
      ),
    []
  );

  const [rows, setRows] = useState<SelectedVariableDraftRow[]>(() => [
    createRow(),
  ]);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [validationAttempted, setValidationAttempted] = useState(false);

  const wasOpenRef = useRef(false);
  const lastHydratedFingerprintRef = useRef<string | null>(null);
  const lastSerializedFingerprintRef = useRef<string | null>(null);

  const externalSelectedVariables = useMemo(
    () => normalizeSelectedVariablesValue(localInputData.selected_variables),
    [localInputData.selected_variables]
  );
  const externalFingerprint = useMemo(
    () => JSON.stringify(externalSelectedVariables),
    [externalSelectedVariables]
  );

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }

    const justOpened = !wasOpenRef.current;
    wasOpenRef.current = true;

    if (
      !justOpened &&
      externalFingerprint === lastSerializedFingerprintRef.current
    ) {
      return;
    }

    if (
      !justOpened &&
      externalFingerprint === lastHydratedFingerprintRef.current
    ) {
      return;
    }

    const hydratedRows = hydrateSelectedVariableRows(
      externalSelectedVariables,
      () => `selected-variable-row-${nextRowIdRef.current++}`
    );
    const nextRows = hydratedRows.length > 0 ? hydratedRows : [createRow()];

    setRows(nextRows);
    setActiveRowId(
      resolveNextActiveRowId({ nextRows, previousActiveRowId: null })
    );
    setValidationAttempted(false);
    setValidationErrors?.({});
    lastHydratedFingerprintRef.current = externalFingerprint;
    lastSerializedFingerprintRef.current = externalFingerprint;
  }, [
    createRow,
    externalFingerprint,
    externalSelectedVariables,
    isOpen,
    setValidationErrors,
  ]);

  const commitRows = useCallback(
    (
      updater:
        | SelectedVariableDraftRow[]
        | ((
            currentRows: SelectedVariableDraftRow[]
          ) => SelectedVariableDraftRow[]),
      options?: { preferredActiveRowId?: string | null }
    ) => {
      let nextRowsSnapshot: SelectedVariableDraftRow[] = [];
      let nextActiveRowIdSnapshot: string | null = null;

      setRows(currentRows => {
        const updatedRows =
          typeof updater === 'function' ? updater(currentRows) : updater;
        const nextRows = updatedRows.length > 0 ? updatedRows : [createRow()];

        nextRowsSnapshot = nextRows;
        nextActiveRowIdSnapshot = resolveNextActiveRowId({
          nextRows,
          previousActiveRowId: activeRowId,
          preferredRowId: options?.preferredActiveRowId,
        });

        return nextRows;
      });

      if (nextRowsSnapshot.length === 0) {
        return;
      }

      setActiveRowId(nextActiveRowIdSnapshot);

      const serializedRows = serializeSelectedVariableRows(nextRowsSnapshot);
      lastSerializedFingerprintRef.current =
        toSelectedVariablesFingerprint(serializedRows);

      setLocalInputData(previousInputData => ({
        ...previousInputData,
        selected_variables: serializedRows,
      }));
    },
    [activeRowId, createRow, setLocalInputData]
  );

  const validationResult = useMemo(
    () =>
      validateSelectedVariableRows({
        rows,
        availableColumnNames: columnNames,
      }),
    [columnNames, rows]
  );

  useEffect(() => {
    if (!validationAttempted) {
      return;
    }

    if (validationResult.isValid) {
      setValidationErrors?.({});
      return;
    }

    setValidationErrors?.({
      selected_variables:
        validationResult.flatErrors.length > 0
          ? validationResult.flatErrors
          : ['Исправьте ошибки в выбранных переменных.'],
    });
  }, [setValidationErrors, validationAttempted, validationResult]);

  useEffect(() => {
    setValidationCallback?.(() => {
      return () => {
        setValidationAttempted(true);

        if (!validationResult.isValid) {
          setValidationErrors?.({
            selected_variables:
              validationResult.flatErrors.length > 0
                ? validationResult.flatErrors
                : ['Исправьте ошибки в выбранных переменных.'],
          });
          return false;
        }

        setValidationErrors?.({});
        return true;
      };
    });
  }, [setValidationCallback, setValidationErrors, validationResult]);

  const patchRow = useCallback(
    (rowId: string, patch: SelectedVariableDraftPatch) => {
      commitRows(
        currentRows =>
          currentRows.map(row =>
            row.id === rowId
              ? applySelectedVariableDraftRowPatch({
                  row,
                  patch,
                  getColumnDtype: columnName =>
                    columnsByName.get(columnName)?.dtype,
                })
              : row
          ),
        { preferredActiveRowId: rowId }
      );
    },
    [columnsByName, commitRows]
  );

  const handleVariableNameChange = useCallback(
    (rowId: string, variableName: string) => {
      patchRow(rowId, { variableName });
    },
    [patchRow]
  );

  const handleColumnChange = useCallback(
    (rowId: string, sourceColumnName: string) => {
      patchRow(rowId, { sourceColumnName });
    },
    [patchRow]
  );

  const handleAggFuncChange = useCallback(
    (rowId: string, aggFunc: string) => {
      patchRow(rowId, {
        aggFunc: aggFunc as SelectedVariableDraftRow['aggFunc'],
      });
    },
    [patchRow]
  );

  const handleReplaceRow = useCallback(
    (rowId: string, nextRowDraft: Omit<SelectedVariableDraftRow, 'id'>) => {
      patchRow(rowId, nextRowDraft);
    },
    [patchRow]
  );

  const handleAddRow = useCallback(() => {
    const nextRow = createRow();
    commitRows(currentRows => [...currentRows, nextRow], {
      preferredActiveRowId: nextRow.id,
    });
  }, [commitRows, createRow]);

  const handleRemoveRow = useCallback(
    (rowId: string) => {
      commitRows(currentRows => currentRows.filter(row => row.id !== rowId), {
        preferredActiveRowId: activeRowId === rowId ? null : activeRowId,
      });
    },
    [activeRowId, commitRows]
  );

  const handleClearAll = useCallback(() => {
    const nextRow = createRow();
    setValidationAttempted(false);
    setValidationErrors?.({});
    commitRows([nextRow], { preferredActiveRowId: nextRow.id });
  }, [commitRows, createRow, setValidationErrors]);

  const rowViewModels = useMemo<SelectedVariableRowViewModel[]>(
    () =>
      rows.map((row, index) => {
        const selectedColumn = row.sourceColumnName
          ? (columnsByName.get(row.sourceColumnName) ?? null)
          : null;
        const rowErrors = validationAttempted
          ? (validationResult.rowErrors[row.id] ?? {})
          : {};
        const availableAggFuncs = row.sourceColumnName
          ? getAvailableAggFuncsForColumn(selectedColumn?.dtype)
          : getAvailableAggFuncsForColumn(undefined);

        return {
          row,
          index,
          rowErrors,
          selectedColumn,
          availableAggFuncs,
          suggestedVariable: suggestedVariablesByName.get(
            row.variableName.trim()
          ),
          isRowReady:
            Boolean(
              row.variableName.trim() &&
              row.sourceColumnName.trim() &&
              row.aggFunc
            ) && Object.keys(rowErrors).length === 0,
        };
      }),
    [
      columnsByName,
      rows,
      suggestedVariablesByName,
      validationAttempted,
      validationResult.rowErrors,
    ]
  );

  const activeRow =
    rowViewModels.find(rowViewModel => rowViewModel.row.id === activeRowId) ??
    rowViewModels[0] ??
    null;

  const dataframeUnavailableMessage =
    columns.length === 0
      ? 'Подключите входной DataFrame к `df`, чтобы выбрать доступные колонки.'
      : null;

  return {
    activeRow,
    activeRowId,
    dataframeUnavailableMessage,
    readyRowsCount: validationResult.readyRowsCount,
    rowViewModels,
    setActiveRowId,
    validationAttempted,
    validationResult,
    onAddRow: handleAddRow,
    onAggFuncChange: handleAggFuncChange,
    onClearAll: handleClearAll,
    onColumnChange: handleColumnChange,
    onRemoveRow: handleRemoveRow,
    onReplaceRow: handleReplaceRow,
    onVariableNameChange: handleVariableNameChange,
  };
};
