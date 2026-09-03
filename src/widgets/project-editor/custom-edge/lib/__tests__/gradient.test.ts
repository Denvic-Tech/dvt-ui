import { describe, expect, it } from 'vitest';

import {
  blendEdgeColorWithHandle,
  buildCustomEdgeUiGradient,
  buildHandleColorLookup,
  CUSTOM_EDGE_BASE_STROKE,
  CUSTOM_EDGE_COLOR_BLEND_RATIO,
  getCustomEdgeUiGradient,
} from '@/widgets/project-editor/custom-edge';

describe('widgets/project-editor/custom-edge/gradient', () => {
  it('builds handle color lookup for regular nodes and subgraph ports', () => {
    const lookup = buildHandleColorLookup({
      nodes: [
        {
          id: 'node-source',
          data: { name: 'Source', displayName: 'Source', inputValues: {} },
          position: { x: 0, y: 0 },
        },
        {
          id: 'node-target',
          data: { name: 'Target', displayName: 'Target', inputValues: {} },
          position: { x: 120, y: 80 },
        },
      ] as any,
      nodeDefinitionsMap: {
        Source: {
          input_definitions: {},
          output_definitions: {
            main: {
              attr_name: 'main',
              type: 'DATAFRAME',
            },
          },
        },
        Target: {
          input_definitions: {
            text: {
              attr_name: 'text',
              type: 'STRING',
            },
          },
          output_definitions: {},
        },
      } as any,
      portsBySubgraphID: {
        'subgraph-1': [
          {
            id: 'sg-in:node-target:input-text',
            side: 'input',
            label: 'Target: text',
            nodeDisplayName: 'Target',
            handleDisplayName: 'text',
            ioType: 'STRING',
            internalNodeId: 'node-target',
            internalHandleId: 'input-text',
            connected: true,
          },
        ],
      },
    });

    expect(lookup.get('node-source::output-main')).toBe('#43A047');
    expect(lookup.get('node-target::input-text')).toBe('#1E88E5');
    expect(lookup.get('subgraph-1::sg-in:node-target:input-text')).toBe(
      '#1E88E5'
    );
  });

  it('blends endpoint colors softly into the default edge gray', () => {
    const lookup = new Map<string, string>([
      ['node-source::output-main', '#43A047'],
      ['node-target::input-text', '#1E88E5'],
    ]);

    expect(
      buildCustomEdgeUiGradient(
        {
          source: 'node-source',
          sourceHandle: 'output-main',
          target: 'node-target',
          targetHandle: 'input-text',
        } as any,
        lookup
      )
    ).toEqual({
      sourceColor: blendEdgeColorWithHandle(
        '#43A047',
        CUSTOM_EDGE_COLOR_BLEND_RATIO
      ),
      targetColor: blendEdgeColorWithHandle(
        '#1E88E5',
        CUSTOM_EDGE_COLOR_BLEND_RATIO
      ),
    });
  });

  it('supports partial gradient fallback and uiGradient parsing', () => {
    const uiGradient = buildCustomEdgeUiGradient(
      {
        source: 'node-source',
        sourceHandle: 'output-main',
        target: 'node-target',
        targetHandle: 'input-missing',
      } as any,
      new Map<string, string>([['node-source::output-main', '#5E35B1']])
    );

    expect(uiGradient).toEqual({
      sourceColor: blendEdgeColorWithHandle('#5E35B1'),
    });
    expect(getCustomEdgeUiGradient({ uiGradient })).toEqual(uiGradient);
    expect(getCustomEdgeUiGradient({ uiGradient: { sourceColor: 42 } })).toBe(
      undefined
    );
  });

  it('falls back to the default edge gray for unsupported color formats', () => {
    expect(blendEdgeColorWithHandle('rgb(10, 20, 30)')).toBe(
      CUSTOM_EDGE_BASE_STROKE
    );
  });
});
