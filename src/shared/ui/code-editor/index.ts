export { CodeEditor } from './CodeEditor';
export {
  collectTriggerCharacters,
  getWordRangeAtPosition,
  toMonacoCompletionItems,
} from './completion';
export {
  createSqlCompletionProvider,
  type SqlCompletionCatalog,
  type SqlCompletionColumn,
  type SqlCompletionTable,
} from './language-packs/sql';
export type {
  CodeEditorCompletionContext,
  CodeEditorCompletionItem,
  CodeEditorCompletionKind,
  CodeEditorCompletionProvider,
  CodeEditorCompletionSection,
  CodeEditorLanguage,
  CodeEditorMarker,
  CodeEditorOptions,
} from './types';
