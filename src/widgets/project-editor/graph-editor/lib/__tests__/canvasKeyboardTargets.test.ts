import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  hasOpenModalLayer,
  isGraphKeyboardTarget,
  shouldHandleCanvasDeleteKey,
} from '../canvasKeyboardTargets';

const createKeyDown = (
  target: EventTarget,
  init: KeyboardEventInit = {}
): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', {
    key: 'Backspace',
    bubbles: true,
    cancelable: true,
    ...init,
  });
  Object.defineProperty(event, 'target', { value: target });
  return event;
};

const appendModal = (className = 'MuiModal-root MuiDialog-root') => {
  const root = document.createElement('div');
  root.className = className;
  // Mirrors MUI Dialog markup: the paper carries role/aria-modal.
  const paper = document.createElement('div');
  paper.setAttribute('role', 'dialog');
  paper.setAttribute('aria-modal', 'true');
  const button = document.createElement('button');
  const body = document.createElement('div');
  body.tabIndex = -1;
  const textarea = document.createElement('textarea');
  paper.append(button, body, textarea);
  root.append(paper);
  document.body.append(root);
  return { root, button, body, textarea };
};

describe('canvas delete hotkey guard', () => {
  let wrapper: HTMLDivElement;
  let canvasNode: HTMLDivElement;

  beforeEach(() => {
    wrapper = document.createElement('div');
    canvasNode = document.createElement('div');
    canvasNode.className = 'react-flow__node';
    canvasNode.tabIndex = 0;
    wrapper.append(canvasNode);
    document.body.append(wrapper);
  });

  afterEach(() => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    document.body.innerHTML = '';
  });

  it('handles Backspace and Delete on the canvas when no modal is open', () => {
    expect(
      shouldHandleCanvasDeleteKey(createKeyDown(document.body), wrapper)
    ).toBe(true);
    expect(
      shouldHandleCanvasDeleteKey(
        createKeyDown(canvasNode, { key: 'Delete' }),
        wrapper
      )
    ).toBe(true);
  });

  it('ignores keystrokes from a focused button or empty area of a dialog', () => {
    const { button, body } = appendModal();

    expect(shouldHandleCanvasDeleteKey(createKeyDown(button), wrapper)).toBe(
      false
    );
    expect(
      shouldHandleCanvasDeleteKey(
        createKeyDown(body, { key: 'Delete' }),
        wrapper
      )
    ).toBe(false);
  });

  it('ignores keystrokes on body while any modal layer is open', () => {
    appendModal('MuiModal-root MuiPopover-root');

    expect(hasOpenModalLayer()).toBe(true);
    expect(
      shouldHandleCanvasDeleteKey(createKeyDown(document.body), wrapper)
    ).toBe(false);
    expect(
      shouldHandleCanvasDeleteKey(createKeyDown(canvasNode), wrapper)
    ).toBe(false);
  });

  it('does not treat closed keepMounted modals as open', () => {
    // The project editor always keeps such a dialog mounted: the hidden root
    // still contains a paper with aria-modal="true".
    appendModal('MuiDialog-root MuiModal-root MuiModal-hidden');

    expect(hasOpenModalLayer()).toBe(false);
    expect(
      shouldHandleCanvasDeleteKey(createKeyDown(document.body), wrapper)
    ).toBe(true);
  });

  it('leaves text editing keystrokes to inputs and Monaco', () => {
    const input = document.createElement('input');
    const monaco = document.createElement('div');
    monaco.className = 'monaco-editor';
    const monacoTextarea = document.createElement('textarea');
    monaco.append(monacoTextarea);
    wrapper.append(input, monaco);

    expect(shouldHandleCanvasDeleteKey(createKeyDown(input), wrapper)).toBe(
      false
    );
    expect(
      shouldHandleCanvasDeleteKey(createKeyDown(monacoTextarea), wrapper)
    ).toBe(false);
  });

  it('fires once per key press and skips modifier combos', () => {
    expect(
      shouldHandleCanvasDeleteKey(
        createKeyDown(document.body, { repeat: true }),
        wrapper
      )
    ).toBe(false);
    expect(
      shouldHandleCanvasDeleteKey(
        createKeyDown(document.body, { ctrlKey: true }),
        wrapper
      )
    ).toBe(false);
    expect(
      shouldHandleCanvasDeleteKey(
        createKeyDown(document.body, { key: 'a' }),
        wrapper
      )
    ).toBe(false);
  });

  it('respects keystrokes already handled by another listener', () => {
    const event = createKeyDown(document.body);
    event.preventDefault();

    expect(shouldHandleCanvasDeleteKey(event, wrapper)).toBe(false);
  });

  it('ignores keystrokes from panels outside the canvas', () => {
    const sidePanelButton = document.createElement('button');
    document.body.append(sidePanelButton);

    expect(isGraphKeyboardTarget(sidePanelButton, wrapper)).toBe(false);
    expect(
      shouldHandleCanvasDeleteKey(createKeyDown(sidePanelButton), wrapper)
    ).toBe(false);
    expect(
      shouldHandleCanvasDeleteKey(createKeyDown(document.body), null)
    ).toBe(false);
  });
});
