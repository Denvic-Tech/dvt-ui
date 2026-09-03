import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import type { OnMount } from '@monaco-editor/react';
import { FormControl, FormHelperText, OutlinedInput } from '@mui/material';
import * as monacoTypes from 'monaco-editor';

import type { ExpressionsConfig } from '@/shared/gatewayClient';
import {
  isExpressionValue,
  makeExpressionValue,
} from '@/shared/lib/node-input-values';
import {
  getVariableNamespaceCompletionContext,
  type VariableOutput,
} from '@/shared/lib/variables';
import {
  CodeEditor,
  type CodeEditorCompletionProvider,
  type CodeEditorMarker,
} from '@/shared/ui/code-editor';

import {
  buildExpressionAutocompleteCatalog,
  getInlineExpressionDiagnostics,
  resolveInlineAutocomplete,
} from './HighlightedSingleLineField.shared';
import { normalizeMonacoTextValue } from './monacoTextValue';
import {
  resolveTemplateMonacoMode,
  shouldNormalizeTemplateExpressionValue,
} from './TemplateMonacoInput.helpers';
import { useExpressionsConfigContext } from './useExpressionsConfigContext';

export type MonacoSuggestion = {
  label: string;
  kind: monacoTypes.languages.CompletionItemKind;
  insertText: string;
  detail?: string;
};

type TemplateMonacoInputProps = {
  value: unknown;
  onChange: (value: unknown) => void;
  variables?: VariableOutput[];
  inputVariables?: VariableOutput[] | undefined;
  projectVariables?: VariableOutput[] | undefined;
  allowExpressions?: boolean;
  language?: string;
  height?: string | number;
  helperText?: React.ReactNode;
  additionalSuggestions?: MonacoSuggestion[];
  completionProviders?: Array<CodeEditorCompletionProvider<void>> | undefined;
  expressionsConfig?: ExpressionsConfig | null;
  expressionPolicyName?: string | null | undefined;
  renderMode?: 'editor' | 'canvas' | undefined;
  onMount?: OnMount | undefined;
};

type TemplateExpressionRange = {
  expression: string;
  expressionEnd: number;
  expressionStart: number;
  fullEnd: number;
  fullStart: number;
};

const MARKER_OWNER = 'dvt-template-expressions';
const EMPTY_COMPLETION_PROVIDERS: Array<CodeEditorCompletionProvider<void>> =
  [];
const EMPTY_ADDITIONAL_SUGGESTIONS: MonacoSuggestion[] = [];
const EMPTY_VARIABLES: VariableOutput[] = [];

const getCodeEditorCompletionKind = (
  kind: ReturnType<typeof resolveInlineAutocomplete>['items'][number]['kind']
) => {
  if (kind === 'variable') {
    return 'variable' as const;
  }

  if (kind === 'global') {
    return 'function' as const;
  }

  if (kind === 'filter' || kind === 'test') {
    return 'keyword' as const;
  }

  if (kind === 'operator') {
    return 'operator' as const;
  }

  return 'value' as const;
};

const getOffsetAt = (
  model: monacoTypes.editor.ITextModel,
  position: monacoTypes.Position
) => model.getOffsetAt(position);

const extractTemplateExpressionRanges = (
  value: string
): TemplateExpressionRange[] => {
  const ranges: TemplateExpressionRange[] = [];
  let cursor = 0;

  while (cursor < value.length) {
    const openIndex = value.indexOf('{{', cursor);
    if (openIndex < 0) {
      break;
    }

    const closeIndex = value.indexOf('}}', openIndex + 2);
    if (closeIndex < 0) {
      break;
    }

    const expressionStart = openIndex + 2;
    const expressionEnd = closeIndex;
    ranges.push({
      expression: value.slice(expressionStart, expressionEnd),
      expressionEnd,
      expressionStart,
      fullEnd: closeIndex + 2,
      fullStart: openIndex,
    });

    cursor = closeIndex + 2;
  }

  return ranges;
};

const getActiveTemplateRange = (
  value: string,
  cursorOffset: number
): TemplateExpressionRange | null => {
  const openIndex = value.lastIndexOf('{{', cursorOffset);
  if (openIndex < 0) {
    return null;
  }

  const closeIndex = value.indexOf('}}', openIndex + 2);
  if (closeIndex >= 0 && closeIndex < cursorOffset) {
    return null;
  }

  return {
    expression: value.slice(
      openIndex + 2,
      closeIndex >= 0 ? closeIndex : cursorOffset
    ),
    expressionStart: openIndex + 2,
    expressionEnd: closeIndex >= 0 ? closeIndex : cursorOffset,
    fullStart: openIndex,
    fullEnd: closeIndex >= 0 ? closeIndex + 2 : cursorOffset,
  };
};

