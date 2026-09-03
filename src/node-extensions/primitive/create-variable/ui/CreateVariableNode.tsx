import React, { useEffect, useMemo, useState } from 'react';
import {
  FormControl,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import type { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { TypedVariableValueEditor } from '@/features/node/primitive-variable-editor';
import {
  LiteralValueField,
  VariablePolicyFields,
} from '@/features/node/variable-policy';

import {
  isExpressionValue,
  normalizePrimitiveExpressionValue,
} from '@/shared/lib/node-input-values';
import {
  DEFAULT_UNSET_SENTINEL,
  getDefaultValueForPrimitiveType,
  hydrateDefaultLiteralDraft,
  isPrimitiveVariableType,
  isSafeVariableIdentifier,
  isTypedLiteralValueValid,
  normalizeDefaultLiteralDraft,
  parseDefaultLiteralDraft,
  PRIMITIVE_VARIABLE_TYPES,
  type PrimitiveVariableType,
} from '@/shared/lib/variables';

type CreateVariableValues = {
  default?: unknown;
  name?: string;
  nullable?: boolean;
  type?: PrimitiveVariableType;
  value?: unknown;
};

const DEFAULT_TYPE: PrimitiveVariableType = 'STRING';
const DEFAULT_HELPER_TEXT =
  'Оставьте поле пустым, чтобы default не назначать. Для пустой строки используйте `""`.';

export const CreateVariableNode: React.FC<
  NodeModalExtensionProps<CreateVariableValues>
> = ({
  localInputData,
  setLocalInputData,
  setValidationCallback,
  setValidationErrors,
  variables,
}) => {
  const [jsonValueError, setJsonValueError] = useState<string | null>(null);
  const [defaultLiteral, setDefaultLiteral] = useState(() =>
    hydrateDefaultLiteralDraft(localInputData?.default)
  );

  const selectedType = isPrimitiveVariableType(localInputData?.type)
    ? localInputData.type
    : DEFAULT_TYPE;
  const nameValue = localInputData?.name ?? '';
  const value = localInputData?.value;
  const nullable = Boolean(localInputData?.nullable);
  const parsedDefault = useMemo(
    () => parseDefaultLiteralDraft(defaultLiteral),
    [defaultLiteral]
  );

  useEffect(() => {
    if (isPrimitiveVariableType(localInputData?.type)) {
      return;
    }

    setLocalInputData(prev => ({
      ...(prev ?? {}),
      type: DEFAULT_TYPE,
      value: prev?.value ?? getDefaultValueForPrimitiveType(DEFAULT_TYPE),
      nullable: prev?.nullable ?? false,
    }));
  }, [localInputData?.type, setLocalInputData]);

  useEffect(() => {
    if (Object.prototype.hasOwnProperty.call(localInputData ?? {}, 'default')) {
      return;
    }

    setLocalInputData(prev => ({
      ...(prev ?? {}),
      default: DEFAULT_UNSET_SENTINEL,
    }));
  }, [localInputData, setLocalInputData]);

  useEffect(() => {
    setDefaultLiteral(hydrateDefaultLiteralDraft(localInputData?.default));
  }, [localInputData?.default]);

  const handleTypeChange = (nextType: PrimitiveVariableType) => {
    setJsonValueError(null);
    setLocalInputData(prev => ({
      ...(prev ?? {}),
      type: nextType,
      value:
        normalizePrimitiveExpressionValue(prev?.value) ??
        getDefaultValueForPrimitiveType(nextType),
    }));
  };

  const validationErrors = useMemo(() => {
    const nextErrors: Record<string, string[]> = {};
    const trimmedName = nameValue.trim();

    if (!trimmedName) {
      nextErrors['name'] = ['Имя переменной обязательно.'];
    } else if (!isSafeVariableIdentifier(trimmedName)) {
      nextErrors['name'] = [
        'Имя переменной должно быть валидным идентификатором Python.',
      ];
    }

    if (!isPrimitiveVariableType(selectedType)) {
      nextErrors['type'] = ['Тип переменной обязателен.'];
    }

    if (
      !isExpressionValue(value) &&
      !isTypedLiteralValueValid(selectedType, value)
    ) {
      nextErrors['value'] = ['Значение не соответствует выбранному типу.'];
    }

    if (jsonValueError) {
      nextErrors['value'] = [jsonValueError];
    }

    if (parsedDefault.error) {
      nextErrors['default'] = [parsedDefault.error];
    } else if (
      !parsedDefault.isUnset &&
      !isTypedLiteralValueValid(selectedType, parsedDefault.value)
    ) {
      nextErrors['default'] = ['Default не соответствует выбранному типу.'];
    }

    return nextErrors;
  }, [jsonValueError, nameValue, parsedDefault, selectedType, value]);

  useEffect(() => {
    setValidationCallback?.(() => () => {
      setValidationErrors?.(validationErrors);
      return Object.keys(validationErrors).length === 0;
    });
  }, [setValidationCallback, setValidationErrors, validationErrors]);

  return (
    <Stack spacing={2}>
      <Typography variant='body2' color='text.secondary'>
        Создаёт переменную с заданным именем, типом, значением и null-policy.
      </Typography>

      <TextField
        fullWidth
        size='small'
        label='Имя'
        value={nameValue}
        onChange={event =>
          setLocalInputData(prev => ({
            ...(prev ?? {}),
            name: event.target.value,
          }))
        }
        helperText='Имя переменной в Python-совместимом формате.'
        error={Boolean(validationErrors['name'])}
      />

      <FormControl fullWidth size='small'>
        <Select
          value={selectedType}
          onChange={event =>
            handleTypeChange(event.target.value as PrimitiveVariableType)
          }
        >
          {PRIMITIVE_VARIABLE_TYPES.map(type => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Stack spacing={1}>
        <Typography variant='body2'>Value</Typography>
        <TypedVariableValueEditor
          type={selectedType}
          value={value}
          onChange={nextValue => {
            setJsonValueError(null);
            setLocalInputData(prev => ({
              ...(prev ?? {}),
              value: nextValue,
            }));
          }}
          allowExpressions
          jsonError={jsonValueError}
          onJsonErrorChange={setJsonValueError}
          variables={variables}
        />
      </Stack>

      <VariablePolicyFields
        nullable={nullable}
        onNullableChange={nextValue =>
          setLocalInputData(prev => ({
            ...(prev ?? {}),
            nullable: nextValue,
          }))
        }
        defaultEditor={
          <LiteralValueField
            label='Default'
            value={defaultLiteral}
            onChange={nextValue => {
              const normalizedLiteral = normalizeDefaultLiteralDraft(nextValue);
              const nextDefault = parseDefaultLiteralDraft(normalizedLiteral);

              setDefaultLiteral(normalizedLiteral);
              setLocalInputData(prev => ({
                ...(prev ?? {}),
                default: nextDefault.error
                  ? DEFAULT_UNSET_SENTINEL
                  : nextDefault.value,
              }));
            }}
            errorText={validationErrors['default']?.[0]}
            helperText={DEFAULT_HELPER_TEXT}
            placeholder='Например: 0, null, "fallback", {"key": 1}'
          />
        }
      />
    </Stack>
  );
};
