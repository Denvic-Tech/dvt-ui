import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import { Box, FormControl, FormHelperText, GlobalStyles } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type * as monacoTypes from 'monaco-editor';

import { getControlRadius } from '@/shared/ui/primitives/components/theme-style-helpers';

import {
  collectTriggerCharacters,
  getWordRangeAtPosition,
  toMonacoCompletionItems,
} from './completion';
import type {
  CodeEditorCompletionProvider,
  CodeEditorLanguage,
  CodeEditorMarker,
  CodeEditorOptions,
} from './types';

type CodeEditorProps<TContext = unknown> = {
  value: string;
  onChange: (value: string) => void;
  language: CodeEditorLanguage;
  context?: TContext | undefined;
  completionProviders?: Array<CodeEditorCompletionProvider<TContext>>;
  markers?: CodeEditorMarker[] | undefined;
  markerOwner?: string | undefined;
  height?: string | number | undefined;
  helperText?: React.ReactNode | undefined;
  error?: boolean | undefined;
  className?: string | undefined;
  options?: CodeEditorOptions | undefined;
  onMount?: OnMount | undefined;
};

const DEFAULT_MARKER_OWNER = 'dvt-code-editor';
const EMPTY_COMPLETION_PROVIDERS: Array<CodeEditorCompletionProvider<unknown>> =
  [];
const EMPTY_MARKERS: CodeEditorMarker[] = [];

const baseEditorOptions: CodeEditorOptions = {
  acceptSuggestionOnCommitCharacter: false,
  acceptSuggestionOnEnter: 'off',
  automaticLayout: true,
  fontFamily: '"JetBrains Mono", "Fira Code", "SFMono-Regular", monospace',
  fontSize: 13,
  lineNumbers: 'on',
  lineNumbersMinChars: 3,
  minimap: { enabled: false },
  padding: { top: 8, bottom: 8 },
  renderValidationDecorations: 'on',
  renderWhitespace: 'none',
  scrollBeyondLastLine: false,
  suggest: {
    preview: false,
    showStatusBar: false,
  },
  tabCompletion: 'on',
  wordWrap: 'on',
};

const getModelUri = (model: monacoTypes.editor.ITextModel | null | undefined) =>
  model?.uri?.toString() ?? null;

const getEditorModel = (
  editor: monacoTypes.editor.IStandaloneCodeEditor | null | undefined
) => (typeof editor?.getModel === 'function' ? editor.getModel() : null);

const toMonacoMarkers = (
  model: monacoTypes.editor.ITextModel,
  monaco: typeof monacoTypes,
  markers: CodeEditorMarker[]
): monacoTypes.editor.IMarkerData[] => {
  const modelLength =
    typeof model.getValueLength === 'function'
      ? model.getValueLength()
      : typeof model.getValue === 'function'
        ? model.getValue().length
        : Math.max(0, ...markers.map(marker => marker.end));

  return markers.map(marker => {
    const startOffset = Math.max(0, Math.min(marker.start, modelLength));
    const endOffset = Math.max(
      startOffset + 1,
      Math.min(Math.max(marker.end, startOffset + 1), modelLength)
    );
    const startPosition = model.getPositionAt(startOffset);
    const endPosition = model.getPositionAt(endOffset);

    return {
      startLineNumber: startPosition.lineNumber,
      startColumn: startPosition.column,
      endLineNumber: endPosition.lineNumber,
      endColumn: endPosition.column,
      message: marker.message,
      severity:
        marker.severity === 'warning'
          ? monaco.MarkerSeverity.Warning
          : monaco.MarkerSeverity.Error,
    };
  });
};

