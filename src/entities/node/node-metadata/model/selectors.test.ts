import { describe, expect, it } from 'vitest';

import type { RootState } from '@/app/providers/store';

import type { Input } from '@/entities/project-editor/graph';

import { makeConnectedMetadataByInputNameSelector } from './selectors';

const connectedInputs = {
  connection: {
    nodeID: 'connection-node',
    outputName: 'connection',
  } as Input,
};

const makeState = (actual: boolean) =>
  ({
    nodeMetadata: {
      nodeMetadataByID: {
        'connection-node': {
          connection: {
            type: 'DATABASE',
            connection_id: 'connection-1',
            dialect: 'postgresql',
            databases: [],
            schemas: [],
            tables: [],
          },
        },
      },
      nodeMetadataActuality: {
        'connection-node': actual,
      },
    },
  }) as unknown as RootState;

describe('makeConnectedMetadataByInputNameSelector', () => {
  it('returns actual connected metadata', () => {
    const selector = makeConnectedMetadataByInputNameSelector();

    expect(selector(makeState(true), connectedInputs)).toMatchObject({
      connection: { connection_id: 'connection-1' },
    });
  });

  it('does not expose stale connected metadata', () => {
    const selector = makeConnectedMetadataByInputNameSelector();

    expect(selector(makeState(false), connectedInputs)).toEqual({});
  });
});
