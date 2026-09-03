import type * as monacoTypes from 'monaco-editor';

import type {
  CodeEditorCompletionItem,
  CodeEditorCompletionKind,
  CodeEditorCompletionProvider,
  CodeEditorCompletionSection,
} from './types';

const KIND_TO_MONACO = (
  monaco: typeof monacoTypes,
  kind: CodeEditorCompletionKind | undefined
) => {
  switch (kind) {
    case 'class':
      return monaco.languages.CompletionItemKind.Class;
    case 'field':
      return monaco.languages.CompletionItemKind.Field;
    case 'function':
      return monaco.languages.CompletionItemKind.Function;
    case 'keyword':
      return monaco.languages.CompletionItemKind.Keyword;
    case 'operator':
      return monaco.languages.CompletionItemKind.Operator;
    case 'snippet':
      return monaco.languages.CompletionItemKind.Snippet;
    case 'variable':
      return monaco.languages.CompletionItemKind.Variable;
    case 'value':
    default:
      return monaco.languages.CompletionItemKind.Value;
  }
};

export const getWordRangeAtPosition = (
  model: monacoTypes.editor.ITextModel,
  position: monacoTypes.Position
): monacoTypes.IRange => {
  const word = model.getWordUntilPosition(position);

  return {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: word.startColumn,
    endColumn: word.endColumn,
  };
};

const getSectionPriority = (section: CodeEditorCompletionSection) =>
  section.priority ?? 100;

const getProviderPriority = (provider: CodeEditorCompletionProvider<unknown>) =>
  provider.priority ?? 100;

const buildFilterText = (item: CodeEditorCompletionItem): string =>
  item.filterText ??
  [item.label, item.insertText, ...(item.keywords ?? [])].join(' ');

export const toMonacoCompletionItems = ({
  monaco,
  providers,
  sectionsByProvider,
  fallbackRange,
}: {
  monaco: typeof monacoTypes;
  providers: Array<CodeEditorCompletionProvider<unknown>>;
  sectionsByProvider: Map<string, CodeEditorCompletionSection[]>;
  fallbackRange: monacoTypes.IRange;
}): monacoTypes.languages.CompletionItem[] => {
  const result: monacoTypes.languages.CompletionItem[] = [];

  providers
    .slice()
    .sort((a, b) => getProviderPriority(a) - getProviderPriority(b))
    .forEach((provider, providerIndex) => {
      const sections = sectionsByProvider.get(provider.id) ?? [];

      sections
        .slice()
        .sort((a, b) => getSectionPriority(a) - getSectionPriority(b))
        .forEach((section, sectionIndex) => {
          section.items.forEach((item, itemIndex) => {
            result.push({
              label: item.label,
              kind: item.monacoKind ?? KIND_TO_MONACO(monaco, item.kind),
              insertText: item.insertText,
              ...(item.detail ? { detail: item.detail } : {}),
              ...(item.documentation
                ? { documentation: item.documentation }
                : {}),
              ...(item.insertTextRules
                ? { insertTextRules: item.insertTextRules }
                : {}),
              filterText: buildFilterText(item),
              sortText: [
                String(providerIndex).padStart(2, '0'),
                String(getProviderPriority(provider)).padStart(4, '0'),
                String(sectionIndex).padStart(2, '0'),
                String(getSectionPriority(section)).padStart(4, '0'),
                String(itemIndex).padStart(4, '0'),
                item.label,
              ].join(':'),
              range: item.range ?? fallbackRange,
            });
          });
        });
    });

  return result;
};

export const collectTriggerCharacters = (
  providers: Array<CodeEditorCompletionProvider<unknown>>
): string[] => {
  const chars = new Set<string>();

  providers.forEach(provider => {
    provider.triggerCharacters?.forEach(char => chars.add(char));
  });

  return Array.from(chars);
};