export function CodeEditor<TContext = unknown>({
  value,
  onChange,
  language,
  context,
  completionProviders = EMPTY_COMPLETION_PROVIDERS as Array<
    CodeEditorCompletionProvider<TContext>
  >,
  markers = EMPTY_MARKERS,
  markerOwner = DEFAULT_MARKER_OWNER,
  height = 280,
  helperText,
  error = false,
  className,
  options,
  onMount,
}: CodeEditorProps<TContext>) {
  const editorRef = useRef<monacoTypes.editor.IStandaloneCodeEditor | null>(
    null
  );
  const monacoRef = useRef<typeof monacoTypes | null>(null);
  const activeModelUriRef = useRef<string | null>(null);
  const completionDisposablesRef = useRef<monacoTypes.IDisposable[]>([]);
  const editorDisposablesRef = useRef<monacoTypes.IDisposable[]>([]);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const [focused, setFocused] = useState(false);

  const typedCompletionProviders = completionProviders as Array<
    CodeEditorCompletionProvider<unknown>
  >;
  const resolvedContext = context as unknown;

  const resolvedOptions = useMemo<CodeEditorOptions>(
    () => ({
      ...baseEditorOptions,
      quickSuggestions:
        completionProviders.length > 0
          ? { other: true, comments: false, strings: true }
          : false,
      suggestOnTriggerCharacters: completionProviders.length > 0,
      tabCompletion: completionProviders.length > 0 ? 'on' : 'off',
      ...(options ?? {}),
    }),
    [completionProviders.length, options]
  );

  const syncMarkers = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = getEditorModel(editor);

    if (
      !editor ||
      !monaco ||
      !model ||
      typeof monaco.editor?.setModelMarkers !== 'function'
    ) {
      return;
    }

    monaco.editor.setModelMarkers(
      model,
      markerOwner,
      toMonacoMarkers(model, monaco, markers)
    );
  }, [markerOwner, markers]);

  const registerCompletionProviders = useCallback(
    (monaco: typeof monacoTypes) => {
      completionDisposablesRef.current.forEach(disposable =>
        disposable.dispose()
      );

      if (typedCompletionProviders.length === 0) {
        completionDisposablesRef.current = [];
        return;
      }

      const disposable = monaco.languages.registerCompletionItemProvider(
        language,
        {
          triggerCharacters: collectTriggerCharacters(typedCompletionProviders),
          provideCompletionItems: (model, position) => {
            const modelUri = getModelUri(model);
            const activeModelUri = activeModelUriRef.current;

            if (activeModelUri && modelUri && activeModelUri !== modelUri) {
              return { suggestions: [] };
            }

            const editor = editorRef.current;
            if (!editor) {
              return { suggestions: [] };
            }

            const wordRange = getWordRangeAtPosition(model, position);
            const sectionsByProvider = new Map();

            typedCompletionProviders.forEach(provider => {
              const sections = provider.getSections({
                context: resolvedContext,
                editor,
                model,
                monaco,
                position,
                wordRange,
              });
              sectionsByProvider.set(provider.id, sections);
            });

            return {
              suggestions: toMonacoCompletionItems({
                monaco,
                providers: typedCompletionProviders,
                sectionsByProvider,
                fallbackRange: wordRange,
              }),
            };
          },
        }
      );

      completionDisposablesRef.current = [disposable];
    },
    [language, resolvedContext, typedCompletionProviders]
  );

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      activeModelUriRef.current = getModelUri(getEditorModel(editor));

      registerCompletionProviders(monaco);
      syncMarkers();

      const focusDisposable = editor.onDidFocusEditorText?.(() => {
        setFocused(true);
      });
      const blurDisposable = editor.onDidBlurEditorText?.(() => {
        setFocused(false);
      });
      const enterDisposable = editor.onKeyDown?.(event => {
        if (event.keyCode !== monaco.KeyCode.Enter) {
          return;
        }

        if (event.ctrlKey || event.metaKey || event.altKey) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        editor.trigger('keyboard', 'type', { text: '\n' });
      });

      onMount?.(editor, monaco);

      if (focusDisposable || blurDisposable || enterDisposable) {
        editorDisposablesRef.current.push(
          ...[focusDisposable, blurDisposable, enterDisposable].filter(
            (item): item is monacoTypes.IDisposable => Boolean(item)
          )
        );
      }
    },
    [onMount, registerCompletionProviders, syncMarkers]
  );

  useEffect(() => {
    syncMarkers();
  }, [syncMarkers]);

  useEffect(() => {
    if (monacoRef.current) {
      registerCompletionProviders(monacoRef.current);
    }
  }, [registerCompletionProviders]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = getEditorModel(editor);

    if (
      !editor ||
      !monaco ||
      !model ||
      typeof monaco.editor?.setModelLanguage !== 'function'
    ) {
      return;
    }

    monaco.editor.setModelLanguage(model, language);
  }, [language]);

  useEffect(() => {
    const editor = editorRef.current;
    const container = editorContainerRef.current;

    if (!editor || !container) {
      return;
    }

    const layoutEditor = () => {
      editor.layout();
    };

    const firstFrame = window.requestAnimationFrame(() => {
      layoutEditor();
      window.requestAnimationFrame(layoutEditor);
    });

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        window.cancelAnimationFrame(firstFrame);
      };
    }

    const observer = new ResizeObserver(layoutEditor);
    observer.observe(container);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      observer.disconnect();
    };
  }, [height, value]);

  useEffect(() => {
    return () => {
      completionDisposablesRef.current.forEach(disposable =>
        disposable.dispose()
      );
      editorDisposablesRef.current.forEach(disposable => disposable.dispose());
    };
  }, []);

  return (
    <FormControl
      fullWidth
      error={error}
      data-testid='shared/ui/code-editor/code-editor-root'
      data-code-language={language}
      sx={{
        display: 'flex',
        minHeight: 0,
        ...(typeof height === 'string' ? { height } : {}),
      }}
    >
      <GlobalStyles
        styles={theme => ({
          '.dvt-code-editor .monaco-editor, .dvt-code-editor .monaco-editor-background':
            {
              backgroundColor: 'transparent !important',
            },
          '.dvt-code-editor .monaco-editor .overflow-guard': {
            backgroundColor: 'transparent !important',
          },
          '.dvt-code-editor .monaco-editor .margin': {
            backgroundColor: 'transparent !important',
          },
          '.dvt-code-editor .monaco-editor .line-numbers': {
            color: `${alpha(theme.palette.text.primary, 0.34)} !important`,
            fontSize: '12px !important',
          },
          '.dvt-code-editor .monaco-editor .current-line, .dvt-code-editor .monaco-editor .current-line-margin':
            {
              border: '0 !important',
            },
          '.dvt-code-editor .monaco-scrollable-element > .scrollbar > .slider':
            {
              borderRadius: 999,
              background: `${alpha(theme.palette.text.primary, 0.18)} !important`,
            },
        })}
      />
      <Box
        ref={editorContainerRef}
        data-testid='shared/ui/code-editor/code-editor-input'
        data-code-language={language}
        className={['dvt-code-editor', 'nokey', 'nopan', className]
          .filter(Boolean)
          .join(' ')}
        sx={theme => ({
          minHeight: 0,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: error
            ? theme.palette.error.main
            : focused
              ? alpha(theme.palette.primary.main, 0.34)
              : theme.palette.divider,
          borderRadius: getControlRadius(theme),
          backgroundColor: alpha(
            theme.palette.background.paper,
            theme.palette.mode === 'light' ? 0.94 : 0.72
          ),
          boxShadow: 'none',
          transition: 'background-color 150ms ease, border-color 150ms ease',
          ...(typeof height === 'number'
            ? { height: `${height}px`, flex: '0 0 auto' }
            : { flex: 1 }),
          '& .monaco-editor, & .monaco-editor .overflow-guard': {
            borderRadius: 0,
          },
        })}
      >
        <MonacoEditor
          height={typeof height === 'number' ? `${height}px` : '100%'}
          language={language}
          value={value}
          onChange={nextValue => onChange(nextValue ?? '')}
          onMount={handleMount}
          options={resolvedOptions}
          theme='vs'
        />
      </Box>
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  );
}
