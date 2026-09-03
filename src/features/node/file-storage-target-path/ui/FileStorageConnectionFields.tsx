import {
  type ChangeEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import { alpha, Collapse, styled } from '@mui/material';

import type { DBConnectionRecord } from '@/entities/data/db-connection';

import type { NodeDefinition } from '@/shared/gatewayClient';
import {
  isExpressionValue,
  makeExpressionValue,
} from '@/shared/lib/node-input-values';
import { getClearedValueByType, parseConstValue } from '@/shared/lib/node-io';
import type { VariableOutput } from '@/shared/lib/variables';
import {
  filterVariablesByTypes,
  HighlightedSingleLineFieldV2,
} from '@/shared/ui/node-input';
import {
  buildExpressionAutocompleteCatalog,
  getInlineExpressionDiagnostics,
} from '@/shared/ui/node-input/HighlightedSingleLineField.shared';
import { buildSingleExpressionValue } from '@/shared/ui/node-input/primitiveExpression';
import { useExpressionsConfigContext } from '@/shared/ui/node-input/useExpressionsConfigContext';
import { Select } from '@/shared/ui/primitives';

import type {
  FileStorageConnectionMetadata,
  FileStorageConnectionOverrideFieldName,
  FileStorageConnectionOverridesValue,
} from './fileStorageConnectionFields.helpers';
import {
  getConnectionOverrideFieldDefaultValue,
  getConnectionOverrideFieldValue,
  getFileStorageOverrideBranch,
  getFileStorageOverrideFields,
  getNormalizedConnectionOverridesValue,
  isSameConnectionOverridesValue,
  resolveConnectedFileStorageType,
  setConnectionOverrideFieldValue,
} from './fileStorageConnectionFields.helpers';
import {
  EXPRESSION_AUTOCOMPLETE_VARIABLE_TYPES,
  resolveTone,
} from './FileStorageTargetPathSection.helpers';
import { ExpressionIcon, InfoIcon } from './FileStorageTargetPathSection.icons';
import {
  ExpressionInputShell,
  ExpressionToggleButton,
  FieldHint,
  PathFieldRow,
  PathInput,
} from './FileStorageTargetPathSection.styles';

const SectionCard = styled('div')(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 14,
  background: theme.palette.background.paper,
  overflow: 'hidden',
}));

const SectionHeader = styled('button', {
  shouldForwardProp: prop => prop !== 'isOpen',
})<{ isOpen: boolean }>(({ theme, isOpen }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  width: '100%',
  minHeight: 40,
  padding: '7px 16px',
  border: 'none',
  borderBottom: `1px solid ${isOpen ? theme.palette.divider : 'transparent'}`,
  background: isOpen
    ? alpha(theme.palette.text.primary, 0.025)
    : theme.palette.background.paper,
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background-color 180ms ease, border-bottom-color 180ms ease',
  '&:focus-visible': {
    outline: 'none',
    boxShadow: 'inset 0 0 0 3px rgba(99,102,241,0.12)',
  },
}));

const HeaderMain = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0,
  flex: 1,
});

const HeaderIconBox = styled('div')(({ theme }) => ({
  width: 18,
  height: 18,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.grey[500],
  flexShrink: 0,
}));

const HeaderTitleRow = styled('div')({
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
  flexWrap: 'wrap',
  minWidth: 0,
});

const HeaderTitle = styled('span')(({ theme }) => ({
  fontSize: 13.5,
  fontWeight: 600,
  color: theme.palette.grey[900],
}));

const HeaderOptional = styled('span')(({ theme }) => ({
  fontSize: 12,
  fontWeight: 500,
  color: theme.palette.grey[400],
}));

const CollapseIconBox = styled('div', {
  shouldForwardProp: prop => prop !== 'isOpen',
})<{ isOpen: boolean }>(({ isOpen, theme }) => ({
  width: 18,
  height: 18,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.grey[500],
  flexShrink: 0,
  transition: 'transform 150ms ease',
  transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
}));

const SectionBody = styled('div')({
  padding: 16,
});

const SectionDescription = styled('div')(({ theme }) => ({
  marginBottom: 14,
  fontSize: 12.5,
  color: theme.palette.grey[500],
}));

const FieldsGrid = styled('div')({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 14,
  '@media (max-width: 720px)': {
    gridTemplateColumns: '1fr',
  },
});

const FieldBlock = styled('div')({
  minWidth: 0,
});

const FieldHeader = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  marginBottom: 8,
});

const FieldLabel = styled('span')(({ theme }) => ({
  fontSize: 12,
  fontWeight: 700,
  color: theme.palette.grey[700],
}));

const CompactPathFieldRow = styled(PathFieldRow)({
  padding: '4px 6px 4px 12px',
  minHeight: 40,
});

const CompactPathInput = styled(PathInput)({
  padding: '4px 0',
  fontSize: 13,
});

const CompactExpressionInputShell = styled(ExpressionInputShell)({
  '& > .MuiFormControl-root > .MuiBox-root > .MuiBox-root': {
    padding: '4px 0 !important',
  },
});

const VERIFY_SELECT_SX = {
  borderRadius: '12px',
} as const;

