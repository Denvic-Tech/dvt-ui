import type * as monacoTypes from 'monaco-editor';

export type CodeEditorLanguage =
  | 'json'
  | 'plaintext'
  | 'python'
  | 'sql'
  | string;

export type CodeEditorCompletionKind =
  | 'class'
  | 'field'
  | 'function'
  | 'keyword'
  | 'operator'
  | 'snippet'
  | 'value'
  | 'variable';

export type CodeEditorCompletionItem = {
  id?: string | undefined;
  label: string;
  insertText: string;
  kind?: CodeEditorCompletionKind | undefined;
  monacoKind?: monacoTypes.languages.CompletionItemKind | undefined;
  detail?: string | undefined;
  documentation?: string | undefined;
  filterText?: string | undefined;
  keywords?: string[] | undefined;
  range?: monacoTypes.IRange | undefined;
  insertTextRules?:
    | monacoTypes.languages.CompletionItemInsertTextRule
    | undefined;
};

export type CodeEditorCompletionSection = {
  id: string;
  title?: string | undefined;
  priority?: number | undefined;
  items: CodeEditorCompletionItem[];
};

export type CodeEditorCompletionContext<TContext = unknown> = {
  context: TContext;
  editor: monacoTypes.editor.IStandaloneCodeEditor;
  model: monacoTypes.editor.ITextModel;
  monaco: typeof monacoTypes;
  position: monacoTypes.Position;
  wordRange: monacoTypes.IRange;
};

export type CodeEditorCompletionProvider<TContext = unknown> = {
  id: string;
  priority?: number | undefined;
  triggerCharacters?: string[] | undefined;
  getSections: (
    params: CodeEditorCompletionContext<TContext>
  ) => CodeEditorCompletionSection[];
};

export type CodeEditorMarker = {
  start: number;
  end: number;
  message: string;
  severity?: 'error' | 'warning' | undefined;
};

export type CodeEditorOptions = Omit<
  monacoTypes.editor.IStandaloneEditorConstructionOptions,
  'value' | 'language'
>;
