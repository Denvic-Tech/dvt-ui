import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import AbcIcon from '@mui/icons-material/Abc';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Tooltip,
  Typography,
} from '@mui/material';
import * as monacoTypes from 'monaco-editor';

import {
  getSingleVariableNameFromValue,
  isExpressionValue,
  makeExpressionValue,
  makeVariableExpressionValue,
} from '@/shared/lib/node-input-values';
import type { VariableOutput, VariableType } from '@/shared/lib/variables';
import { VariableOption } from '@/shared/ui/variable-option';

import {
  buildExpressionAutocompleteCatalog,
  getInlineExpressionDiagnostics,
  resolveInlineAutocomplete,
} from './HighlightedSingleLineField.shared';
import { normalizeMonacoTextValue } from './monacoTextValue';
import { hasTemplateExpressionTrigger } from './TemplateMonacoInput.helpers';
import { useExpressionsConfigContext } from './useExpressionsConfigContext';
import {
  buildScopeSectionHeader,
  groupVariablesByScope,
} from './variableSections';

type JSONNodeInputProps = {
  value: unknown;
  onChange: (value: unknown) => void;
  onValidationErrorChange?: ((nextError: string | null) => void) | undefined;
  hint?: string | undefined;
  title?: string | undefined;
  height?: number | undefined;
  errorText?: string | null | undefined;
  variables?: VariableOutput[] | undefined;
  inputVariables?: VariableOutput[] | undefined;
  projectVariables?: VariableOutput[] | undefined;
  allowVariableBinding?: boolean | undefined;
};

type TemplateExpressionRange = {
  expression: string;
  expressionEnd: number;
  expressionStart: number;
  fullEnd: number;
  fullStart: number;
};

type EditorSelectionOffsets = {
  end: number;
  start: number;
};

type EditorDiagnostic = {
  end: number;
  message: string;
  severity: 'error' | 'warning';
  start: number;
};

const JSON_VARIABLE_TYPES: VariableType[] = ['DICT', 'JSON'];
const TEMPLATE_MARKER_OWNER = 'dvt-json-template-expressions';
const JSON_FORMAT_ERROR_TEXT = 'Некорректный JSON формат.';

const serializeValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (isExpressionValue(value) && value.expression_kind === 'template') {
    return value.value;
  }

  return normalizeMonacoTextValue(value);
};

const getJsonSemanticFingerprint = (value: unknown): string | null => {
  if (value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value));
    } catch {
      return null;
    }
  }

  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
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

const sanitizeTemplateJsonForParse = (value: string): string => {
  if (!value.includes('{{')) {
    return value;
  }

  let cursor = 0;
  let result = '';
  let inString = false;
  let isEscaped = false;

  while (cursor < value.length) {
    const char = value[cursor];

    if (inString) {
      result += char;
      if (isEscaped) {
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
      } else if (char === '"') {
        inString = false;
      }
      cursor += 1;
      continue;
    }

    if (char === '"') {
      inString = true;
      result += char;
      cursor += 1;
      continue;
    }

    if (char === '{' && value[cursor + 1] === '{') {
      const closeIndex = value.indexOf('}}', cursor + 2);
      if (closeIndex < 0) {
        result += value.slice(cursor);
        break;
      }

      const templateLength = closeIndex + 2 - cursor;
      result += `0${' '.repeat(Math.max(0, templateLength - 1))}`;
      cursor = closeIndex + 2;
      continue;
    }

    result += char;
    cursor += 1;
  }

  return result;
};

const extractJsonParseErrorOffset = (error: unknown): number | null => {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/position\s+(\d+)/i);
  if (!match) {
    return null;
  }

  const offset = Number(match[1]);
  return Number.isFinite(offset) ? offset : null;
};

const getTemplateJsonStructuralDiagnostic = (
  value: string
): EditorDiagnostic | null => {
  if (!value.trim()) {
    return null;
  }

  try {
    JSON.parse(sanitizeTemplateJsonForParse(value));
    return null;
  } catch (error) {
    const start = Math.max(0, extractJsonParseErrorOffset(error) ?? 0);
    return {
      message: JSON_FORMAT_ERROR_TEXT,
      severity: 'error',
      start,
      end: start + 1,
    };
  }
};