export const TemplateMonacoInput: React.FC<TemplateMonacoInputProps> = ({
  value,
  onChange,
  variables = EMPTY_VARIABLES,
  inputVariables,
  projectVariables,
  allowExpressions = false,
  language = 'plaintext',
  height = 280,
  helperText,
  additionalSuggestions = EMPTY_ADDITIONAL_SUGGESTIONS,
  completionProviders: externalCompletionProviders = EMPTY_COMPLETION_PROVIDERS,
  expressionsConfig: expressionsConfigProp,
  expressionPolicyName,
  renderMode = 'editor',
  onMount,
}) => {
  const { expressionsConfig: expressionsConfigFromContext } =
    useExpressionsConfigContext();
  const expressionsConfig =
    expressionsConfigProp ?? expressionsConfigFromContext ?? null;
  const hasVariableNamespaces =
    inputVariables !== undefined || projectVariables !== undefined;
  const resolvedInputVariables = inputVariables ?? EMPTY_VARIABLES;
  const resolvedProjectVariables = projectVariables ?? EMPTY_VARIABLES;
  const lastAutoNormalizedValueRef = useRef<string | null>(null);

  const templateBinding = useMemo(
    () =>
      isExpressionValue(value) && value.expression_kind === 'template'
        ? value
        : null,
    [value]
  );
  const templateBindingValue = useMemo(() => {
    if (templateBinding) {
      return templateBinding.value;
    }

    if (typeof value !== 'object' || value === null) {
      return undefined;
    }

    const maybeTemplateBinding = value as Record<string, unknown>;
    if (
      maybeTemplateBinding['__dvt_type'] === 'expr' &&
      maybeTemplateBinding['expression_kind'] === 'template'
    ) {
      return maybeTemplateBinding['value'];
    }

    return undefined;
  }, [templateBinding, value]);
  const hasTemplateBindingValue = templateBindingValue !== undefined;
  const editorValue = hasTemplateBindingValue
    ? normalizeMonacoTextValue(templateBindingValue)
    : normalizeMonacoTextValue(value);
  const mode = resolveTemplateMonacoMode({
    allowExpressions,
    isTemplateBinding: hasTemplateBindingValue,
    value: editorValue,
  });
  const expressionAutocompleteCatalog = useMemo(
    () =>
      buildExpressionAutocompleteCatalog({
        variables,
        inputVariables,
        projectVariables,
        inputType: 'STRING',
        expressionsConfig,
        expressionPolicyName,
      }),
    [
      expressionPolicyName,
      expressionsConfig,
      inputVariables,
      projectVariables,
      variables,
    ]
  );
  const templateDiagnostics = useMemo(() => {
    if (!allowExpressions) {
      return [];
    }

    return extractTemplateExpressionRanges(editorValue).flatMap(range =>
      getInlineExpressionDiagnostics(range.expression, {
        variables,
        inputVariables,
        projectVariables,
        expressionsConfig,
        expressionPolicyName,
      }).map(diagnostic => ({
        ...diagnostic,
        start: range.expressionStart + diagnostic.start,
        end: range.expressionStart + diagnostic.end,
      }))
    );
  }, [
    allowExpressions,
    editorValue,
    expressionPolicyName,
    expressionsConfig,
    inputVariables,
    projectVariables,
    variables,
  ]);
  const errorText = templateDiagnostics[0]?.message;
  const resolvedHelperText = errorText ?? helperText;

  const markers = useMemo<CodeEditorMarker[]>(
    () =>
      templateDiagnostics.map(diagnostic => ({
        start: diagnostic.start,
        end: diagnostic.end,
        message: diagnostic.message,
        severity: 'error',
      })),
    [templateDiagnostics]
  );

  const handleChange = useCallback(
    (nextValue?: string) => {
      const resolvedValue = nextValue ?? '';
      const nextMode = resolveTemplateMonacoMode({
        allowExpressions,
        isTemplateBinding: mode === 'template',
        value: resolvedValue,
      });

      if (nextMode === 'template') {
        onChange(makeExpressionValue(resolvedValue, 'template'));
        return;
      }

      onChange(resolvedValue);
    },
    [allowExpressions, mode, onChange]
  );

  useEffect(() => {
    if (
      !shouldNormalizeTemplateExpressionValue({
        allowExpressions,
        isTemplateBinding: hasTemplateBindingValue,
        value: editorValue,
      })
    ) {
      lastAutoNormalizedValueRef.current = null;
      return;
    }

    if (lastAutoNormalizedValueRef.current === editorValue) {
      return;
    }

    lastAutoNormalizedValueRef.current = editorValue;
    onChange(makeExpressionValue(editorValue, 'template'));
  }, [
    allowExpressions,
    editorValue,
    hasTemplateBindingValue,
    onChange,
    templateBinding,
  ]);

  const completionProviders = useMemo<
    Array<CodeEditorCompletionProvider<void>>
  >(() => {
    const isInsideTemplateExpression = (
      model: monacoTypes.editor.ITextModel,
      position: monacoTypes.Position
    ) => {
      if (!allowExpressions) {
        return false;
      }

      return Boolean(
        getActiveTemplateRange(model.getValue(), getOffsetAt(model, position))
      );
    };

    const templateProvider: CodeEditorCompletionProvider<void> = {
      id: 'dvt-template-expression',
      priority: 0,
      triggerCharacters: [
        '{',
        '.',
        '"',
        "'",
        '|',
        '_',
        '(',
        ',',
        '=',
        '!',
        '<',
        '>',
      ],
      getSections: ({ model, position }) => {
        const currentValue = model.getValue();
        const cursorOffset = getOffsetAt(model, position);
        const activeTemplateRange = allowExpressions
          ? getActiveTemplateRange(currentValue, cursorOffset)
          : null;

        if (!activeTemplateRange) {
          return [];
        }

        const innerCursorOffset =
          cursorOffset - activeTemplateRange.expressionStart;
        const namespaceContext = hasVariableNamespaces
          ? getVariableNamespaceCompletionContext(
              activeTemplateRange.expression,
              innerCursorOffset
            )
          : null;

        if (namespaceContext) {
          const scopedVariables =
            namespaceContext.namespace === 'input_variables'
              ? resolvedInputVariables
              : resolvedProjectVariables;
          const startPosition = model.getPositionAt(
            activeTemplateRange.expressionStart + namespaceContext.replaceStart
          );
          const endPosition = model.getPositionAt(
            activeTemplateRange.expressionStart + namespaceContext.replaceEnd
          );

          return [
            {
              id: `${namespaceContext.namespace}-names`,
              priority: 0,
              items: scopedVariables.map(variable => ({
                label: variable.name,
                kind: 'variable',
                insertText: variable.name,
                detail: `${namespaceContext.namespace} / ${variable.type}`,
                filterText: [variable.name, variable.scope, variable.type].join(
                  ' '
                ),
                range: {
                  startLineNumber: startPosition.lineNumber,
                  startColumn: startPosition.column,
                  endLineNumber: endPosition.lineNumber,
                  endColumn: endPosition.column,
                },
              })),
            },
          ];
        }

        const decision = resolveInlineAutocomplete(
          activeTemplateRange.expression,
          innerCursorOffset,
          expressionAutocompleteCatalog
        );

        return [
          {
            id: 'template-expression',
            priority: 0,
            items: decision.items.map(item => {
              const startPosition = model.getPositionAt(
                activeTemplateRange.expressionStart + decision.replaceStart
              );
              const endPosition = model.getPositionAt(
                activeTemplateRange.expressionStart + decision.replaceEnd
              );

              return {
                label: item.label,
                kind: getCodeEditorCompletionKind(item.kind),
                insertText: item.insertText,
                detail: item.detail,
                filterText: [
                  item.label,
                  item.insertText,
                  ...(item.keywords ?? []),
                ].join(' '),
                range: {
                  startLineNumber: startPosition.lineNumber,
                  startColumn: startPosition.column,
                  endLineNumber: endPosition.lineNumber,
                  endColumn: endPosition.column,
                },
              };
            }),
          },
        ];
      },
    };

    const legacySuggestionsProvider: CodeEditorCompletionProvider<void> = {
      id: 'dvt-node-hints',
      priority: 10,
      triggerCharacters: ['.', ' ', '\n', '_'],
      getSections: ({ model, position }) => {
        if (
          additionalSuggestions.length === 0 ||
          isInsideTemplateExpression(model, position)
        ) {
          return [];
        }

        return [
          {
            id: 'node-hints',
            priority: 0,
            items: additionalSuggestions.map(item => ({
              label: item.label,
              insertText: item.insertText,
              monacoKind: item.kind,
              detail: item.detail,
            })),
          },
        ];
      },
    };

    const guardedExternalProviders = externalCompletionProviders.map(
      provider => ({
        ...provider,
        priority: provider.priority ?? 20,
        getSections: (
          params: Parameters<
            CodeEditorCompletionProvider<void>['getSections']
          >[0]
        ) => {
          if (isInsideTemplateExpression(params.model, params.position)) {
            return [];
          }

          return provider.getSections(params);
        },
      })
    );

    return [
      templateProvider,
      legacySuggestionsProvider,
      ...guardedExternalProviders,
    ];
  }, [
    additionalSuggestions,
    allowExpressions,
    expressionAutocompleteCatalog,
    externalCompletionProviders,
    hasVariableNamespaces,
    resolvedInputVariables,
    resolvedProjectVariables,
  ]);

  if (renderMode === 'canvas') {
    return (
      <FormControl fullWidth error={Boolean(errorText)}>
        <OutlinedInput
          multiline
          minRows={3}
          value={editorValue}
          onChange={event => handleChange(event.target.value)}
          sx={{ fontSize: 13 }}
        />
        {resolvedHelperText ? (
          <FormHelperText>{resolvedHelperText}</FormHelperText>
        ) : null}
      </FormControl>
    );
  }

  return (
    <div
      data-testid='shared/ui/node-input/template-monaco-input'
      data-template-language={language}
      style={{ display: 'contents' }}
    >
      <CodeEditor
        value={editorValue}
        onChange={handleChange}
        language={language}
        height={height}
        helperText={resolvedHelperText}
        error={Boolean(errorText)}
        completionProviders={completionProviders}
        markers={markers}
        markerOwner={MARKER_OWNER}
        onMount={onMount}
      />
    </div>
  );
};