type ConnectionOverrideFieldProps = {
  defaultValue: string;
  fieldName: FileStorageConnectionOverrideFieldName;
  inputDefinition: NonNullable<
    ReturnType<typeof getFileStorageOverrideFields>
  >[number]['inputDefinition'];
  value: unknown;
  variables: VariableOutput[];
  onChange: (nextValue: unknown) => void;
};

const ConnectionOverrideField = ({
  defaultValue,
  fieldName,
  inputDefinition,
  value,
  variables,
  onChange,
}: ConnectionOverrideFieldProps) => {
  const { expressionsConfig } = useExpressionsConfigContext();
  const expressionValue = useMemo(() => {
    if (isExpressionValue(value) && value.expression_kind === 'single') {
      return value;
    }

    return null;
  }, [value]);
  const isExpressionMode = expressionValue !== null;
  const literalValue =
    typeof value === 'boolean'
      ? String(value)
      : typeof value === 'string'
        ? value
        : '';
  const isVerifyInput = fieldName === 'verify';
  const inheritedValueLabel = defaultValue
    ? `Из connection (${defaultValue})`
    : 'Из connection';
  const verifyOptions = useMemo(
    () => [
      { label: inheritedValueLabel, value: '' },
      { label: 'True', value: 'true' },
      { label: 'False', value: 'false' },
    ],
    [inheritedValueLabel]
  );
  const lastLiteralValueRef = useRef<unknown>(undefined);
  const hasLiteralSnapshotRef = useRef(false);

  useEffect(() => {
    if (isExpressionMode) {
      return;
    }

    lastLiteralValueRef.current = value;
    hasLiteralSnapshotRef.current = true;
  }, [isExpressionMode, value]);

  const expressionAutocompleteVariables = useMemo(
    () =>
      filterVariablesByTypes(
        variables ?? [],
        EXPRESSION_AUTOCOMPLETE_VARIABLE_TYPES
      ),
    [variables]
  );

  const expressionAutocompleteCatalog = useMemo(() => {
    if (!inputDefinition?.allow_expressions) {
      return buildExpressionAutocompleteCatalog({
        variables: [],
        inputType: inputDefinition?.type,
      });
    }

    return buildExpressionAutocompleteCatalog({
      variables: expressionAutocompleteVariables,
      inputType: inputDefinition?.type,
      expressionsConfig,
      expressionPolicyName: inputDefinition.expression_policy,
    });
  }, [
    expressionAutocompleteVariables,
    expressionsConfig,
    inputDefinition?.allow_expressions,
    inputDefinition?.expression_policy,
    inputDefinition?.type,
  ]);

  const expressionDiagnostics = useMemo(() => {
    if (!expressionValue) {
      return [];
    }

    return getInlineExpressionDiagnostics(`=${expressionValue.value}`, {
      variables: variables ?? [],
      inputType: inputDefinition?.type,
      expressionsConfig,
      expressionPolicyName: inputDefinition?.expression_policy,
    });
  }, [
    expressionValue,
    expressionsConfig,
    inputDefinition?.expression_policy,
    inputDefinition?.type,
    variables,
  ]);

  const expressionErrorText =
    expressionDiagnostics.find(diagnostic => diagnostic.severity === 'error')
      ?.message ?? null;
  const expressionWarningText =
    expressionDiagnostics.find(diagnostic => diagnostic.severity === 'warning')
      ?.message ?? null;
  const tone = resolveTone(expressionErrorText, expressionWarningText);

  const handleExpressionModeToggle = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();

      if (!inputDefinition?.allow_expressions) {
        return;
      }

      if (isExpressionMode) {
        onChange(
          hasLiteralSnapshotRef.current
            ? lastLiteralValueRef.current
            : getClearedValueByType(inputDefinition.type)
        );
        return;
      }

      lastLiteralValueRef.current = value;
      hasLiteralSnapshotRef.current = true;
      onChange(buildSingleExpressionValue(inputDefinition.type, value));
    },
    [inputDefinition, isExpressionMode, onChange, value]
  );

  const handleLiteralChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextText = event.target.value;

      if (inputDefinition?.allow_expressions && nextText.startsWith('=')) {
        onChange(makeExpressionValue(nextText.slice(1).trimStart(), 'single'));
        return;
      }

      onChange(parseConstValue(nextText, inputDefinition));
    },
    [inputDefinition, onChange]
  );

  const handleExpressionChange = useCallback(
    (nextText: string) => {
      if (!nextText.startsWith('=')) {
        onChange(parseConstValue(nextText, inputDefinition));
        return;
      }

      onChange(makeExpressionValue(nextText.slice(1).trimStart(), 'single'));
    },
    [inputDefinition, onChange]
  );

  return (
    <FieldBlock>
      <FieldHeader>
        <FieldLabel>{inputDefinition.display_name}</FieldLabel>
        {inputDefinition.allow_expressions ? (
          <ExpressionToggleButton
            active={isExpressionMode}
            onClick={handleExpressionModeToggle}
            type='button'
          >
            <ExpressionIcon
              size={13}
              color={isExpressionMode ? '#4f46e5' : '#94a3b8'}
            />
            Режим выражения
          </ExpressionToggleButton>
        ) : null}
      </FieldHeader>

      {isExpressionMode ? (
        <CompactPathFieldRow expr hasError={tone === 'error'}>
          <CompactExpressionInputShell>
            <HighlightedSingleLineFieldV2
              value={expressionValue ? `=${expressionValue.value}` : '='}
              onChange={handleExpressionChange}
              placeholder='${expression}'
              variables={variables ?? []}
              autocompleteCatalog={expressionAutocompleteCatalog}
              autoFormatOnBlur
              diagnostics={expressionDiagnostics}
            />
          </CompactExpressionInputShell>
        </CompactPathFieldRow>
      ) : isVerifyInput ? (
        <Select
          aria-label={inputDefinition.display_name || 'Verify'}
          options={verifyOptions}
          placeholder={inheritedValueLabel}
          sx={VERIFY_SELECT_SX}
          value={literalValue}
          onChange={nextValue =>
            onChange(nextValue === '' ? undefined : nextValue === 'true')
          }
        />
      ) : (
        <CompactPathFieldRow expr={false} hasError={tone === 'error'}>
          <CompactPathInput
            expr={false}
            value={literalValue}
            onChange={handleLiteralChange}
            placeholder={
              defaultValue || inputDefinition.display_name || undefined
            }
          />
        </CompactPathFieldRow>
      )}

      {expressionErrorText || expressionWarningText ? (
        <FieldHint tone={tone}>
          <InfoIcon
            size={13}
            color={tone === 'error' ? '#ef4444' : '#d97706'}
          />
          {expressionErrorText ?? expressionWarningText}
        </FieldHint>
      ) : null}
    </FieldBlock>
  );
};

