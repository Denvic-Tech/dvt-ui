import { describe, expect, it } from 'vitest';

import {
  nodeDocumentationViewerActions,
  nodeDocumentationViewerReducer,
} from '../slice';

describe('node-documentation-viewer slice', () => {
  it('opens viewer with node payload and clears it on close', () => {
    const opened = nodeDocumentationViewerReducer(
      undefined,
      nodeDocumentationViewerActions.open({
        nodeName: 'expand_json',
        nodeTitle: 'Expand JSON',
      })
    );

    expect(opened.open).toBe(true);
    expect(opened.nodeName).toBe('expand_json');
    expect(opened.nodeTitle).toBe('Expand JSON');

    const closed = nodeDocumentationViewerReducer(
      opened,
      nodeDocumentationViewerActions.close()
    );

    expect(closed.open).toBe(false);
    expect(closed.nodeName).toBeNull();
    expect(closed.nodeTitle).toBeNull();
  });
});
