const TEXT_INPUT_TAGS = new Set(['input', 'textarea', 'select']);
const TEXT_INPUT_CONTAINER_SELECTOR =
  '.nokey, .monaco-editor, .native-edit-context';
const DIALOG_SELECTOR = '[role="dialog"], .MuiDialog-root';
/**
 * Any overlay that owns the keyboard: MUI Dialog / Drawer / Menu / Popover all
 * render a `.MuiModal-root`; `aria-modal` covers non-MUI modal windows.
 */
const MODAL_LAYER_SELECTOR = '.MuiModal-root, [aria-modal="true"]';
/**
 * Closed `keepMounted` MUI modals stay in the DOM under `.MuiModal-hidden`,
 * including their `aria-modal="true"` paper (the project editor always has
 * one), so they must not count as open.
 */
const HIDDEN_MODAL_SELECTOR = '.MuiModal-hidden';

export const CANVAS_DELETE_KEYS: readonly string[] = ['Backspace', 'Delete'];

export const isTextInputTarget = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  if (tag && TEXT_INPUT_TAGS.has(tag)) {
    return true;
  }
  if (el.isContentEditable) return true;
  if (el.getAttribute?.('role') === 'textbox') return true;
  return Boolean(el.closest?.(TEXT_INPUT_CONTAINER_SELECTOR));
};

export const isDialogTarget = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  if (!el) return false;

  if (el.closest?.(DIALOG_SELECTOR)) {
    return true;
  }

  const activeElement = document.activeElement as HTMLElement | null;
  return Boolean(activeElement?.closest?.(DIALOG_SELECTOR));
};

export const hasOpenModalLayer = (doc: Document = document) =>
  Array.from(doc.querySelectorAll(MODAL_LAYER_SELECTOR)).some(
    layer => !layer.closest(HIDDEN_MODAL_SELECTOR)
  );

/**
 * Keyboard/clipboard events belong to the graph when they come from the
 * canvas wrapper or from the page itself (focus on `body` after a pane click).
 */
export const isGraphKeyboardTarget = (
  target: EventTarget | null,
  wrapper: HTMLElement | null
) => {
  if (!wrapper) {
    return false;
  }

  const targetNode = target as Node | null;
  if (targetNode && wrapper.contains(targetNode)) {
    return true;
  }

  const doc = wrapper.ownerDocument;
  const activeElement = doc.activeElement;
  if (activeElement && wrapper.contains(activeElement)) {
    return true;
  }

  return (
    !targetNode || targetNode === doc.body || targetNode === doc.documentElement
  );
};

/**
 * Canvas delete hotkey guard. React Flow's built-in `deleteKeyCode` listens on
 * `document` and skips only text inputs, so keystrokes that bubble out of a
 * node settings modal (focus on a button or an empty area) deleted the
 * selected nodes. One deletion per physical key press, no modifiers, and never
 * while a modal layer is open or the focus is outside the canvas.
 */
export const shouldHandleCanvasDeleteKey = (
  event: KeyboardEvent,
  wrapper: HTMLElement | null
) => {
  if (!CANVAS_DELETE_KEYS.includes(event.key)) return false;
  if (event.defaultPrevented || event.repeat || event.isComposing) {
    return false;
  }
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
    return false;
  }
  if (isTextInputTarget(event.target)) return false;
  if (isDialogTarget(event.target)) return false;
  if (hasOpenModalLayer(wrapper?.ownerDocument ?? document)) return false;

  return isGraphKeyboardTarget(event.target, wrapper);
};
