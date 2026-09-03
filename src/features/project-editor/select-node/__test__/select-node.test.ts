import { describe, expect, it } from 'vitest';

import {
  selectNodeActions,
  selectNodeReducer,
  selectSelectedNodeID,
} from '@/features/project-editor/select-node';

import {
  applyCustomNodeDataDefaults,
  isCustomEdgeType,
  isCustomNodeType,
} from '@/entities/project-editor/graph';

describe('entities/custom-node', () => {
  it('validates custom node shape', () => {
    const validNode = {
      id: 'node-1',
      position: { x: 10, y: 20 },
      data: {
        name: 'source',
        displayName: 'Source',
        inputValues: {},
      },
    };

    expect(isCustomNodeType(validNode)).toBe(true);
    expect(isCustomNodeType({ ...validNode, id: '' })).toBe(false);
  });

  it('validates custom edge shape', () => {
    expect(
      isCustomEdgeType({
        id: 'edge-1',
        source: 'node-a',
        target: 'node-b',
        sourceHandle: 'output-main',
        targetHandle: 'input-main',
      })
    ).toBe(true);

    expect(
      isCustomEdgeType({
        id: 'edge-1',
        source: 'node-a',
        target: 'node-b',
        sourceHandle: '',
        targetHandle: 'input-main',
      })
    ).toBe(false);
  });

  it('applies showVariablesIo=false by default for new node data', () => {
    expect(
      applyCustomNodeDataDefaults({
        name: 'source',
        displayName: 'Source',
        inputValues: {},
      }).showVariablesIo
    ).toBe(false);

    expect(
      applyCustomNodeDataDefaults({
        name: 'source',
        displayName: 'Source',
        inputValues: {},
        showVariablesIo: true,
      }).showVariablesIo
    ).toBe(true);
  });

  it('updates and resets selected node in reducer', () => {
    const selectedState = selectNodeReducer(
      undefined,
      selectNodeActions.selectNode('node-42')
    );
    expect(selectedState.selectedNodeID).toBe('node-42');

    const resetState = selectNodeReducer(
      selectedState,
      selectNodeActions.resetState()
    );
    expect(resetState.selectedNodeID).toBeNull();

    const selectedNodeID = selectSelectedNodeID({
      customNode: selectedState,
    } as any);
    expect(selectedNodeID).toBe('node-42');
  });
});
