import React, { useMemo } from 'react';
import type { OnMount } from '@monaco-editor/react';

import {
  buildPythonVariableReference,
  getVariableNamespaceCompletionContext,
  type VariableOutput,
} from '@/shared/lib/variables';
import {
  CodeEditor,
  type CodeEditorCompletionProvider,
} from '@/shared/ui/code-editor';

import { normalizeMonacoTextValue } from './monacoTextValue';

const EMPTY_COMPLETION_PROVIDERS: Array<CodeEditorCompletionProvider<void>> =
  [];
const EMPTY_VARIABLES: VariableOutput[] = [];

type PythonCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  variables?: VariableOutput[];
  inputVariables?: VariableOutput[] | undefined;
  projectVariables?: VariableOutput[] | undefined;
  height?: string | number;
  helperText?: string;
  completionProviders?: Array<CodeEditorCompletionProvider<void>> | undefined;
  onMount?: OnMount | undefined;
};

export const PythonCodeInput: React.FC<PythonCodeInputProps> = ({
  value,
  onChange,
  variables = EMPTY_VARIABLES,
  inputVariables,
  projectVariables,
  height = 320,
  helperText,
  completionProviders: externalCompletionProviders = EMPTY_COMPLETION_PROVIDERS,
  onMount,
}) => {
  const editorValue = normalizeMonacoTextValue(value);
  const hasScopedVariables =
    inputVariables !== undefined || projectVariables !== undefined;
  const resolvedInputVariables =
    inputVariables ?? (hasScopedVariables ? EMPTY_VARIABLES : variables);
  const resolvedProjectVariables = projectVariables ?? EMPTY_VARIABLES;

  const suggestions = useMemo(() => {
    const items: Array<{
      label: string;
      insertText: string;
      detail: string;
    }> = [
      {
        label: 'input_variables',
        insertText: 'input_variables',
        detail: 'Variables received from upstream nodes',
      },
    ];

    if (hasScopedVariables) {
      items.push({
        label: 'project_variables',
        insertText: 'project_variables',
        detail: 'Project variables',
      });
    }

    const appendVariableSuggestions = (
      namespace: 'input_variables' | 'project_variables',
      scopedVariables: VariableOutput[]
    ) => {
      for (const variable of scopedVariables) {
        const reference = buildPythonVariableReference(
          variable.name,
          namespace
        );
        items.push({
          label: reference,
          insertText: reference,
          detail: `${namespace} / ${variable.type}`,
        });
      }
    };

    appendVariableSuggestions('input_variables', resolvedInputVariables);
    if (hasScopedVariables) {
      appendVariableSuggestions('project_variables', resolvedProjectVariables);
    }

    return items;
  }, [hasScopedVariables, resolvedInputVariables, resolvedProjectVariables]);

  const completionProviders = useMemo<
    Array<CodeEditorCompletionProvider<void>>
  >(
    () => [
      {
        id: 'dvt-python-runtime',
        priority: 10,
        triggerCharacters: ['.', '[', '"', "'", '_'],
        getSections: ({ model, position, wordRange }) => {
          const lineText = model.getLineContent(position.lineNumber);
          const textBeforeCursor = lineText.slice(0, position.column - 1);
          const namespaceContext = getVariableNamespaceCompletionContext(
            textBeforeCursor,
            textBeforeCursor.length
          );

          if (namespaceContext) {
            const scopedVariables =
              namespaceContext.namespace === 'input_variables'
                ? resolvedInputVariables
                : hasScopedVariables
                  ? resolvedProjectVariables
                  : EMPTY_VARIABLES;
            const namespaceRange = {
              startLineNumber: position.lineNumber,
              startColumn: namespaceContext.replaceStart + 1,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            };

            return [
              {
                id: `${namespaceContext.namespace}-names`,
                priority: 0,
                items: scopedVariables.map(variable => ({
                  label: variable.name,
                  insertText: variable.name,
                  kind: 'variable',
                  detail: `${namespaceContext.namespace} / ${variable.type}`,
                  range: namespaceRange,
                  keywords: [variable.name, variable.scope, variable.type],
                })),
              },
            ];
          }

          return [
            {
              id: 'runtime-variables',
              priority: 0,
              items: suggestions.map(item => ({
                label: item.label,
                insertText: item.insertText,
                detail: item.detail,
                documentation:
                  item.label === 'input_variables'
                    ? 'Read-only variables received from upstream nodes.'
                    : item.label === 'project_variables'
                      ? 'Variables configured for the current project.'
                      : undefined,
                kind: 'variable',
                range: wordRange,
              })),
            },
          ];
        },
      },
      ...externalCompletionProviders,
    ],
    [
      externalCompletionProviders,
      hasScopedVariables,
      resolvedInputVariables,
      resolvedProjectVariables,
      suggestions,
    ]
  );

  return (
    <CodeEditor
      value={editorValue}
      onChange={onChange}
      language='python'
      height={height}
      helperText={helperText}
      completionProviders={completionProviders}
      onMount={onMount}
    />
  );
};