type FileStorageConnectionFieldsProps = {
  connectionMetadata: FileStorageConnectionMetadata;
  connectionRecord?: DBConnectionRecord | null | undefined;
  nodeDefinition: NodeDefinition | null | undefined;
  value: FileStorageConnectionOverridesValue;
  variables: VariableOutput[];
  onChange: (nextValue: FileStorageConnectionOverridesValue) => void;
};

export const FileStorageConnectionFields = ({
  connectionMetadata,
  connectionRecord,
  nodeDefinition,
  value,
  variables,
  onChange,
}: FileStorageConnectionFieldsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const connectionType = useMemo(
    () =>
      resolveConnectedFileStorageType({
        connectionMetadata,
        connectionRecord,
      }),
    [connectionMetadata, connectionRecord]
  );
  const branch = useMemo(
    () => getFileStorageOverrideBranch(connectionType),
    [connectionType]
  );
  const fields = useMemo(
    () =>
      getFileStorageOverrideFields({
        nodeDefinition,
        branch,
      }),
    [branch, nodeDefinition]
  );
  const normalizedValue = useMemo(
    () =>
      getNormalizedConnectionOverridesValue({
        branch,
        fields,
        value,
      }),
    [branch, fields, value]
  );

  useEffect(() => {
    if (!isSameConnectionOverridesValue(value, normalizedValue)) {
      onChange(normalizedValue);
    }
  }, [normalizedValue, onChange, value]);

  if (!connectionMetadata || fields.length === 0) {
    return null;
  }

  return (
    <SectionCard>
      <SectionHeader
        isOpen={isOpen}
        type='button'
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-label={
          isOpen
            ? 'Свернуть параметры подключения'
            : 'Развернуть параметры подключения'
        }
      >
        <CollapseIconBox isOpen={isOpen}>
          <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />
        </CollapseIconBox>
        <HeaderMain>
          <HeaderIconBox>
            <TuneRoundedIcon sx={{ fontSize: 18 }} />
          </HeaderIconBox>
          <HeaderTitleRow>
            <HeaderTitle>Параметры подключения</HeaderTitle>
            <HeaderOptional>опционально</HeaderOptional>
          </HeaderTitleRow>
        </HeaderMain>
      </SectionHeader>

      <Collapse in={isOpen}>
        <SectionBody>
          <SectionDescription>
            По умолчанию берутся из connection. Заполните, чтобы переопределить
            для этой ноды.
          </SectionDescription>

          <FieldsGrid>
            {fields.map(field => {
              const fieldValue = getConnectionOverrideFieldValue({
                branch,
                fieldName: field.attrName,
                value: normalizedValue,
              });

              return (
                <ConnectionOverrideField
                  key={field.attrName}
                  defaultValue={getConnectionOverrideFieldDefaultValue({
                    connectionMetadata,
                    connectionRecord,
                    fieldName: field.attrName,
                  })}
                  fieldName={field.attrName}
                  inputDefinition={field.inputDefinition}
                  value={fieldValue}
                  onChange={nextValue =>
                    onChange(
                      setConnectionOverrideFieldValue({
                        branch,
                        fieldName: field.attrName,
                        fieldValue: nextValue,
                        fields,
                        value: normalizedValue,
                      })
                    )
                  }
                  variables={variables}
                />
              );
            })}
          </FieldsGrid>
        </SectionBody>
      </Collapse>
    </SectionCard>
  );
};
