import React, { useEffect, useMemo, useRef, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { Alert, Button, Divider, Stack, Typography } from '@mui/material';

import type { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import {
  isExpressionValue,
  normalizePrimitiveExpressionValue,
} from '@/shared/lib/node-input-values';
import {
  DEFAULT_UNSET_SENTINEL,
  hydrateDefaultLiteralDraft,
  isPrimitiveVariableType,
  isSafeVariableIdentifier,
  isTypedLiteralValueValid,
  parseDefaultLiteralDraft,
} from '@/shared/lib/variables';

import { ManageVariableRowEditor } from './components/ManageVariableRowEditor';
import type { ManageVariableRow, ManageVariablesValues } from './types';

const createRowID = () =>
  `managed-variable-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const serializeRows = (rows: ManageVariableRow[]): Record<string, unknown> =>
  rows.reduce<Record<string, unknown>>((acc, row) => {
    const trimmedName = row.name.trim();

    if (!trimmedName) {
      return acc;
    }

    const payload: Record<string, unknown> = {
      type: row.type,
      nullable: row.nullable,
    };
    const currentValue = row.mode === 'value' ? row.value : row.value_input;

    if (row.mode === 'value_input' || isExpressionValue(currentValue)) {
      if (currentValue !== undefined) {
        payload['value_input'] = currentValue;
      }
    } else if (currentValue !== undefined) {
      payload['value'] = currentValue;
    }

    const parsedDefault = parseDefaultLiteralDraft(row.default_literal);
    payload['default'] = parsedDefault.error
      ? DEFAULT_UNSET_SENTINEL
      : parsedDefault.value;

    acc[trimmedName] = payload;
    return acc;
  }, {});

const hydrateRows = (rawValue: unknown): ManageVariableRow[] => {
  if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
    return [];
  }

  return Object.entries(rawValue as Record<string, any>).map(
    ([name, payload]) => {
      const hydratedValueInput =
        payload && 'value_input' in payload
          ? (normalizePrimitiveExpressionValue(payload.value_input) ??
            payload.value_input)
          : (normalizePrimitiveExpressionValue(payload?.value) ?? undefined);
      const mode = hydratedValueInput !== undefined ? 'value_input' : 'value';

      return {
        id: createRowID(),
        name,
        type: isPrimitiveVariableType(payload?.type) ? payload.type : 'STRING',
        mode,
        value: mode === 'value' ? payload?.value : undefined,
        value_input: hydratedValueInput,
        nullable: Boolean(payload?.nullable),
        default_literal: hydrateDefaultLiteralDraft(payload?.default),
        valueJsonError: null,
      } as ManageVariableRow;
    }
  );
};

const buildEmptyRow = (): ManageVariableRow => ({
  id: createRowID(),
  name: '',
  type: 'STRING',
  mode: 'value',
  value: '',
  nullable: false,
  default_literal: '',
  valueJsonError: null,
});

export const ManageVariablesNode: React.FC<
  NodeModalExtensionProps<ManageVariablesValues>
> = ({
  localInputData,
  setLocalInputData,
  setValidationCallback,
  setValidationErrors,
  variables,
}) => {
  const [rows, setRows] = useState<ManageVariableRow[]>(() =>
    hydrateRows(localInputData?.defined_variables)
  );
  const serializedRowsRef = useRef(
    JSON.stringify(localInputData?.defined_variables ?? {})
  );

  useEffect(() => {
    const nextFingerprint = JSON.stringify(
      localInputData?.defined_variables ?? {}
    );
    if (nextFingerprint === serializedRowsRef.current) {
      return;
    }

    serializedRowsRef.current = nextFingerprint;
    setRows(hydrateRows(localInputData?.defined_variables));
  }, [localInputData?.defined_variables]);

  useEffect(() => {
    const serializedRows = serializeRows(rows);
    const nextFingerprint = JSON.stringify(serializedRows);
    if (nextFingerprint === serializedRowsRef.current) {
      return;
    }

    serializedRowsRef.current = nextFingerprint;
    setLocalInputData(prev => ({
      ...(prev ?? {}),
      defined_variables: serializedRows,
    }));
  }, [rows, setLocalInputData]);

  const validationMessages = useMemo(() => {
    const messages: string[] = [];
    const seenNames = new Set<string>();

    rows.forEach((row, index) => {
      const rowIndex = index + 1;
      const trimmedName = row.name.trim();
      const currentValue = row.mode === 'value' ? row.value : row.value_input;
      const parsedDefault = parseDefaultLiteralDraft(row.default_literal);

      if (!trimmedName) {
        messages.push(`Строка ${rowIndex}: имя переменной обязательно.`);
      } else if (!isSafeVariableIdentifier(trimmedName)) {
        messages.push(
          `Строка ${rowIndex}: имя "${trimmedName}" должно быть валидным идентификатором Python.`
        );
      } else if (seenNames.has(trimmedName)) {
        messages.push(
          `Строка ${rowIndex}: переменная "${trimmedName}" повторяется.`
        );
      } else {
        seenNames.add(trimmedName);
      }

      if (row.mode === 'value_input') {
        if (!isExpressionValue(currentValue)) {
          messages.push(
            `Строка ${rowIndex}: в режиме value_input ожидается expression payload.`
          );
        }
      } else if (!isTypedLiteralValueValid(row.type, currentValue)) {
        messages.push(
          `Строка ${rowIndex}: значение не соответствует типу ${row.type}.`
        );
      }

      if (row.valueJsonError) {
        messages.push(`Строка ${rowIndex}: ${row.valueJsonError}`);
      }

      if (parsedDefault.error) {
        messages.push(`Строка ${rowIndex}: ${parsedDefault.error}`);
      } else if (
        !parsedDefault.isUnset &&
        !isTypedLiteralValueValid(row.type, parsedDefault.value)
      ) {
        messages.push(
          `Строка ${rowIndex}: default не соответствует типу ${row.type}.`
        );
      }
    });

    return messages;
  }, [rows]);

  useEffect(() => {
    setValidationCallback?.(() => () => {
      if (validationMessages.length > 0) {
        setValidationErrors?.({ defined_variables: validationMessages });
        return false;
      }

      setValidationErrors?.({});
      return true;
    });
  }, [setValidationCallback, setValidationErrors, validationMessages]);

  return (
    <Stack spacing={2}>
      <Typography variant='body2' color='text.secondary'>
        Создаёт или переопределяет набор переменных через nested payload
        `defined_variables`.
      </Typography>

      {validationMessages.length > 0 ? (
        <Alert severity='error'>
          {validationMessages.map(message => (
            <Typography key={message} variant='body2'>
              {message}
            </Typography>
          ))}
        </Alert>
      ) : null}

      <Stack spacing={2} divider={<Divider flexItem />}>
        {rows.map(row => (
          <ManageVariableRowEditor
            key={row.id}
            row={row}
            variables={variables}
            onDelete={() =>
              setRows(prevRows =>
                prevRows.filter(prevRow => prevRow.id !== row.id)
              )
            }
            onPatch={patch =>
              setRows(prevRows =>
                prevRows.map(prevRow =>
                  prevRow.id === row.id ? { ...prevRow, ...patch } : prevRow
                )
              )
            }
          />
        ))}
      </Stack>

      <Button
        variant='outlined'
        startIcon={<AddIcon />}
        onClick={() => setRows(prevRows => [...prevRows, buildEmptyRow()])}
      >
        Добавить переменную
      </Button>
    </Stack>
  );
};
