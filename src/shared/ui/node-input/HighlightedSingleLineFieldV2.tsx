import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import {
  Box,
  FormControl,
  FormHelperText,
  GlobalStyles,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type * as monacoTypes from 'monaco-editor';

import {
  INLINE_VALUE_TYPE_COLORS,
  tokenizeInlineExpression,
  type VariableOutput,
} from '@/shared/lib/variables';
import { getControlHeight } from '@/shared/ui/primitives/components/theme-style-helpers';

import {
  buildInlineAutocompleteCatalog,
  CODE_FONT_FAMILY,
  formatSingleLineExpression,
  type HighlightedAutocompleteItem,
  type InlineAutocompleteCatalog,
  type InlineExpressionDiagnostic,
  resolveInlineAutocomplete,
  sanitizeSingleLineValue,
} from './HighlightedSingleLineField.shared';
import { normalizeMonacoTextValue } from './monacoTextValue';

type MonacoEditorInstance = Parameters<OnMount>[0];
type MonacoInstance = Parameters<OnMount>[1];

type HighlightedSingleLineFieldV2Props = {
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string | undefined;
  helperText?: React.ReactNode | undefined;
  startActions?: React.ReactNode | undefined;
  endActions?: React.ReactNode | undefined;
  actions?: React.ReactNode | undefined;
  variables?: VariableOutput[] | undefined;
  autocompleteItems?: HighlightedAutocompleteItem[] | undefined;
  autocompleteCatalog?: InlineAutocompleteCatalog | undefined;
  highlightingEnabled?: boolean | undefined;
  autoFormatOnBlur?: boolean | undefined;
  diagnostics?: InlineExpressionDiagnostic[] | undefined;
  errorText?: React.ReactNode | undefined;
  warningText?: React.ReactNode | undefined;
  borderRadius?: number | string | undefined;
};

const COLOR_CLASS_BY_TOKEN_KIND = {
  boolean: 'dvt-inline-boolean',
  number: 'dvt-inline-number',
  operator: 'dvt-inline-operator',
  string: 'dvt-inline-string',
  variable_boolean: 'dvt-inline-boolean',
  variable_numeric: 'dvt-inline-number',
  variable_string: 'dvt-inline-string',
  variable_operator: 'dvt-inline-operator',
  variable_unknown: 'dvt-inline-unknown',
} as const;

const getTokenDecorationClassName = (
  token: ReturnType<typeof tokenizeInlineExpression>[number]
) => {
  if (token.kind === 'variable' && token.semanticType) {
    return COLOR_CLASS_BY_TOKEN_KIND[
      `variable_${token.semanticType}` as keyof typeof COLOR_CLASS_BY_TOKEN_KIND
    ];
  }

  return COLOR_CLASS_BY_TOKEN_KIND[
    token.kind as keyof typeof COLOR_CLASS_BY_TOKEN_KIND
  ];
};

const offsetToColumn = (offset: number) => offset + 1;

const getCursorOffset = (editor: MonacoEditorInstance | null) => {
  const position = editor?.getPosition();
  return position ? Math.max(0, position.column - 1) : 0;
};

const applyEditorValue = (
  editor: MonacoEditorInstance | null,
  nextValue: string
) => {
  const model = editor?.getModel();
  if (!editor || !model) {
    return;
  }

  const cursorOffset = Math.min(getCursorOffset(editor), nextValue.length);
  model.setValue(nextValue);
  editor.setPosition({ lineNumber: 1, column: offsetToColumn(cursorOffset) });
};

const getSuggestController = (editor: MonacoEditorInstance) =>
  typeof editor.getContribution === 'function'
    ? (editor.getContribution('editor.contrib.suggestController') as {
        cancelSuggestWidget?: () => void;
        triggerSuggest?: () => void;
      } | null)
    : null;

const hideSuggestWidget = (editor: MonacoEditorInstance) => {
  const controller = getSuggestController(editor);
  if (controller?.cancelSuggestWidget) {
    controller.cancelSuggestWidget();
    return;
  }

  editor.trigger?.('keyboard', 'hideSuggestWidget', {});
};

const triggerSuggestWidget = (editor: MonacoEditorInstance) => {
  const controller = getSuggestController(editor);
  if (controller?.triggerSuggest) {
    controller.triggerSuggest();
    return;
  }

  editor.trigger?.('keyboard', 'editor.action.triggerSuggest', {});
};

const getCompletionItemKind = (
  monaco: MonacoInstance,
  item: HighlightedAutocompleteItem
) => {
  if (item.kind === 'variable') {
    return monaco.languages.CompletionItemKind.Variable;
  }

  if (item.kind === 'global') {
    return monaco.languages.CompletionItemKind.Function;
  }

  if (item.kind === 'filter' || item.kind === 'test') {
    return monaco.languages.CompletionItemKind.Keyword;
  }

  if (item.kind === 'operator') {
    return monaco.languages.CompletionItemKind.Operator;
  }

  return monaco.languages.CompletionItemKind.Value;
};

const buildGlobalDecorationRanges = (
  value: string,
  catalog: InlineAutocompleteCatalog
) => {
  const globals = catalog.itemsByKind.global;
  if (globals.length === 0) {
    return [];
  }

  const ranges: Array<{ start: number; end: number }> = [];

  for (const global of globals) {
    const escapedLabel = global.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const globalRe = new RegExp(`\\b${escapedLabel}\\b`, 'g');
    let match: RegExpExecArray | null = null;

    while ((match = globalRe.exec(value)) != null) {
      ranges.push({
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  return ranges;
};

export const HighlightedSingleLineFieldV2 = forwardRef<
  HTMLDivElement,
  HighlightedSingleLineFieldV2Props
>(function HighlightedSingleLineFieldV2(
  {
    value,
    onChange,
    placeholder,
    helperText,
    startActions,
    endActions,
    actions,
    variables = [],
    autocompleteItems = [],
    autocompleteCatalog,
    highlightingEnabled = true,
    autoFormatOnBlur = true,
    diagnostics = [],
    errorText,
    warningText,
    borderRadius = '15px',
  },
  forwardedRef
) {
  const editorRef = useRef<MonacoEditorInstance | null>(null);
  const monacoRef = useRef<MonacoInstance | null>(null);
  const decorationIdsRef = useRef<string[]>([]);
  const completionDisposeRef = useRef<monacoTypes.IDisposable | null>(null);
  const hoverDisposeRef = useRef<monacoTypes.IDisposable | null>(null);
  const focusDisposeRef = useRef<monacoTypes.IDisposable | null>(null);
  const blurDisposeRef = useRef<monacoTypes.IDisposable | null>(null);
  const contentChangeDisposeRef = useRef<monacoTypes.IDisposable | null>(null);
  const keyUpDisposeRef = useRef<monacoTypes.IDisposable | null>(null);
  const cursorChangeDisposeRef = useRef<monacoTypes.IDisposable | null>(null);
  const startAdornmentRef = useRef<HTMLDivElement | null>(null);
  const endAdornmentRef = useRef<HTMLDivElement | null>(null);
  const blurFormattingRef = useRef<() => void>(() => undefined);
  const suggestTimeoutsRef = useRef<number[]>([]);
  const languageId = `dvt-inline-expression-${useId().replace(/:/g, '-')}`;
  const markerOwner = `${languageId}-markers`;
  const [isFocused, setIsFocused] = useState(false);
  const [startActionsWidth, setStartActionsWidth] = useState(0);
  const [endActionsWidth, setEndActionsWidth] = useState(0);
  const resolvedEndActions = endActions ?? actions;
  const resolvedAutocompleteCatalog = React.useMemo(
    () =>
      autocompleteCatalog ?? buildInlineAutocompleteCatalog(autocompleteItems),
    [autocompleteCatalog, autocompleteItems]
  );
  const normalizedValue = sanitizeSingleLineValue(
    normalizeMonacoTextValue(value)
  );
  const resolvedHelperText = errorText ?? warningText ?? helperText;
  const hasError =
    Boolean(errorText) ||
    diagnostics.some(diagnostic => diagnostic.severity === 'error');

  const clearScheduledSuggestTriggers = useCallback(() => {
    for (const timeoutId of suggestTimeoutsRef.current) {
      window.clearTimeout(timeoutId);
    }
    suggestTimeoutsRef.current = [];
  }, []);

  const syncDecorations = useCallback(
    (nextValue?: string) => {
      const editor = editorRef.current;
      const model = editor?.getModel();
      if (!editor || !model) {
        return;
      }

      const resolvedValue = sanitizeSingleLineValue(
        nextValue ?? model.getValue()
      );

      if (!highlightingEnabled || !resolvedValue) {
        decorationIdsRef.current = editor.deltaDecorations(
          decorationIdsRef.current,
          []
        );
        return;
      }

      const baseDecorations = tokenizeInlineExpression(resolvedValue, variables)
        .map(token => {
          const inlineClassName = getTokenDecorationClassName(token);
          if (!inlineClassName) {
            return null;
          }

          return {
            range: {
              startLineNumber: 1,
              startColumn: token.start + 1,
              endLineNumber: 1,
              endColumn: token.end + 1,
            },
            options: {
              inlineClassName,
            },
          };
        })
        .filter(Boolean) as monacoTypes.editor.IModelDeltaDecoration[];

      const occupiedRanges = new Set(
        baseDecorations.map(
          decoration =>
            `${decoration.range.startColumn}:${decoration.range.endColumn}`
        )
      );
      const globalDecorations = buildGlobalDecorationRanges(
        resolvedValue,
        resolvedAutocompleteCatalog
      )
        .filter(
          range => !occupiedRanges.has(`${range.start + 1}:${range.end + 1}`)
        )
        .map(range => ({
          range: {
            startLineNumber: 1,
            startColumn: range.start + 1,
            endLineNumber: 1,
            endColumn: range.end + 1,
          },
          options: {
            inlineClassName: 'dvt-inline-global',
          },
        }));

      decorationIdsRef.current = editor.deltaDecorations(
        decorationIdsRef.current,
        [...baseDecorations, ...globalDecorations]
      );
    },
    [highlightingEnabled, resolvedAutocompleteCatalog, variables]
  );

  const handleEditorChange = useCallback(
    (nextValue?: string) => {
      const resolvedValue = sanitizeSingleLineValue(nextValue ?? '');
      if (resolvedValue !== normalizedValue) {
        onChange(resolvedValue);
      }
    },
    [normalizedValue, onChange]
  );

  const handleBlurFormatting = useCallback(() => {
    setIsFocused(false);
    clearScheduledSuggestTriggers();
    const currentValue =
      editorRef.current?.getModel()?.getValue() ?? normalizedValue;

    if (!autoFormatOnBlur || !highlightingEnabled) {
      syncDecorations();
      return;
    }

    const formattedValue = formatSingleLineExpression(currentValue, variables);
    if (formattedValue !== currentValue) {
      applyEditorValue(editorRef.current, formattedValue);
      syncDecorations(formattedValue);
      onChange(formattedValue);
      return;
    }

    syncDecorations();
  }, [
    autoFormatOnBlur,
    highlightingEnabled,
    normalizedValue,
    onChange,
    syncDecorations,
    variables,
    clearScheduledSuggestTriggers,
  ]);

  const syncMarkers = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();
    if (!editor || !monaco || !model) {
      return;
    }

    monaco.editor.setModelMarkers(
      model,
      markerOwner,
      diagnostics.map(diagnostic => ({
        startLineNumber: 1,
        startColumn: diagnostic.start + 1,
        endLineNumber: 1,
        endColumn: Math.max(diagnostic.start + 2, diagnostic.end + 1),
        message: diagnostic.message,
        severity:
          diagnostic.severity === 'warning'
            ? monaco.MarkerSeverity.Warning
            : monaco.MarkerSeverity.Error,
      }))
    );
  }, [diagnostics, markerOwner]);

  useEffect(() => {
    blurFormattingRef.current = handleBlurFormatting;
  }, [handleBlurFormatting]);

  const scheduleSuggestTrigger = useCallback(
    (editor: MonacoEditorInstance, retryForEmptyQuery = false) => {
      const trigger = () => {
        const model = editor.getModel();
        if (!model || !(editor.hasTextFocus?.() ?? true)) {
          return;
        }

        const autocompleteDecision = resolveInlineAutocomplete(
          model.getValue(),
          getCursorOffset(editor),
          resolvedAutocompleteCatalog
        );
        if (!autocompleteDecision.items.length) {
          return;
        }

        triggerSuggestWidget(editor);
      };

      suggestTimeoutsRef.current.push(window.setTimeout(trigger, 40));
      if (retryForEmptyQuery) {
        suggestTimeoutsRef.current.push(window.setTimeout(trigger, 180));
      }
    },
    [resolvedAutocompleteCatalog]
  );

  const syncAutocompleteWidget = useCallback(
    (editor: MonacoEditorInstance) => {
      const model = editor.getModel();
      if (!model || !highlightingEnabled) {
        return;
      }

      const autocompleteDecision = resolveInlineAutocomplete(
        model.getValue(),
        getCursorOffset(editor),
        resolvedAutocompleteCatalog
      );

      if (!autocompleteDecision.items.length) {
        hideSuggestWidget(editor);
        return;
      }

      scheduleSuggestTrigger(editor, autocompleteDecision.query.length === 0);
    },
    [highlightingEnabled, resolvedAutocompleteCatalog, scheduleSuggestTrigger]
  );

  const registerLanguageProviders = useCallback(
    (monaco: typeof monacoTypes) => {
      if (!highlightingEnabled) {
        return;
      }

      if (
        !monaco.languages.getLanguages().some(item => item.id === languageId)
      ) {
        monaco.languages.register({ id: languageId });
      }

      completionDisposeRef.current?.dispose();
      hoverDisposeRef.current?.dispose();

      completionDisposeRef.current =
        monaco.languages.registerCompletionItemProvider(languageId, {
          triggerCharacters: [
            '.',
            '"',
            "'",
            '[',
            '_',
            '|',
            '(',
            ',',
            '=',
            '!',
            '<',
            '>',
          ],
          provideCompletionItems: (model, position) => {
            const currentValue = model.getValue();
            const cursorOffset = Math.max(0, position.column - 1);
            const autocompleteDecision = resolveInlineAutocomplete(
              currentValue,
              cursorOffset,
              resolvedAutocompleteCatalog
            );

            return {
              suggestions: autocompleteDecision.items.map((item, index) => ({
                label: item.label,
                kind: getCompletionItemKind(monaco, item),
                insertText: item.insertText,
                ...(item.detail ? { detail: item.detail } : {}),
                filterText: [
                  item.label,
                  item.insertText,
                  ...(item.keywords ?? []),
                ].join(' '),
                sortText: `${String(index).padStart(3, '0')}:${item.kind}:${item.label}`,
                range: {
                  startLineNumber: 1,
                  endLineNumber: 1,
                  startColumn: autocompleteDecision.replaceStart + 1,
                  endColumn: autocompleteDecision.replaceEnd + 1,
                },
              })),
            };
          },
        });

      hoverDisposeRef.current = monaco.languages.registerHoverProvider(
        languageId,
        {
          provideHover: (model, position) => {
            const offset = Math.max(0, position.column - 1);
            const token = tokenizeInlineExpression(
              model.getValue(),
              variables
            ).find(entry => offset >= entry.start && offset < entry.end);

            if (!token || token.kind !== 'variable' || !token.variable) {
              return null;
            }

            return {
              range: {
                startLineNumber: 1,
                startColumn: token.start + 1,
                endLineNumber: 1,
                endColumn: token.end + 1,
              },
              contents: [
                {
                  value: `**${token.variable.name}**`,
                },
                {
                  value: `${token.variable.scope} / ${token.variable.type}${
                    token.variable.isListType ? '[]' : ''
                  }`,
                },
                ...(token.variable.sourceLabel
                  ? [{ value: token.variable.sourceLabel }]
                  : []),
              ],
            };
          },
        }
      );
    },
    [highlightingEnabled, languageId, resolvedAutocompleteCatalog, variables]
  );

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      registerLanguageProviders(monaco);

      focusDisposeRef.current?.dispose();
      blurDisposeRef.current?.dispose();
      contentChangeDisposeRef.current?.dispose();
      keyUpDisposeRef.current?.dispose();
      cursorChangeDisposeRef.current?.dispose();

      focusDisposeRef.current = editor.onDidFocusEditorText(() => {
        setIsFocused(true);
        clearScheduledSuggestTriggers();
        syncDecorations();
        syncMarkers();
        syncAutocompleteWidget(editor);
      });
      blurDisposeRef.current = editor.onDidBlurEditorText(() => {
        blurFormattingRef.current();
      });
      contentChangeDisposeRef.current = editor.onDidChangeModelContent?.(
        event => {
          const model = editor.getModel();
          if (!model) {
            return;
          }

          syncDecorations(model.getValue());
          syncMarkers();

          if (!highlightingEnabled) {
            return;
          }

          syncAutocompleteWidget(editor);
        }
      );
      cursorChangeDisposeRef.current = editor.onDidChangeCursorPosition?.(
        () => {
          syncAutocompleteWidget(editor);
        }
      );
      keyUpDisposeRef.current = editor.onKeyUp?.(event => {
        if (event.ctrlKey || event.altKey || event.metaKey) {
          return;
        }

        if (
          [
            monaco.KeyCode.Enter,
            monaco.KeyCode.Tab,
            monaco.KeyCode.Escape,
            monaco.KeyCode.UpArrow,
            monaco.KeyCode.DownArrow,
            monaco.KeyCode.LeftArrow,
            monaco.KeyCode.RightArrow,
          ].includes(event.keyCode)
        ) {
          return;
        }

        const model = editor.getModel();
        if (!model || !highlightingEnabled) {
          return;
        }

        syncAutocompleteWidget(editor);
      });

      editor.addCommand(monaco.KeyCode.Enter, () => undefined);
      editor.addCommand(
        monaco.KeyMod.Shift | monaco.KeyCode.Enter,
        () => undefined
      );

      editor.onDidPaste(() => {
        const currentValue = editor.getValue();
        const sanitizedValue = sanitizeSingleLineValue(currentValue);
        if (sanitizedValue !== currentValue) {
          applyEditorValue(editor, sanitizedValue);
          onChange(sanitizedValue);
        }
      });

      syncDecorations();
      syncMarkers();
    },
    [
      clearScheduledSuggestTriggers,
      highlightingEnabled,
      onChange,
      registerLanguageProviders,
      syncAutocompleteWidget,
      syncDecorations,
      syncMarkers,
    ]
  );

  useEffect(() => {
    syncDecorations();
    syncMarkers();
  }, [syncDecorations, syncMarkers]);

  useEffect(() => {
    if (!startAdornmentRef.current) {
      setStartActionsWidth(0);
      return;
    }

    const updateWidth = () => {
      setStartActionsWidth(
        startAdornmentRef.current?.getBoundingClientRect().width ?? 0
      );
    };

    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(startAdornmentRef.current);

    return () => observer.disconnect();
  }, [startActions]);

  useEffect(() => {
    if (!endAdornmentRef.current) {
      setEndActionsWidth(0);
      return;
    }

    const updateWidth = () => {
      setEndActionsWidth(
        endAdornmentRef.current?.getBoundingClientRect().width ?? 0
      );
    };

    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(endAdornmentRef.current);

    return () => observer.disconnect();
  }, [resolvedEndActions]);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    if (editorRef.current.getValue() !== normalizedValue) {
      applyEditorValue(editorRef.current, normalizedValue);
    }

    syncDecorations(normalizedValue);
    syncMarkers();
  }, [normalizedValue, syncDecorations, syncMarkers]);

  useEffect(() => {
    if (monacoRef.current) {
      registerLanguageProviders(monacoRef.current);
    }
  }, [registerLanguageProviders]);

  useEffect(() => {
    return () => {
      completionDisposeRef.current?.dispose();
      hoverDisposeRef.current?.dispose();
      focusDisposeRef.current?.dispose();
      blurDisposeRef.current?.dispose();
      contentChangeDisposeRef.current?.dispose();
      keyUpDisposeRef.current?.dispose();
      cursorChangeDisposeRef.current?.dispose();
      clearScheduledSuggestTriggers();
    };
  }, [clearScheduledSuggestTriggers]);

  return (
    <FormControl fullWidth size='small' error={hasError}>
      <GlobalStyles
        styles={{
          '.dvt-inline-monaco .monaco-editor, .dvt-inline-monaco .monaco-editor-background':
            {
              background: 'transparent',
            },
          '.dvt-inline-monaco .monaco-editor .margin': {
            width: '0 !important',
          },
          '.dvt-inline-monaco .monaco-editor .view-overlays, .dvt-inline-monaco .monaco-editor .current-line, .dvt-inline-monaco .monaco-editor .current-line-margin':
            {
              border: '0 !important',
            },
          '.dvt-inline-monaco .monaco-scrollable-element > .scrollbar': {
            display: 'none !important',
          },
          '.dvt-inline-monaco .view-line': {
            fontFamily: `${CODE_FONT_FAMILY} !important`,
            fontKerning: 'none',
            fontFeatureSettings: '"liga" 0, "calt" 0',
            fontVariantLigatures: 'none',
          },
          '.dvt-inline-monaco .monaco-editor .dvt-inline-number, .dvt-inline-monaco .view-line span.dvt-inline-number':
            {
              color: `${INLINE_VALUE_TYPE_COLORS.numeric} !important`,
            },
          '.dvt-inline-monaco .monaco-editor .dvt-inline-string, .dvt-inline-monaco .view-line span.dvt-inline-string':
            {
              color: `${INLINE_VALUE_TYPE_COLORS.string} !important`,
            },
          '.dvt-inline-monaco .monaco-editor .dvt-inline-boolean, .dvt-inline-monaco .monaco-editor .dvt-inline-operator, .dvt-inline-monaco .view-line span.dvt-inline-boolean, .dvt-inline-monaco .view-line span.dvt-inline-operator':
            {
              color: `${INLINE_VALUE_TYPE_COLORS.boolean} !important`,
            },
          '.dvt-inline-monaco .monaco-editor .dvt-inline-global, .dvt-inline-monaco .view-line span.dvt-inline-global':
            {
              color: `${INLINE_VALUE_TYPE_COLORS.boolean} !important`,
            },
          '.dvt-inline-monaco .monaco-editor .dvt-inline-unknown, .dvt-inline-monaco .view-line span.dvt-inline-unknown':
            {
              color: `${INLINE_VALUE_TYPE_COLORS.unknown} !important`,
            },
        }}
      />
      <Box
        ref={(node: HTMLDivElement | null) => {
          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
            return;
          }
          if (forwardedRef) {
            forwardedRef.current = node;
          }
        }}
        sx={theme => ({
          minWidth: 150,
          display: 'flex',
          alignItems: 'center',
          minHeight: getControlHeight(),
          border: '1px solid',
          borderColor: isFocused
            ? hasError
              ? theme.palette.error.main
              : alpha(theme.palette.primary.main, 0.34)
            : theme.palette.divider,
          borderRadius,
          boxSizing: 'border-box',
          backgroundColor: alpha(
            theme.palette.background.paper,
            theme.palette.mode === 'light' ? 0.94 : 0.72
          ),
          boxShadow: isFocused
            ? `0 0 0 3px ${alpha(
                hasError
                  ? theme.palette.error.main
                  : theme.palette.primary.main,
                theme.palette.mode === 'light' ? 0.1 : 0.18
              )}`
            : 'none',
          transition:
            'background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
          '&:hover': {
            borderColor: alpha(theme.palette.primary.main, 0.34),
          },
        })}
      >
        {startActions ? (
          <Box
            ref={startAdornmentRef}
            sx={{
              ml: 1,
              mr: '-14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.25,
              flexShrink: 0,
            }}
          >
            {startActions}
          </Box>
        ) : null}
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            minWidth: 0,
            pl: `calc(14px + ${startActionsWidth}px)`,
            py: '10.5px',
            pr: `calc(14px + ${endActionsWidth}px)`,
          }}
        >
          {!normalizedValue && placeholder && !isFocused ? (
            <Typography
              sx={{
                position: 'absolute',
                inset: `50% auto auto calc(14px + ${startActionsWidth}px)`,
                transform: 'translateY(-50%)',
                color: 'text.disabled',
                fontFamily: CODE_FONT_FAMILY,
                fontSize: 13,
                lineHeight: 1.4375,
                pointerEvents: 'none',
              }}
            >
              {placeholder}
            </Typography>
          ) : null}
          <Box
            className='dvt-inline-monaco nokey nopan'
            sx={{
              width: '100%',
              minWidth: 0,
              '& .monaco-editor, & .monaco-editor .overflow-guard': {
                borderRadius: 0,
              },
            }}
          >
            <MonacoEditor
              height='20px'
              language={highlightingEnabled ? languageId : 'plaintext'}
              value={normalizedValue}
              onChange={handleEditorChange}
              onMount={handleMount}
              loading={null}
              options={{
                automaticLayout: true,
                contextmenu: false,
                cursorBlinking: 'solid',
                cursorStyle: 'line',
                fixedOverflowWidgets: false,
                folding: false,
                fontFamily: CODE_FONT_FAMILY,
                fontSize: 13,
                glyphMargin: false,
                hideCursorInOverviewRuler: true,
                hover: {
                  enabled: highlightingEnabled,
                },
                lineDecorationsWidth: 0,
                lineNumbers: 'off',
                lineNumbersMinChars: 0,
                matchBrackets: 'never',
                minimap: { enabled: false },
                overviewRulerBorder: false,
                overviewRulerLanes: 0,
                padding: { top: 0, bottom: 0 },
                placeholder,
                quickSuggestions: highlightingEnabled
                  ? { other: true, comments: false, strings: true }
                  : false,
                acceptSuggestionOnCommitCharacter: false,
                renderFinalNewline: 'off',
                renderLineHighlight: 'none',
                renderValidationDecorations: 'on',
                roundedSelection: false,
                scrollBeyondLastColumn: 0,
                scrollBeyondLastLine: false,
                scrollbar: {
                  alwaysConsumeMouseWheel: false,
                  handleMouseWheel: false,
                  horizontal: 'hidden',
                  vertical: 'hidden',
                  useShadows: false,
                },
                suggest: {
                  showIcons: false,
                  showStatusBar: false,
                  preview: false,
                },
                suggestOnTriggerCharacters: highlightingEnabled,
                tabCompletion: highlightingEnabled ? 'on' : 'off',
                wordWrap: 'off',
              }}
              theme='vs'
            />
          </Box>
        </Box>
        {resolvedEndActions ? (
          <Box
            ref={endAdornmentRef}
            sx={{
              mr: 1,
              ml: '-14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.25,
              flexShrink: 0,
            }}
          >
            {resolvedEndActions}
          </Box>
        ) : null}
      </Box>
      {resolvedHelperText ? (
        <FormHelperText error={hasError}>{resolvedHelperText}</FormHelperText>
      ) : null}
    </FormControl>
  );
});
