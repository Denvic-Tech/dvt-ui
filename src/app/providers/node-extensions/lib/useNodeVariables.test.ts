import { renderHook } from '@testing-library/react';
import type { Edge } from '@xyflow/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { NodeMetadata, ProjectVariableRead } from '@/shared/gatewayClient';
import { makeConst } from '@/shared/lib/node-input-values';
import { DEFAULT_UNSET_SENTINEL } from '@/shared/lib/variables';

import { useNodeVariableGroups, useNodeVariables } from './useNodeVariables';

let mockEdges: Edge[] = [];
const mockDispatch = vi.fn();
let mockState: Record<string, unknown> = {};

vi.mock('@xyflow/react', () => ({
  useStore: (selector: (state: { edges: Edge[] }) => unknown) =>
    selector({ edges: mockEdges }),
}));

vi.mock('@/app/providers/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: Record<string, unknown>) => unknown) =>
    selector(mockState),
}));

vi.mock('@/entities/node/node-definition', () => ({
  selectNodeDefinitionsMap: (state: Record<string, unknown>) =>
    state['__nodeDefinitionsMap'] ?? {},
}));

describe('useNodeVariables', () => {
  beforeEach(() => {
    mockDispatch.mockReset();
    mockEdges = [
      {
        id: 'edge-manage',
        source: 'node-manage',
        target: 'node-target',
        targetHandle: 'input-input_variables',
      } as Edge,
      {
        id: 'edge-metadata',
        source: 'node-select',
        target: 'node-target',
        targetHandle: 'input-input_variables',
      } as Edge,
    ];

    mockState = {
      __nodeDefinitionsMap: {},
      graph: {
        nodeDataByID: {
          'node-create': {
            id: 'node-create',
            name: 'CreateVariable',
            displayName: 'Create var',
            inputValues: {
              name: makeConst('nullable_string'),
              type: makeConst('STRING'),
              value: makeConst(null),
              nullable: makeConst(true),
              default: makeConst(DEFAULT_UNSET_SENTINEL),
            },
          },
          'node-manage': {
            id: 'node-manage',
            name: 'ManageVariables',
            displayName: 'Manage vars',
            inputValues: {
              defined_variables: makeConst({
                b24_hook: {
                  type: 'STRING',
                  value: 'https://example.test',
                  default: DEFAULT_UNSET_SENTINEL,
                },
                nullable_with_default: {
                  type: 'INT',
                  value: null,
                  nullable: false,
                  default: 10,
                },
                nullable_without_default: {
                  type: 'STRING',
                  value: null,
                  nullable: true,
                  default: DEFAULT_UNSET_SENTINEL,
                },
                unresolved_without_policy: {
                  type: 'STRING',
                  value: null,
                  nullable: false,
                  default: DEFAULT_UNSET_SENTINEL,
                },
              }),
            },
          },
          'node-select': {
            id: 'node-select',
            name: 'DataFrameSelectVariables',
            displayName: 'Select vars',
            inputValues: {},
          },
          'node-target': {
            id: 'node-target',
            name: 'ReadDataFromBitrix24',
            displayName: 'Read B24',
            inputValues: {},
          },
        },
      },
      nodeMetadata: {
        nodeMetadataByID: {
          'node-select': {
            output_variables: {
              type: 'VARIABLE_MAP',
              variables: [
                {
                  name: 'last_dt',
                  type: 'DATETIME',
                  var_type: 'user',
                  value_state: 'unresolved',
                },
              ],
            },
          } satisfies NodeMetadata,
        },
      },
      projects: {
        projectVariablesByProjectId: {},
        projectVariablesStatusByProjectId: {},
        selectedProject: null,
      },
    };
  });

  it('merges manage variables with upstream output_variables metadata', () => {
    const { result } = renderHook(() => useNodeVariables('node-target'));

    expect(result.current).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'b24_hook',
          source: 'manage_variables',
          type: 'STRING',
        }),
        expect.objectContaining({
          name: 'last_dt',
          source: 'linked',
          sourceLabel: 'Select vars',
          type: 'DATETIME',
        }),
        expect.objectContaining({
          name: 'nullable_with_default',
          source: 'manage_variables',
          type: 'INT',
          value: 10,
        }),
        expect.objectContaining({
          name: 'nullable_without_default',
          source: 'manage_variables',
          type: 'STRING',
          value: null,
        }),
        expect.objectContaining({
          name: 'unresolved_without_policy',
          source: 'manage_variables',
          type: 'STRING',
          value: null,
        }),
      ])
    );
  });

  it('preserves explicit nullable null for create_variable preview', () => {
    mockEdges = [
      {
        id: 'edge-create',
        source: 'node-create',
        target: 'node-target',
        targetHandle: 'input-input_variables',
      } as Edge,
    ];

    const { result } = renderHook(() => useNodeVariables('node-target'));

    expect(result.current).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'nullable_string',
          source: 'create_variable',
          type: 'STRING',
          value: null,
        }),
      ])
    );
  });

  it('preserves JSON array values from CreateVariable', () => {
    mockState = {
      ...mockState,
      graph: {
        nodeDataByID: {
          ...(
            mockState['graph'] as {
              nodeDataByID: Record<string, unknown>;
            }
          ).nodeDataByID,
          'node-create-json': {
            id: 'node-create-json',
            name: 'CreateVariable',
            displayName: 'Create JSON var',
            inputValues: {
              name: makeConst('json_array'),
              type: makeConst('JSON'),
              value: makeConst(['one', 'two']),
              nullable: makeConst(false),
              default: makeConst(DEFAULT_UNSET_SENTINEL),
            },
          },
        },
      },
    };
    mockEdges = [
      {
        id: 'edge-create-json',
        source: 'node-create-json',
        target: 'node-target',
        targetHandle: 'input-input_variables',
      } as Edge,
    ];

    const { result } = renderHook(() => useNodeVariables('node-target'));

    expect(result.current).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'json_array',
          type: 'JSON',
          value: ['one', 'two'],
        }),
      ])
    );
  });

  it('uses typed project variable response without inferring type from value', () => {
    mockState = {
      ...mockState,
      projects: {
        projectVariablesByProjectId: {
          'project-1': [
            {
              key: 'stringified_limit',
              type: 'STRING',
              value: ['2026-04-27T10:30:00Z'],
              is_list_type: true,
            },
          ] satisfies ProjectVariableRead[],
        },
        projectVariablesStatusByProjectId: {
          'project-1': 'ready',
        },
        selectedProject: {
          id: 'project-1',
        },
      },
    };

    const { result } = renderHook(() => useNodeVariables('node-target'));

    expect(result.current).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'stringified_limit',
          source: 'project',
          type: 'STRING',
          value: ['2026-04-27T10:30:00Z'],
          isListType: true,
        }),
      ])
    );
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('keeps matching input and project variable names in separate groups', () => {
    mockState = {
      ...mockState,
      projects: {
        projectVariablesByProjectId: {
          'project-1': [
            {
              key: 'b24_hook',
              type: 'STRING',
              value: 'project-value',
              is_list_type: false,
            },
          ] satisfies ProjectVariableRead[],
        },
        projectVariablesStatusByProjectId: {
          'project-1': 'ready',
        },
        selectedProject: {
          id: 'project-1',
        },
      },
    };

    const { result } = renderHook(() => useNodeVariableGroups('node-target'));

    expect(result.current.inputVariables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'b24_hook',
          source: 'manage_variables',
        }),
      ])
    );
    expect(result.current.projectVariables).toEqual([
      expect.objectContaining({
        name: 'b24_hook',
        source: 'project',
        value: 'project-value',
      }),
    ]);
    expect(
      result.current.variables.find(variable => variable.name === 'b24_hook')
        ?.source
    ).toBe('manage_variables');
  });
});