export const JSONNodeInput: React.FC<JSONNodeInputProps> = ({
  value,
  onChange,
  onValidationErrorChange,
  hint,
  title = 'JSON',
  height = 260,
  errorText,
  variables = [],
  inputVariables,
  projectVariables,
  allowVariableBinding = true,
}) => {
  const { expressionsConfig } = useExpressionsConfigContext();
  const selectedVariableBinding = useMemo(
    () => getSingleVariableNameFromValue(value),
    [value]
  );
  const serializedValue = useMemo(
    () => (selectedVariableBinding ? '' : serializeValue(value)),
    [selectedVariableBinding, value]
  );
  const [editorValue, setEditorValue] = useState(serializedValue);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [variablePopoverAnchorEl, setVariablePopoverAnchorEl] =
    useState<HTMLElement | null>(null);
  const lastConstantValueRef = useRef(serializedValue);
  const lastLocalSemanticFingerprintRef = useRef<string | null>(
    getJsonSemanticFingerprint(value)
  );
  const lastHydratedExternalSemanticFingerprintRef = useRef<string | null>(
    getJsonSemanticFingerprint(value)
  );
  const completionDisposeRef = useRef<monacoTypes.IDisposable[]>([]);
  const editorDisposeRef = useRef<monacoTypes.IDisposable[]>([]);
  const editorRef = useRef<monacoTypes.editor.IStandaloneCodeEditor | null>(
    null
  );
  const lastSelectionOffsetsRef = useRef<EditorSelectionOffsets | null>(null);
  const monacoRef = useRef<typeof monacoTypes | null>(null);
  const lastReportedValidationErrorRef = useRef<string | null>(null);
  const templateModeRef = useRef(false);

  const compatibleVariables = useMemo(
    () =>
      variables.filter(variable => JSON_VARIABLE_TYPES.includes(variable.type)),
    [variables]
  );

  const isTemplateMode = useMemo(
    () =>
      allowVariableBinding &&
      !selectedVariableBinding &&
      hasTemplateExpressionTrigger(editorValue),
    [allowVariableBinding, editorValue, selectedVariableBinding]
  );

  useEffect(() => {
    templateModeRef.current = isTemplateMode;
  }, [isTemplateMode]);

  const pickerVariables = useMemo(() => {
    if (!allowVariableBinding) {
      return [];
    }

    return variables;
  }, [allowVariableBinding, variables]);

  const variableBindingSupported = useMemo(
    () => allowVariableBinding && pickerVariables.length > 0,
    [allowVariableBinding, pickerVariables.length]
  );

  const selectedVariable = useMemo(() => {
    if (!selectedVariableBinding) {
      return null;
    }

    return (
      compatibleVariables.find(
        variable => variable.name === selectedVariableBinding
      ) ??
      variables.find(variable => variable.name === selectedVariableBinding) ??
      null
    );
  }, [compatibleVariables, selectedVariableBinding, variables]);

  useEffect(() => {
    if (selectedVariableBinding) {
      return;
    }

    const externalSemanticFingerprint = getJsonSemanticFingerprint(value);
    if (
      externalSemanticFingerprint ===
      lastHydratedExternalSemanticFingerprintRef.current
    ) {
      return;
    }

    if (
      externalSemanticFingerprint !== null &&
      externalSemanticFingerprint === lastLocalSemanticFingerprintRef.current
    ) {
      lastHydratedExternalSemanticFingerprintRef.current =
        externalSemanticFingerprint;
      lastConstantValueRef.current = serializedValue;
      return;
    }

    setEditorValue(serializedValue);
    lastConstantValueRef.current = serializedValue;
    lastLocalSemanticFingerprintRef.current = externalSemanticFingerprint;
    lastHydratedExternalSemanticFingerprintRef.current =
      externalSemanticFingerprint;
  }, [serializedValue, selectedVariableBinding, value]);

  const expressionAutocompleteCatalog = useMemo(
    () =>
      buildExpressionAutocompleteCatalog({
        variables,
        inputVariables,
        projectVariables,
        inputType: 'JSON',
        expressionsConfig,
      }),
    [expressionsConfig, inputVariables, projectVariables, variables]
  );

  const templateDiagnostics = useMemo(() => {
    if (!isTemplateMode) {
      return [];
    }

    return extractTemplateExpressionRanges(editorValue).flatMap(range =>
      getInlineExpressionDiagnostics(range.expression, {
        variables,
        inputVariables,
        projectVariables,
        inputType: 'JSON',
        expressionsConfig,
      }).map(diagnostic => ({
        ...diagnostic,
        start: range.expressionStart + diagnostic.start,
        end: range.expressionStart + diagnostic.end,
      }))
    );
  }, [
    editorValue,
    expressionsConfig,
    inputVariables,
    isTemplateMode,
    projectVariables,
    variables,
  ]);

  const templateJsonStructuralDiagnostic = useMemo(
    () =>
      isTemplateMode ? getTemplateJsonStructuralDiagnostic(editorValue) : null,
    [editorValue, isTemplateMode]
  );

  const templateEditorDiagnostics = useMemo<EditorDiagnostic[]>(
    () => [
      ...templateDiagnostics,
      ...(templateJsonStructuralDiagnostic
        ? [templateJsonStructuralDiagnostic]
        : []),
    ],
    [templateDiagnostics, templateJsonStructuralDiagnostic]
  );
  const primaryTemplateDiagnostic = useMemo(
    () =>
      templateEditorDiagnostics.find(
        diagnostic => diagnostic.severity === 'error'
      ) ??
      templateEditorDiagnostics[0] ??
      null,
    [templateEditorDiagnostics]
  );

  const closeVariablePicker = useCallback(() => {
    setVariablePopoverAnchorEl(null);
  }, []);

  const openVariablePicker = useCallback((anchor: HTMLElement) => {
    setVariablePopoverAnchorEl(anchor);
  }, []);

  const commitTemplateDraft = useCallback(
    (nextTemplateValue: string) => {
      const nextExpressionValue = makeExpressionValue(
        nextTemplateValue,
        'template'
      );

      setEditorValue(nextTemplateValue);
      setFormatError(null);
      lastConstantValueRef.current = nextTemplateValue;
      lastLocalSemanticFingerprintRef.current =
        getJsonSemanticFingerprint(nextExpressionValue);
      onChange(nextExpressionValue);
    },
    [onChange]
  );

  const updateSelectionOffsets = useCallback(() => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    const selection = editor?.getSelection();
    if (!editor || !model || !selection) {
      lastSelectionOffsetsRef.current = null;
      return;
    }

    lastSelectionOffsetsRef.current = {
      start: model.getOffsetAt({
        lineNumber: selection.startLineNumber,
        column: selection.startColumn,
      }),
      end: model.getOffsetAt({
        lineNumber: selection.endLineNumber,
        column: selection.endColumn,
      }),
    };
  }, []);

  const insertTemplateVariableAtSelection = useCallback(
    (variableName: string) => {
      const editor = editorRef.current;
      const model = editor?.getModel();
      const insertion = `{{${variableName}}}`;
      const currentSelection = lastSelectionOffsetsRef.current;
      const start = currentSelection?.start ?? editorValue.length;
      const end = currentSelection?.end ?? editorValue.length;
      const nextValue =
        editorValue.slice(0, start) + insertion + editorValue.slice(end);

      commitTemplateDraft(nextValue);
      closeVariablePicker();

      if (!editor || !model) {
        return;
      }

      queueMicrotask(() => {
        const nextPosition = model.getPositionAt(start + insertion.length);
        editor.focus();
        editor.setPosition(nextPosition);
        updateSelectionOffsets();
      });
    },
    [
      closeVariablePicker,
      commitTemplateDraft,
      editorValue,
      updateSelectionOffsets,
    ]
  );

  const handleVariableSelection = useCallback(
    (variable: VariableOutput) => {
      if (selectedVariableBinding) {
        onChange(makeVariableExpressionValue(variable.name));
        closeVariablePicker();
        return;
      }

      insertTemplateVariableAtSelection(variable.name);
    },
    [
      closeVariablePicker,
      insertTemplateVariableAtSelection,
      onChange,
      selectedVariableBinding,
    ]
  );

  const handleResetToConstant = useCallback(() => {
    onChange(lastConstantValueRef.current || '{}');
    closeVariablePicker();
  }, [closeVariablePicker, onChange]);

  const handleEditorChange = useCallback(
    (nextValue?: string) => {
      const valueToSet = nextValue ?? '';

      if (allowVariableBinding && hasTemplateExpressionTrigger(valueToSet)) {
        commitTemplateDraft(valueToSet);
        return;
      }

      setEditorValue(valueToSet);
      setFormatError(null);
      lastConstantValueRef.current = valueToSet;
      lastLocalSemanticFingerprintRef.current =
        getJsonSemanticFingerprint(valueToSet);
      onChange(valueToSet);
    },
    [allowVariableBinding, commitTemplateDraft, onChange]
  );

  const handleFormat = useCallback(() => {
    if (isTemplateMode) {
      return;
    }

    try {
      const parsed = JSON.parse(editorValue || '{}');
      const formatted = JSON.stringify(parsed, null, 2);
      setEditorValue(formatted);
      setFormatError(null);
      lastConstantValueRef.current = formatted;
      lastLocalSemanticFingerprintRef.current =
        getJsonSemanticFingerprint(formatted);
      onChange(formatted);
    } catch {
      setFormatError('Не удалось форматировать: невалидный JSON.');
    }
  }, [editorValue, isTemplateMode, onChange]);

  const shownError =
    errorText ?? primaryTemplateDiagnostic?.message ?? formatError;
  const variablePickerOpen = Boolean(variablePopoverAnchorEl);
  const resolvedHint = isTemplateMode
    ? 'Template mode. Используйте {{variable_name}} внутри JSON payload.'
    : hint;
  const editorLanguage = isTemplateMode ? 'plaintext' : 'json';
  const localValidationError =
    primaryTemplateDiagnostic?.severity === 'error'
      ? primaryTemplateDiagnostic.message
      : null;

  useEffect(() => {
    if (!onValidationErrorChange) {
      return;
    }

    if (lastReportedValidationErrorRef.current === localValidationError) {
      return;
    }

    lastReportedValidationErrorRef.current = localValidationError;
    onValidationErrorChange(localValidationError);
  }, [localValidationError, onValidationErrorChange]);

  const syncTemplateMarkers = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();
    if (!editor || !monaco || !model) {
      return;
    }

    monaco.editor.setModelMarkers(
      model,
      TEMPLATE_MARKER_OWNER,
      templateEditorDiagnostics.map(diagnostic => {
        const modelLength = model.getValueLength();
        const safeStartOffset = Math.min(diagnostic.start, modelLength);
        const safeEndOffset = Math.min(
          Math.max(safeStartOffset, diagnostic.end),
          modelLength
        );
        const startPosition = model.getPositionAt(safeStartOffset);
        const endPosition = model.getPositionAt(safeEndOffset);

        return {
          startLineNumber: startPosition.lineNumber,
          startColumn: startPosition.column,
          endLineNumber: endPosition.lineNumber,
          endColumn: endPosition.column,
          message: diagnostic.message,
          severity:
            diagnostic.severity === 'warning'
              ? monaco.MarkerSeverity.Warning
              : monaco.MarkerSeverity.Error,
        };
      })
    );
  }, [templateEditorDiagnostics]);

  const registerTemplateCompletions = useCallback(
    (monaco: typeof monacoTypes) => {
      completionDisposeRef.current.forEach(disposable => disposable.dispose());

      completionDisposeRef.current = ['json', 'plaintext'].map(language =>
        monaco.languages.registerCompletionItemProvider(language, {
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
          provideCompletionItems: (model, position) => {
            if (!templateModeRef.current) {
              return { suggestions: [] };
            }

            const currentValue = model.getValue();
            const cursorOffset = getOffsetAt(model, position);
            const activeTemplateRange = getActiveTemplateRange(
              currentValue,
              cursorOffset
            );

            if (!activeTemplateRange) {
              return { suggestions: [] };
            }

            const innerCursorOffset =
              cursorOffset - activeTemplateRange.expressionStart;
            const decision = resolveInlineAutocomplete(
              activeTemplateRange.expression,
              innerCursorOffset,
              expressionAutocompleteCatalog
            );

            return {
              suggestions: decision.items.map(item => {
                const startPosition = model.getPositionAt(
                  activeTemplateRange.expressionStart + decision.replaceStart
                );
                const endPosition = model.getPositionAt(
                  activeTemplateRange.expressionStart + decision.replaceEnd
                );

                return {
                  label: item.label,
                  kind:
                    item.kind === 'variable'
                      ? monaco.languages.CompletionItemKind.Variable
                      : item.kind === 'global'
                        ? monaco.languages.CompletionItemKind.Function
                        : item.kind === 'filter' || item.kind === 'test'
                          ? monaco.languages.CompletionItemKind.Keyword
                          : item.kind === 'operator'
                            ? monaco.languages.CompletionItemKind.Operator
                            : monaco.languages.CompletionItemKind.Value,
                  insertText: item.insertText,
                  ...(item.detail ? { detail: item.detail } : {}),
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
            };
          },
        })
      );
    },
    [expressionAutocompleteCatalog]
  );

  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, editorLanguage);
      }
      registerTemplateCompletions(monaco);
      editorDisposeRef.current.push(
        editor.onDidChangeCursorSelection(() => {
          updateSelectionOffsets();
        })
      );
      syncTemplateMarkers();
      updateSelectionOffsets();

      editorDisposeRef.current.push(
        editor.onKeyDown(event => {
          if (event.keyCode !== monaco.KeyCode.Enter) {
            return;
          }

          if (event.ctrlKey || event.metaKey || event.altKey) {
            return;
          }

          if (templateModeRef.current) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          editor.trigger('keyboard', 'type', { text: '\n' });
        })
      );
    },
    [
      editorLanguage,
      registerTemplateCompletions,
      syncTemplateMarkers,
      updateSelectionOffsets,
    ]
  );

  useEffect(() => {
    syncTemplateMarkers();
  }, [syncTemplateMarkers]);

  useEffect(() => {
    if (monacoRef.current) {
      registerTemplateCompletions(monacoRef.current);
    }
  }, [registerTemplateCompletions]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();
    if (!editor || !monaco || !model) {
      return;
    }

    monaco.editor.setModelLanguage(model, editorLanguage);
  }, [editorLanguage]);

  useEffect(() => {
    const completionDisposables = completionDisposeRef.current;
    const editorDisposables = editorDisposeRef.current;

    return () => {
      completionDisposables.forEach(disposable => disposable.dispose());
      editorDisposables.forEach(disposable => disposable.dispose());
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Typography variant='caption' color='text.secondary'>
          {title}
        </Typography>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
          {variableBindingSupported && (
            <Tooltip
              title={
                isTemplateMode
                  ? 'Вставить переменную как {{ variable_name }}'
                  : 'Выбрать переменную'
              }
            >
              <IconButton
                size='small'
                aria-label='Выбрать переменную'
                onClick={event => openVariablePicker(event.currentTarget)}
              >
                <AbcIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          )}
          {!selectedVariableBinding && !isTemplateMode && (
            <Button
              size='small'
              variant='outlined'
              startIcon={<AutoFixHighRoundedIcon fontSize='small' />}
              onClick={handleFormat}
            >
              Форматировать
            </Button>
          )}
        </Box>
      </Box>

      {selectedVariableBinding ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size='small'
            variant='outlined'
            onClick={event => openVariablePicker(event.currentTarget)}
          >
            {selectedVariable
              ? `${selectedVariable.name} (${selectedVariable.type}${
                  selectedVariable.isListType ? '[]' : ''
                })`
              : selectedVariableBinding}
          </Button>
          <Button size='small' variant='text' onClick={handleResetToConstant}>
            Константа
          </Button>
        </Box>
      ) : (
        <Box
          className='nokey nopan'
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden',
            backgroundColor: 'background.paper',
          }}
        >
          <MonacoEditor
            height={height}
            defaultLanguage={editorLanguage}
            value={editorValue}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              wordWrap: 'on',
              fontSize: 13,
              automaticLayout: true,
              acceptSuggestionOnCommitCharacter: false,
              acceptSuggestionOnEnter: isTemplateMode ? 'on' : 'off',
              quickSuggestions: isTemplateMode
                ? { other: true, comments: false, strings: true }
                : false,
              suggestOnTriggerCharacters: isTemplateMode,
              tabCompletion: isTemplateMode ? 'on' : 'off',
              scrollBeyondLastLine: false,
              renderWhitespace: 'none',
              renderValidationDecorations: 'on',
              lineNumbers: 'off',
            }}
            theme='vs'
          />
        </Box>
      )}

      <Popover
        open={variablePickerOpen}
        anchorEl={variablePopoverAnchorEl}
        onClose={closeVariablePicker}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              width: 320,
              p: 1,
              borderRadius: 2,
            },
          },
        }}
      >
        <List dense sx={{ maxHeight: 280, overflowY: 'auto', p: 0 }}>
          {pickerVariables.length > 0 ? (
            groupVariablesByScope(pickerVariables).map(section => (
              <Box key={section.key}>
                {buildScopeSectionHeader(section.label)}
                {section.items.map(variable => (
                  <ListItemButton
                    key={`${section.key}:${variable.name}:${variable.type}`}
                    selected={selectedVariableBinding === variable.name}
                    onClick={() => handleVariableSelection(variable)}
                  >
                    <VariableOption variable={variable} />
                  </ListItemButton>
                ))}
              </Box>
            ))
          ) : (
            <ListItemText
              sx={{ px: 1.5, py: 1.25 }}
              secondary='Нет доступных переменных'
            />
          )}
        </List>
      </Popover>

      {resolvedHint && (
        <Typography variant='caption' color='text.disabled'>
          {resolvedHint}
        </Typography>
      )}

      {shownError && (
        <Typography variant='caption' color='error'>
          {shownError}
        </Typography>
      )}
    </Box>
  );
};
