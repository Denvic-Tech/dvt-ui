import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useNodeConnectionValidation } from '@/features/node/validate-node-connection';

const { stateRef } = vi.hoisted(() => ({
  stateRef: {
    current: {} as any,
  },
}));

vi.mock('react-redux', async () => {
  const actual =
    await vi.importActual<typeof import('react-redux')>('react-redux');
  return {
    ...actual,
    useStore: () => ({
      getState: () => stateRef.current,
    }),
  };
});

describe('features/validate-node-connection', () => {
  it('accepts compatible input/output types', () => {
    stateRef.current = {
      graph: {
        nodeDataByID: {
          source: { name: 'SourceNode' },
          target: { name: 'TargetNode' },
        },
      },
      nodeDefinition: {
        nodesDefinitionsMap: {
          SourceNode: {
            input_definitions: {},
            output_definitions: {
              main: { attr_name: 'main', type: 'STRING' },
            },
          },
          TargetNode: {
            input_definitions: {
              input: { attr_name: 'input', type: 'STRING' },
            },
            output_definitions: {},
          },
        },
      },
    };

    const { result } = renderHook(() => useNodeConnectionValidation());

    expect(
      result.current.isValidConnection({
        source: 'source',
        target: 'target',
        sourceHandle: 'output-main',
        targetHandle: 'input-input',
      } as any)
    ).toBe(true);
  });

  it('rejects incompatible input/output types', () => {
    stateRef.current = {
      graph: {
        nodeDataByID: {
          source: { name: 'SourceNode' },
          target: { name: 'TargetNode' },
        },
      },
      nodeDefinition: {
        nodesDefinitionsMap: {
          SourceNode: {
            input_definitions: {},
            output_definitions: {
              main: { attr_name: 'main', type: 'STRING' },
            },
          },
          TargetNode: {
            input_definitions: {
              input: { attr_name: 'input', type: 'INT' },
            },
            output_definitions: {},
          },
        },
      },
    };

    const { result } = renderHook(() => useNodeConnectionValidation());

    expect(
      result.current.isValidConnection({
        source: 'source',
        target: 'target',
        sourceHandle: 'output-main',
        targetHandle: 'input-input',
      } as any)
    ).toBe(false);
  });

  it('accepts SIGNAL ports resolved by mapping keys', () => {
    stateRef.current = {
      graph: {
        nodeDataByID: {
          source: { name: 'SignalSourceNode' },
          target: { name: 'SignalTargetNode' },
        },
      },
      nodeDefinition: {
        nodesDefinitionsMap: {
          SignalSourceNode: {
            input_definitions: {},
            output_definitions: {
              signal_out: { attr_name: 'signal_out', type: 'SIGNAL' },
            },
          },
          SignalTargetNode: {
            input_definitions: {
              signal_in: { attr_name: 'signal_in', type: 'SIGNAL' },
            },
            output_definitions: {},
          },
        },
      },
    };

    const { result } = renderHook(() => useNodeConnectionValidation());

    expect(
      result.current.isValidConnection({
        source: 'source',
        target: 'target',
        sourceHandle: 'output-signal_out',
        targetHandle: 'input-signal_in',
      } as any)
    ).toBe(true);
  });

  it('accepts composite io strings that include the source type', () => {
    stateRef.current = {
      graph: {
        nodeDataByID: {
          source: { name: 'SmbSourceNode' },
          target: { name: 'FileTargetNode' },
        },
      },
      nodeDefinition: {
        nodesDefinitionsMap: {
          SmbSourceNode: {
            input_definitions: {},
            output_definitions: {
              connection: {
                attr_name: 'connection',
                type: 'SMB_CONNECTION',
              },
            },
          },
          FileTargetNode: {
            input_definitions: {
              connection: {
                attr_name: 'connection',
                type: 'S3_CONNECTION,FTP_CONNECTION,SMB_CONNECTION',
              },
            },
            output_definitions: {},
          },
        },
      },
    };

    const { result } = renderHook(() => useNodeConnectionValidation());

    expect(
      result.current.isValidConnection({
        source: 'source',
        target: 'target',
        sourceHandle: 'output-connection',
        targetHandle: 'input-connection',
      } as any)
    ).toBe(true);
  });
});
