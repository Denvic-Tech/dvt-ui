import type * as monacoTypes from 'monaco-editor';

const EDITOR_FONT_FAMILY = '"JetBrains Mono"';

/**
 * Monaco замеряет ширину символа один раз и кэширует её глобально. Если первый
 * редактор на странице смонтировался до загрузки веб-шрифта, каретка, выделение
 * и подсветка считаются по запасному шрифту и «уезжают» внутрь текста.
 * После загрузки шрифта просим Monaco перезамерить метрики.
 */
export const remeasureFontsWhenReady = (
  monaco: typeof monacoTypes,
  fontSize = 13
): void => {
  if (typeof document === 'undefined' || !document.fonts) {
    return;
  }

  const remeasure = () => monaco.editor.remeasureFonts();

  try {
    Promise.all([
      document.fonts.ready,
      document.fonts.load(`${fontSize}px ${EDITOR_FONT_FAMILY}`),
    ])
      .then(remeasure)
      .catch(remeasure);
  } catch {
    remeasure();
  }
};
