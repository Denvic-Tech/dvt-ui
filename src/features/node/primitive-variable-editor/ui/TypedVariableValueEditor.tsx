import { useEffect, useMemo, useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';

import {
  getSingleVariableNameFromValue,
  isExpressionValue,
  makeExpressionValue,
} from '@/shared/lib/node-input-values';
import {
  buildPrimitiveInputDefinition,
  getDefaultValueForPrimitiveType,
  type PrimitiveVariableType,
  type VariableOutput,
} from '@/shared/lib/variables';
import {
  HighlightedSingleLineFieldV2,
  JSONNodeInput,
  PrimitiveNodeInput,
} from '@/shared/ui/node-input';

type TypedVariableValueEditorProps = {
  allowExpressions: boolean;
  jsonError?: string | null | undefined;
  onChange: (nextValue: unknown) => void;
  onJsonErrorChange?: ((nextError: string | null) => void) | undefined;
  type: PrimitiveVariableType;
  value: unknown;
  variables?: VariableOutput[] | undefined;
};

const isJsonObjectLike = (value: unknown): boolean =>
  typeof value === 'object' && value !== null && !isExpressionValue(value);

const getJsonDraftFromValue = (value: unknown): string => {
  if (isExpressionValue(value)) {
    return value.expression_kind === 'single' ? `=${value.value}` : value.value;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (isJsonObjectLike(value)) {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return '';
    }
  }

  return '';
};

const getResetValueForType = (type: PrimitiveVariableType): unknown =>
  type === 'DATETIME' ? '' : getDefaultValueForPrimitiveType(type);

export const TypedVariableValueEditor = ({
  allowExpressions,
  jsonError,
  onChange,
  onJsonErrorChange,
  type,
  value,
  variables = [],
}: TypedVariableValueEditorProps) => {
  const [jsonDraft, setJsonDraft] = useState('');

  const isNullLiteral = !isExpressionValue(value) && value === null;

  useEffect(() => {
    if (type !== 'JSON' || isNullLiteral) {
      return;
    }

    setJsonDraft(getJsonDraftFromValue(value));
  }, [isNullLiteral, type, value]);

  const primitiveVariables = useMemo(
    () => (allowExpressions ? variables : []),
    [allowExpressions, variables]
  );

  const handleJsonChange = (nextValue: unknown) => {
    if (allowExpressions && isExpressionValue(nextValue)) {
      onJsonErrorChange?.(null);
      onChange(nextValue);
      return;
    }

    const nextDraft = typeof nextValue === 'string' ? nextValue : '';
    setJsonDraft(nextDraft);

    if (!nextDraft.trim()) {
      onJsonErrorChange?.(null);
      onChange({});
      return;
    }

    try {
      const parsedValue = JSON.parse(nextDraft);
      onJsonErrorChange?.(null);
      onChange(parsedValue);
    } catch {
      onJsonErrorChange?.('Некорректный JSON формат.');
    }
  };

  const handleJsonSingleLineChange = (nextValue: string) => {
    if (allowExpressions && nextValue.startsWith('=')) {
      onJsonErrorChange?.(null);
      onChange(makeExpressionValue(nextValue.slice(1).trimStart(), 'single'));
      return;
    }

    handleJsonChange(nextValue);
  };

  const handleSetNull = () => {
    onJsonErrorChange?.(null);
    onChange(null);
  };

  const handleClearNull = () => {
    onJsonErrorChange?.(null);
    onChange(getResetValueForType(type));
  };

  const shouldRenderJsonSingleLine =
    type === 'JSON' && !isNullLiteral && jsonDraft.startsWith('=');

  return (
    <Stack spacing={1}>
      <Stack direction='row' spacing={1} alignItems='center'>
        <Button
          size='small'
          variant='text'
          onClick={isNullLiteral ? handleClearNull : handleSetNull}
        >
          {isNullLiteral ? 'Clear null' : 'Set null'}
        </Button>
        {isNullLiteral ? (
          <Typography variant='caption' color='text.secondary'>
            Будет отправлен literal `null`.
          </Typography>
        ) : null}
      </Stack>

      {isNullLiteral ? null : type === 'JSON' ? (
        shouldRenderJsonSingleLine ? (
          <HighlightedSingleLineFieldV2
            value={jsonDraft}
            onChange={handleJsonSingleLineChange}
            placeholder='=base_limit + 5'
            helperText='Expression mode. Удалите ведущий "=" чтобы вернуться к JSON literal.'
            variables={primitiveVariables}
            autoFormatOnBlur
            errorText={jsonError}
          />
        ) : (
          <JSONNodeInput
            value={value}
            onChange={handleJsonChange}
            onValidationErrorChange={onJsonErrorChange}
            variables={primitiveVariables}
            allowVariableBinding={allowExpressions}
            title='JSON literal'
            hint={
              allowExpressions
                ? 'JSON literal или ссылка на переменную.'
                : 'Только JSON literal.'
            }
            errorText={jsonError}
          />
        )
      ) : (
        <PrimitiveNodeInput
          inputDefinition={buildPrimitiveInputDefinition(
            type,
            allowExpressions
          )}
          value={value}
          onChange={onChange}
          variables={primitiveVariables}
        />
      )}
    </Stack>
  );
};
