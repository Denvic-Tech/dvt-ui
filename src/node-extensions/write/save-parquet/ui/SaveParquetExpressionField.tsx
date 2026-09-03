import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';

import type { InputDefinitionModel } from '@/shared/gatewayClient';
import {
  isExpressionValue,
  makeExpressionValue,
} from '@/shared/lib/node-input-values';
import type { VariableOutput } from '@/shared/lib/variables';
import { PrimitiveNodeInput } from '@/shared/ui/node-input';
import { buildSingleExpressionValue } from '@/shared/ui/node-input/primitiveExpression';

import {
  ExpressionFieldHeader,
  ExpressionFieldLabel,
  ExpressionModeButton,
} from './SaveParquetEditor.styles';

type SaveParquetExpressionFieldProps = {
  inputDefinition: InputDefinitionModel | null | undefined;
  value: unknown;
  onChange: (nextValue: unknown) => void;
  variables?: VariableOutput[] | undefined;
  title: string;
  literalFallback: unknown;
  literalHeaderContent?: React.ReactNode | undefined;
  children?: React.ReactNode | undefined;
};

const buildExpressionFromLiteral = (
  inputDefinition: InputDefinitionModel | null | undefined,
  value: unknown
) => {
  if (Array.isArray(value)) {
    return makeExpressionValue(
      value.length > 0 ? JSON.stringify(value) : '',
      'single'
    );
  }

  return buildSingleExpressionValue(inputDefinition?.type, value);
};

export const SaveParquetExpressionField: React.FC<
  SaveParquetExpressionFieldProps
> = ({
  inputDefinition,
  value,
  onChange,
  variables = [],
  title,
  literalFallback,
  literalHeaderContent,
  children,
}) => {
  const expressionValue = useMemo(
    () =>
      isExpressionValue(value) && value.expression_kind === 'single'
        ? value
        : null,
    [value]
  );
  const isExpressionMode = expressionValue !== null;
  const lastLiteralValueRef = useRef<unknown>(undefined);
  const hasLiteralSnapshotRef = useRef(false);

  useEffect(() => {
    if (isExpressionMode) {
      return;
    }

    lastLiteralValueRef.current = value;
    hasLiteralSnapshotRef.current = true;
  }, [isExpressionMode, value]);

  const handleModeToggle = useCallback(() => {
    if (!inputDefinition?.allow_expressions) {
      return;
    }

    if (isExpressionMode) {
      onChange(
        hasLiteralSnapshotRef.current
          ? lastLiteralValueRef.current
          : literalFallback
      );
      return;
    }

    lastLiteralValueRef.current = value;
    hasLiteralSnapshotRef.current = true;
    onChange(buildExpressionFromLiteral(inputDefinition, value));
  }, [inputDefinition, isExpressionMode, literalFallback, onChange, value]);

  const handleExpressionChange = useCallback(
    (nextValue: unknown) => {
      if (isExpressionValue(nextValue)) {
        onChange(nextValue);
        return;
      }

      onChange(inputDefinition?.is_list_type ? literalFallback : nextValue);
    },
    [inputDefinition?.is_list_type, literalFallback, onChange]
  );
  return (
    <div>
      <ExpressionFieldHeader>
        {!isExpressionMode && literalHeaderContent ? (
          literalHeaderContent
        ) : (
          <ExpressionFieldLabel>{title}</ExpressionFieldLabel>
        )}

        {inputDefinition?.allow_expressions ? (
          <ExpressionModeButton
            type='button'
            active={isExpressionMode}
            onClick={handleModeToggle}
            aria-pressed={isExpressionMode}
            aria-label={`Режим выражения: ${title}`}
          >
            <CodeRoundedIcon sx={{ fontSize: 14 }} />
            Режим выражения
          </ExpressionModeButton>
        ) : null}
      </ExpressionFieldHeader>

      {isExpressionMode ? (
        <PrimitiveNodeInput
          inputDefinition={inputDefinition}
          value={expressionValue}
          onChange={handleExpressionChange}
          variables={variables}
        />
      ) : (
        children
      )}
    </div>
  );
};
