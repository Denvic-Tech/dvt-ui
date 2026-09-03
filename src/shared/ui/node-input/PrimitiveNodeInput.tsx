import React, { memo, useCallback, useMemo } from 'react';
import AbcRoundedIcon from '@mui/icons-material/AbcRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import {
  Box,
  InputAdornment,
  OutlinedInput,
  Switch,
  Tooltip,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { KeyboardEvent } from 'react';

import type { InputDefinitionModel } from '@/shared/gatewayClient';
import { zIo } from '@/shared/gatewayClient';
import {
  isExpressionValue,
  makeExpressionValue,
} from '@/shared/lib/node-input-values';
import { getClearedValueByType, parseConstValue } from '@/shared/lib/node-io';
import { type VariableOutput, type VariableType } from '@/shared/lib/variables';
import { IconButton } from '@/shared/ui/primitives';

import { DVTDateTimePicker } from './DVTDateTimePicker';
import { HighlightedSingleLineField } from './HighlightedSingleLineField';
import {
  buildExpressionAutocompleteCatalog,
  getInlineExpressionDiagnostics,
} from './HighlightedSingleLineField.shared';
import { HighlightedSingleLineFieldV2 } from './HighlightedSingleLineFieldV2';
import { buildSingleExpressionValue } from './primitiveExpression';
import { TimeDeltaInput } from './TimeDeltaInput';
import { useExpressionsConfigContext } from './useExpressionsConfigContext';
import { filterVariablesByTypes } from './variableSections';

export type PrimitiveNodeInputRenderMode = 'editor' | 'canvas';
export type PrimitiveNodeInputInlineActionSide = 'start' | 'end';

export interface PrimitiveNodeInputInlineAction {
  id: string;
  side?: PrimitiveNodeInputInlineActionSide | undefined;
  icon: NonNullable<React.ReactNode>;
  ariaLabel: string;
  tooltip?: React.ReactNode | undefined;
  onClick: () => void;
  disabled?: boolean | undefined;
  sx?: SxProps<Theme> | undefined;
}

export interface PrimitiveNodeInputProps {
  inputDefinition: InputDefinitionModel | null | undefined;
  value: unknown;
  onChange: (currentValue: unknown) => void;
  variables?: VariableOutput[];
  expressionsConfig?: import('@/shared/gatewayClient').ExpressionsConfig | null;
  renderMode?: PrimitiveNodeInputRenderMode | undefined;
  masked?: boolean | undefined;
  inlineActions?: PrimitiveNodeInputInlineAction[] | undefined;
}

const EXPRESSION_HELP_TEXT =
  'Expression mode. Удалите ведущий "=" чтобы вернуться к literal. Переменные хранятся как expr(single).';
const EXPRESSION_HELP_ACTION_SX = {
  color: 'text.secondary',
  opacity: 0.55,
  '&:hover': {
    backgroundColor: 'transparent',
    color: 'text.secondary',
    opacity: 0.55,
  },
} as const;
const EXPRESSION_CLEAR_ACTION_SX = {
  color: '#94a3b8',
  transition: 'color 150ms ease',
  '&:hover': {
    backgroundColor: 'transparent',
    color: '#475569',
  },
} as const;

const EXPRESSION_AUTOCOMPLETE_VARIABLE_TYPES: VariableType[] = [
  'STRING',
  'BOOLEAN',
  'INT',
  'FLOAT',
  'DATETIME',
  'TIMEDELTA',
];

