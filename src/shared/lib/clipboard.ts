export type ClipboardCopyResult = 'copied' | 'manual' | 'failed';

const canUseAsyncClipboard = () =>
  typeof window !== 'undefined' &&
  window.isSecureContext &&
  typeof navigator !== 'undefined' &&
  typeof navigator.clipboard?.writeText === 'function';

const selectInputText = (
  input: HTMLInputElement | HTMLTextAreaElement | null,
  textLength: number
): boolean => {
  if (!input) return false;

  input.focus();
  input.select();

  try {
    input.setSelectionRange(0, textLength);
  } catch {
    // Some input types may not support explicit selection range updates.
  }

  return true;
};

const fallbackCopyFromInput = (
  input: HTMLInputElement | HTMLTextAreaElement | null,
  text: string
) => {
  const selected = selectInputText(input, text.length);
  if (!selected || typeof document === 'undefined') {
    return { selected, copied: false };
  }

  try {
    return { selected, copied: document.execCommand('copy') };
  } catch {
    return { selected, copied: false };
  }
};

const copyViaTemporaryTextarea = (text: string): boolean => {
  if (typeof document === 'undefined') return false;

  // Stay next to the focused element: a modal focus trap would pull focus back
  // from a textarea placed outside of it and the selection would be lost.
  const host = document.activeElement?.parentElement ?? document.body;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  host.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
};

export const copyTextToClipboard = async (
  text: string,
  input: HTMLInputElement | HTMLTextAreaElement | null = null
): Promise<ClipboardCopyResult> => {
  if (!text) return 'failed';

  try {
    if (canUseAsyncClipboard()) {
      await navigator.clipboard.writeText(text);
      return 'copied';
    }
  } catch {
    // noop, fallback below
  }

  if (!input) {
    return copyViaTemporaryTextarea(text) ? 'copied' : 'failed';
  }

  const { selected, copied } = fallbackCopyFromInput(input, text);
  if (copied && typeof window !== 'undefined' && window.isSecureContext) {
    return 'copied';
  }
  if (selected) {
    return 'manual';
  }

  return 'failed';
};
