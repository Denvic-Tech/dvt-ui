import { describe, expect, it } from 'vitest';

import { buildSubgraphPorts } from './buildSubgraphPorts.ts';

describe('buildSubgraphPorts', () => {
  it('hides VARIABLE and SIGNAL ports until subgraph backend integration is ready', () => {
    const memberNode = {
      id: 'node-1',
      data: {
        name: 'producer',
        displayName: 'Producer',
      },
    } as any;

    const ports = buildSubgraphPorts({
      subgraphID: 'subgraph-1',
      memberNodes: [memberNode],
      edges: [
        {
          id: 'edge-data',
          source: 'node-1',
          sourceHandle: 'output-data',
          target: 'external-node',
          targetHandle: 'input-data',
        },
        {
          id: 'edge-variable',
          source: 'node-1',
          sourceHandle: 'output-output_variables',
          target: 'external-node',
          targetHandle: 'input-input_variables',
        },
        {
          id: 'edge-signal',
          source: 'node-1',
          sourceHandle: 'output-signal_out',
          target: 'external-node',
          targetHandle: 'input-signal_in',
        },
      ] as any,
      nodeDefinitionsMap: {
        producer: {
          input_definitions: {},
          output_definitions: {
            data: {
              attr_name: 'data',
              type: 'DATAFRAME',
            },
            output_variables: {
              attr_name: 'output_variables',
              type: 'VARIABLE',
            },
            signal_out: {
              attr_name: 'signal_out',
              type: 'SIGNAL',
            },
          },
        } as any,
      },
    });

    expect(ports).toHaveLength(1);
    expect(ports[0]).toMatchObject({
      side: 'output',
      handleDisplayName: 'data',
      ioType: 'DATAFRAME',
    });
  });
});
