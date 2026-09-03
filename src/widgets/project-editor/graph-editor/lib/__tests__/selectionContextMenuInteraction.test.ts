import { describe, expect, it } from 'vitest';

import {
  getReactFlowNodeIDFromTarget,
  isContextMenuTargetInsideMultiSelection,
  shouldOpenMultiSelectionContextMenu,
} from '../selectionContextMenuInteraction';

describe('selection context menu interaction helpers', () => {
  it('resolves ReactFlow node id from nested node content', () => {
    const node = document.createElement('div');
    node.className = 'react-flow__node';
    node.setAttribute('data-id', 'node-1');

    const content = document.createElement('button');
    node.appendChild(content);
    document.body.appendChild(node);

    expect(getReactFlowNodeIDFromTarget(content)).toBe('node-1');

    node.remove();
  });

  it('matches only targets inside the current multi selection', () => {
    const node = document.createElement('div');
    node.className = 'react-flow__node';
    node.setAttribute('data-id', 'node-2');

    const content = document.createElement('span');
    node.appendChild(content);
    document.body.appendChild(node);

    expect(
      isContextMenuTargetInsideMultiSelection(content, ['node-1', 'node-2'])
    ).toBe(true);
    expect(isContextMenuTargetInsideMultiSelection(content, ['node-2'])).toBe(
      false
    );
    expect(
      isContextMenuTargetInsideMultiSelection(content, ['node-1', 'node-3'])
    ).toBe(false);

    node.remove();
  });

  it('requires the contextmenu target to be inside a selected node', () => {
    const overlay = document.createElement('div');
    overlay.className = 'react-flow__nodesselection';

    expect(
      shouldOpenMultiSelectionContextMenu(overlay, ['node-1', 'node-2'])
    ).toBe(false);
    expect(shouldOpenMultiSelectionContextMenu(overlay, ['node-1'])).toBe(
      false
    );
  });

  it('ignores handle targets inside the current multi selection', () => {
    const node = document.createElement('div');
    node.className = 'react-flow__node';
    node.setAttribute('data-id', 'node-2');

    const handle = document.createElement('span');
    handle.className = 'react-flow__handle';
    node.appendChild(handle);
    document.body.appendChild(node);

    expect(
      isContextMenuTargetInsideMultiSelection(handle, ['node-1', 'node-2'])
    ).toBe(false);
    expect(
      shouldOpenMultiSelectionContextMenu(handle, ['node-1', 'node-2'])
    ).toBe(false);

    node.remove();
  });
});