const PrimitiveNodeInput: React.FC<PrimitiveNodeInputProps> = ({
  inputDefinition,
  value,
  onChange,
  variables = [],
  expressionsConfig: expressionsConfigProp,
  renderMode = 'editor',
  masked = false,
  inlineActions = [],
}) => {
  const { expressionsConfig: expressionsConfigFromContext } =
    useExpressionsConfigContext();
  const expressionsConfig =
    expressionsConfigProp ?? expressionsConfigFromContext ?? null;
  const primitiveExpressionInputType =
    typeof inputDefinition?.type === 'string' ? inputDefinition.type : null;
  const expressionAutocompleteVariables = useMemo(
    () =>
      filterVariablesByTypes(variables, EXPRESSION_AUTOCOMPLETE_VARIABLE_TYPES),
    [variables]
  );

  const selectedExpressionBinding = useMemo(
    () =>
      isExpressionValue(value) && value.expression_kind === 'single'
        ? value
        : null,
    [value]
  );

  const expressionAutocompleteCatalog = useMemo(() => {
    if (!inputDefinition?.allow_expressions) {
      return buildExpressionAutocompleteCatalog({
        variables: [],
        inputType: primitiveExpressionInputType,
      });
    }

    return buildExpressionAutocompleteCatalog({
      variables: expressionAutocompleteVariables,
      inputType: primitiveExpressionInputType,
      expressionsConfig,
      expressionPolicyName: inputDefinition.expression_policy,
    });
  }, [
    expressionAutocompleteVariables,
    expressionsConfig,
    inputDefinition?.allow_expressions,
    inputDefinition?.expression_policy,
    primitiveExpressionInputType,
  ]);
  const expressionDiagnostics = useMemo(() => {
    if (!selectedExpressionBinding) {
      return [];
    }

    return getInlineExpressionDiagnostics(
      `=${selectedExpressionBinding.value}`,
      {
        variables,
        inputType: inputDefinition?.type,
        expressionsConfig,
        expressionPolicyName: inputDefinition?.expression_policy,
      }
    );
  }, [
    expressionsConfig,
    inputDefinition?.expression_policy,
    inputDefinition?.type,
    selectedExpressionBinding,
    variables,
  ]);
  const expressionErrorText = expressionDiagnostics.find(
    diagnostic => diagnostic.severity === 'error'
  )?.message;
  const expressionWarningText = expressionDiagnostics.find(
    diagnostic => diagnostic.severity === 'warning'
  )?.message;
  const SingleLineFieldComponent =
    renderMode === 'canvas'
      ? HighlightedSingleLineField
      : HighlightedSingleLineFieldV2;

  const constValue = useMemo(() => {
    if (selectedExpressionBinding) {
      return inputDefinition?.default ?? null;
    }

    return value ?? inputDefinition?.default ?? null;
  }, [inputDefinition?.default, selectedExpressionBinding, value]);

  const handleClearValue = useCallback(() => {
    onChange(getClearedValueByType(inputDefinition?.type));
  }, [inputDefinition?.type, onChange]);

  const handleExpressionShortcut = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (
        event.key !== '=' ||
        !inputDefinition?.allow_expressions ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      event.preventDefault();
      onChange(buildSingleExpressionValue(inputDefinition.type, constValue));
    },
    [
      constValue,
      inputDefinition?.allow_expressions,
      inputDefinition?.type,
      onChange,
    ]
  );

  const handleEnterExpressionMode = useCallback(() => {
    if (!inputDefinition?.allow_expressions) {
      return;
    }

    onChange(buildSingleExpressionValue(inputDefinition.type, constValue));
  }, [
    constValue,
    inputDefinition?.allow_expressions,
    inputDefinition?.type,
    onChange,
  ]);

  const handleFreeTextChange = useCallback(
    (nextText: string) => {
      if (inputDefinition?.allow_expressions && nextText.startsWith('=')) {
        onChange(makeExpressionValue(nextText.slice(1).trimStart(), 'single'));
        return;
      }

      onChange(parseConstValue(nextText, inputDefinition));
    },
    [inputDefinition, onChange]
  );

  const handleExpressionTextChange = useCallback(
    (nextText: string) => {
      if (!nextText.startsWith('=')) {
        onChange(parseConstValue(nextText, inputDefinition));
        return;
      }

      onChange(makeExpressionValue(nextText.slice(1).trimStart(), 'single'));
    },
    [inputDefinition, onChange]
  );

  const handleNumericChange = useCallback(
    (nextText: string) => {
      onChange(parseConstValue(nextText, inputDefinition));
    },
    [inputDefinition, onChange]
  );

  const renderInlineActionButton = useCallback(
    (action: PrimitiveNodeInputInlineAction) => {
      const button = (
        <IconButton
          key={action.id}
          aria-label={action.ariaLabel}
          {...(action.disabled != null ? { disabled: action.disabled } : {})}
          size='sm'
          variant='ghost'
          onMouseDown={event => event.preventDefault()}
          onClick={action.onClick}
          {...(action.sx !== undefined ? { sx: action.sx } : {})}
        >
          {action.icon}
        </IconButton>
      );

      if (!action.tooltip) {
        return button;
      }

      return (
        <Tooltip key={action.id} title={action.tooltip}>
          <span>{button}</span>
        </Tooltip>
      );
    },
    []
  );

  const startInlineActions = useMemo(
    () =>
      inlineActions
        .filter(action => (action.side ?? 'end') === 'start')
        .map(renderInlineActionButton),
    [inlineActions, renderInlineActionButton]
  );
  const endInlineActions = useMemo(
    () =>
      inlineActions
        .filter(action => (action.side ?? 'end') === 'end')
        .map(renderInlineActionButton),
    [inlineActions, renderInlineActionButton]
  );

  const clearActionButton = (
    <IconButton
      aria-label='Очистить значение'
      size='sm'
      variant='ghost'
      onMouseDown={event => event.preventDefault()}
      onClick={handleClearValue}
    >
      <CloseRoundedIcon fontSize='small' />
    </IconButton>
  );
  const clearAction = (
    <Tooltip title='Очистить значение'>
      <span>{clearActionButton}</span>
    </Tooltip>
  );
  const expressionHelpAction = (
    <Tooltip title={EXPRESSION_HELP_TEXT}>
      <span>
        <IconButton
          aria-label='Справка по режиму выражения'
          size='sm'
          variant='ghost'
          onMouseDown={event => event.preventDefault()}
          sx={EXPRESSION_HELP_ACTION_SX}
        >
          <HelpOutlineRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </span>
    </Tooltip>
  );
  const expressionClearAction = (
    <IconButton
      aria-label='Очистить значение'
      size='sm'
      variant='ghost'
      onMouseDown={event => event.preventDefault()}
      onClick={handleClearValue}
      sx={EXPRESSION_CLEAR_ACTION_SX}
    >
      <CloseRoundedIcon sx={{ fontSize: 18 }} />
    </IconButton>
  );

  const expressionModeAction = inputDefinition?.allow_expressions ? (
    <Tooltip title='Перейти в режим выражения'>
      <span>
        <IconButton
          aria-label='Перейти в режим выражения'
          size='sm'
          variant='ghost'
          onMouseDown={event => event.preventDefault()}
          onClick={handleEnterExpressionMode}
        >
          <AbcRoundedIcon fontSize='small' />
        </IconButton>
      </span>
    </Tooltip>
  ) : null;
  const literalEndActions = (
    <>
      {endInlineActions}
      {expressionModeAction}
      {clearAction}
    </>
  );
  const expressionEndActions = (
    <>
      {endInlineActions}
      {expressionHelpAction}
      {expressionClearAction}
    </>
  );
  const renderAdornmentActions = (actions: React.ReactNode) => (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
      {actions}
    </Box>
  );

  if (selectedExpressionBinding) {
    return (
      <SingleLineFieldComponent
        value={`=${selectedExpressionBinding.value}`}
        onChange={handleExpressionTextChange}
        placeholder='=base_limit + 5'
        variables={variables}
        autocompleteCatalog={expressionAutocompleteCatalog}
        startActions={
          startInlineActions.length > 0 ? startInlineActions : undefined
        }
        endActions={expressionEndActions}
        autoFormatOnBlur
        diagnostics={expressionDiagnostics}
        errorText={expressionErrorText}
        warningText={expressionWarningText}
        {...(renderMode === 'editor' ? { borderRadius: '10px' } : {})}
      />
    );
  }

  if (inputDefinition?.type === zIo.enum.BOOLEAN) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          gap: 0.5,
        }}
        onKeyDown={handleExpressionShortcut}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            minWidth: 50,
          }}
        >
          <Switch
            checked={Boolean(constValue)}
            onChange={(_event, checked) => onChange(checked)}
            size='small'
          />
        </Box>
        {expressionModeAction}
      </Box>
    );
  }

  if (inputDefinition?.type === zIo.enum.INT) {
    return (
      <OutlinedInput
        fullWidth
        size='small'
        type='number'
        value={constValue == null ? '' : String(constValue)}
        onChange={event => handleNumericChange(event.target.value)}
        onKeyDown={handleExpressionShortcut}
        inputProps={{
          step: 1,
          inputMode: 'numeric',
        }}
        startAdornment={
          startInlineActions.length > 0 ? (
            <InputAdornment position='start'>
              {renderAdornmentActions(startInlineActions)}
            </InputAdornment>
          ) : undefined
        }
        endAdornment={
          <InputAdornment position='end'>
            {renderAdornmentActions(literalEndActions)}
          </InputAdornment>
        }
        sx={{ minWidth: 150 }}
      />
    );
  }

  if (inputDefinition?.type === zIo.enum.FLOAT) {
    return (
      <OutlinedInput
        fullWidth
        size='small'
        type='number'
        value={constValue == null ? '' : String(constValue)}
        onChange={event => handleNumericChange(event.target.value)}
        onKeyDown={handleExpressionShortcut}
        inputProps={{
          step: inputDefinition.step ?? 'any',
          inputMode: 'decimal',
        }}
        startAdornment={
          startInlineActions.length > 0 ? (
            <InputAdornment position='start'>
              {renderAdornmentActions(startInlineActions)}
            </InputAdornment>
          ) : undefined
        }
        endAdornment={
          <InputAdornment position='end'>
            {renderAdornmentActions(literalEndActions)}
          </InputAdornment>
        }
        sx={{ minWidth: 150 }}
      />
    );
  }

  if (inputDefinition?.type === zIo.enum.DATETIME) {
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 0.5 }}
        onKeyDown={handleExpressionShortcut}
      >
        <DVTDateTimePicker
          initialIsoValue={typeof constValue === 'string' ? constValue : null}
          onPythonDateTimeChange={onChange}
          label={null}
        />
        {expressionModeAction}
        {clearAction}
      </Box>
    );
  }

  if (inputDefinition?.type === zIo.enum.TIMEDELTA) {
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 0.5 }}
        onKeyDown={handleExpressionShortcut}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <TimeDeltaInput
            value={typeof constValue === 'string' ? constValue : ''}
            onChange={nextValue => onChange(nextValue)}
          />
        </Box>
        {expressionModeAction}
        {clearAction}
      </Box>
    );
  }

  if (masked) {
    return (
      <OutlinedInput
        fullWidth
        size='small'
        type='password'
        value={constValue == null ? '' : String(constValue)}
        onChange={event => handleFreeTextChange(event.target.value)}
        onKeyDown={handleExpressionShortcut}
        startAdornment={
          startInlineActions.length > 0 ? (
            <InputAdornment position='start'>
              {renderAdornmentActions(startInlineActions)}
            </InputAdornment>
          ) : undefined
        }
        endAdornment={
          <InputAdornment position='end'>
            {renderAdornmentActions(literalEndActions)}
          </InputAdornment>
        }
        inputProps={{
          autoCapitalize: 'off',
          autoComplete: 'new-password',
          autoCorrect: 'off',
          spellCheck: false,
        }}
        sx={{ minWidth: 150 }}
      />
    );
  }

  return (
    <SingleLineFieldComponent
      value={constValue == null ? '' : String(constValue)}
      onChange={handleFreeTextChange}
      placeholder={
        inputDefinition?.default == null
          ? undefined
          : String(inputDefinition.default)
      }
      startActions={
        startInlineActions.length > 0 ? startInlineActions : undefined
      }
      endActions={literalEndActions}
      highlightingEnabled={false}
      autoFormatOnBlur={false}
    />
  );
};

export default memo(PrimitiveNodeInput);
