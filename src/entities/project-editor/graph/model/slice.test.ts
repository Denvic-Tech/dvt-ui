import { describe, expect, it } from 'vitest';

import { graphActions, graphReducer } from '@/entities/project-editor/graph';

describe('graph slice replaceInputValues', () => {
  it('replaces node inputValues instead of merging stale keys', () => {
    const initialState = graphReducer(undefined, { type: 'init' });
    const stateWithNode = graphReducer(
      initialState,
      graphActions.setGraph({
        nodes: [
          {
            id: 'node-1',
            type: 'customNode',
            position: { x: 0, y: 0 },
            data: {
              name: 'LoadCSV',
              inputValues: {
                connection: {
                  __dvt_type: 'const',
                  value: { type: 'dvt_service_files' },
                },
                path: {
                  __dvt_type: 'const',
                  value: 'data.csv',
                },
              },
            },
          } as any,
        ],
        edges: [],
        subgraphs: [],
      })
    );

    const nextState = graphReducer(
      stateWithNode,
      graphActions.replaceInputValues({
        nodeID: 'node-1',
        inputValues: {
          delimiter: {
            __dvt_type: 'const',
            value: ';',
          },
        },
      })
    );

    expect(nextState.nodeDataByID['node-1'].inputValues).toEqual({
      delimiter: {
        __dvt_type: 'const',
        value: ';',
      },
    });
    expect(nextState.nodesByID['node-1'].data.inputValues).toEqual({
      delimiter: {
        __dvt_type: 'const',
        value: ';',
      },
    });
  });
});
