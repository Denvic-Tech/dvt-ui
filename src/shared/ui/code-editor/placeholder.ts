import type * as monacoTypes from 'monaco-editor';

const PLACEHOLDER_WIDGET_ID = 'dvt.code-editor.placeholder';

/**
 * Показывает подсказку в пустом редакторе Monaco. Реализована как content
 * widget на позиции первой строки, поэтому сама встаёт на место текста
 * (с учётом нумерации и отступов) и исчезает, как только появляется ввод.
 */
export const attachEditorPlaceholder = (
  editor: monacoTypes.editor.IStandaloneCodeEditor,
  monaco: typeof monacoTypes,
  text: string
): monacoTypes.IDisposable => {
  const node = document.createElement('div');
  node.className = 'dvt-code-editor-placeholder';
  node.textContent = text;
  node.style.pointerEvents = 'none';
  node.style.whiteSpace = 'pre';
  node.style.userSelect = 'none';
  node.style.opacity = '0.45';

  const applyFont = () => {
    const font = editor.getOption(monaco.editor.EditorOption.fontInfo);
    node.style.fontFamily = font.fontFamily;
    node.style.fontSize = `${font.fontSize}px`;
    node.style.lineHeight = `${font.lineHeight}px`;
  };

  const widget: monacoTypes.editor.IContentWidget = {
    getId: () => PLACEHOLDER_WIDGET_ID,
    getDomNode: () => node,
    getPosition: () => ({
      position: { lineNumber: 1, column: 1 },
      preference: [monaco.editor.ContentWidgetPositionPreference.EXACT],
    }),
  };

  let shown = false;

  const sync = () => {
    const isEmpty = (editor.getModel()?.getValue() ?? '') === '';
    if (isEmpty && !shown) {
      applyFont();
      editor.addContentWidget(widget);
      shown = true;
    } else if (!isEmpty && shown) {
      editor.removeContentWidget(widget);
      shown = false;
    }
  };

  const disposables = [
    editor.onDidChangeModelContent(sync),
    editor.onDidChangeModel(sync),
    editor.onDidChangeConfiguration(event => {
      if (event.hasChanged(monaco.editor.EditorOption.fontInfo) && shown) {
        applyFont();
        editor.layoutContentWidget(widget);
      }
    }),
  ];

  sync();

  return {
    dispose: () => {
      disposables.forEach(disposable => disposable.dispose());
      if (shown) {
        editor.removeContentWidget(widget);
        shown = false;
      }
    },
  };
};
