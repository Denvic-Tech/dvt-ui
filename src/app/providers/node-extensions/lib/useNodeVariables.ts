import { useEffect, useMemo } from 'react';
import { type Edge, useStore } from '@xyflow/react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import { selectNodeDefinitionsMap } from '@/entities/node/node-definition';
import { fetchProjectVariables } from '@/entities/project/projects/model/slice';
import { CustomNodeData } from '@/entities/project-editor/graph';

import {
  type NodeDefinition,
  type NodeMetadata,
  type ProjectVariableRead,
  type VariableDescriptorMetadata,
} from '@/shared/gatewayClient';
import {
  getConstValue,
  getSingleVariableNameFromValue,
  isExpressionValue,
} from '@/shared/lib/node-input-values';
import {
  createVariableOutput,
  isUnsetDefaultValue,
  projectVariableReadsToOutputs,
  VARIABLE_TYPE_VALUES,
  type VariableOutput,
  type VariableType,
} from '@/shared/lib/variables';

const VARIABLES_TARGET_HANDLE = 'input-input_variables';
const OUTPUT_VARIABLES_METADATA_KEY = 'output_variables';
const EMPTY_EDGES: Edge[] = [];
const EMPTY_NODE_DATA_BY_ID: Record<string, CustomNodeData> = {};
const EMPTY_NODE_METADATA_BY_ID: Record<string, NodeMetadata> = {};
const EMPTY_NODE_DEFINITIONS_MAP: Record<string, NodeDefinition> = {};
const EMPTY_PROJECT_VARIABLE_READS: ProjectVariableRead[] = [];
const EMPTY_VARIABLES: VariableOutput[] = [];

export type NodeVariableGroups = {
  inputVariables: VariableOutput[];
  projectVariables: VariableOutput[];
  variables: VariableOutput[];
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const asVariableType = (value: unknown): VariableType | null => {
  if (typeof value !== 'string') return null;
  return (VARIABLE_TYPE_VALUES as readonly string[]).includes(value)
    ? (value as VariableType)
    : null;
};

const parseVariableValue = (
  type: VariableType,
  raw: unknown
): VariableOutput['value'] | undefined => {
  if (raw === null) {
    return null;
  }

  if (raw === undefined) {
    return undefined;
  }

  switch (type) {
    case 'STRING':
      return typeof raw === 'string' ? raw : String(raw);
    case 'BOOLEAN':
      return typeof raw === 'boolean' ? raw : Boolean(raw);
    case 'INT': {
      const n = typeof raw === 'number' ? raw : Number(raw);
      if (!Number.isFinite(n)) return undefined;
      return Math.trunc(n);
    }
    case 'FLOAT': {
      const n = typeof raw === 'number' ? raw : Number(raw);
      if (!Number.isFinite(n)) return undefined;
      return n;
    }
    case 'DICT': {
      if (isObjectRecord(raw) && !Array.isArray(raw)) {
        return raw;
      }
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          return isObjectRecord(parsed) && !Array.isArray(parsed)
            ? parsed
            : undefined;
        } catch {
          return undefined;
        }
      }
      return undefined;
    }
    case 'JSON': {
      if (Array.isArray(raw)) {
        return raw;
      }
      if (isObjectRecord(raw)) {
        return raw;
      }
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) || isObjectRecord(parsed)) {
            return parsed;
          }
        } catch {
          return undefined;
        }
      }
      return undefined;
    }
    case 'DATETIME': {
      if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
        return raw;
      }
      if (typeof raw === 'string' || typeof raw === 'number') {
        const d = new Date(raw);
        if (!Number.isNaN(d.getTime())) return d;
      }
      return undefined;
    }
    case 'TIMEDELTA':
      return typeof raw === 'string' ? raw : String(raw);
    default:
      return undefined;
  }
};

const resolveValuePolicyPreview = ({
  defaultIsSet,
  defaultRaw,
  nullable,
  resolvedValue,
  type,
}: {
  defaultIsSet: boolean;
  defaultRaw: unknown;
  nullable: boolean;
  resolvedValue: unknown;
  type: VariableType;
}): VariableOutput['value'] | undefined => {
  if (resolvedValue !== null) {
    return parseVariableValue(type, resolvedValue);
  }

  if (defaultIsSet) {
    return parseVariableValue(type, defaultRaw);
  }

  if (nullable) {
    return null;
  }

  return undefined;
};

const hasConfiguredDefault = (
  payload: Record<string, unknown> | undefined,
  defaultRaw: unknown
): boolean =>
  Boolean(
    payload &&
    Object.prototype.hasOwnProperty.call(payload, 'default') &&
    !isUnsetDefaultValue(defaultRaw)
  );

const upsertVariables = (
  target: Map<string, VariableOutput>,
  variables: Iterable<VariableOutput>,
  overwrite = true
) => {
  for (const variable of variables) {
    if (!overwrite && target.has(variable.name)) {
      continue;
    }
    target.set(variable.name, variable);
  }
};

const collectCreateVariableOutput = (
  nodeData: CustomNodeData
): VariableOutput[] => {
  const inputValues = nodeData.inputValues;
  if (!inputValues) {
    return [];
  }

  const name = getConstValue<string>(inputValues['name'])?.trim() ?? '';
  const type = asVariableType(getConstValue(inputValues['type']));
  if (!name || !type) {
    return [];
  }

  const rawValue = inputValues['value'];
  const valueIsExpression = isExpressionValue(rawValue);
  const defaultRaw = getConstValue(inputValues['default']);
  const parsedValue = valueIsExpression
    ? undefined
    : resolveValuePolicyPreview({
        type,
        resolvedValue: getConstValue(rawValue),
        nullable: Boolean(getConstValue(inputValues['nullable'])),
        defaultRaw,
        defaultIsSet: hasConfiguredDefault(inputValues, defaultRaw),
      });

  return [
    createVariableOutput({
      name,
      type,
      scope: 'user',
      source: 'create_variable',
      sourceLabel: nodeData.displayName || 'Create Variable',
      ...(parsedValue !== undefined ? { value: parsedValue } : {}),
    }),
  ];
};

const collectManageVariablesOutput = (
  nodeData: CustomNodeData,
  inheritedVariables: Map<string, VariableOutput>
): VariableOutput[] => {
  const rawDefinedVariables = getConstValue(
    nodeData.inputValues?.['defined_variables']
  );
  if (!isObjectRecord(rawDefinedVariables)) {
    return Array.from(inheritedVariables.values());
  }

  const result = new Map(inheritedVariables);

  for (const [name, payload] of Object.entries(rawDefinedVariables)) {
    if (!name.trim() || !isObjectRecord(payload)) {
      continue;
    }

    const type = asVariableType(payload['type']);
    if (!type) {
      continue;
    }

    const explicitValue = payload['value'];
    const rawInput = payload['value_input'];
    const defaultRaw = payload['default'];
    const linkedVariableName = getSingleVariableNameFromValue(rawInput);
    const linkedValue = linkedVariableName
      ? inheritedVariables.get(linkedVariableName)?.value
      : undefined;
    const nextValue = resolveValuePolicyPreview({
      type,
      resolvedValue:
        payload['value_input'] !== undefined ? linkedValue : explicitValue,
      nullable: Boolean(payload['nullable']),
      defaultRaw,
      defaultIsSet: hasConfiguredDefault(payload, defaultRaw),
    });

    const nextVariableArgs: Parameters<typeof createVariableOutput>[0] = {
      name,
      type,
      scope: 'user',
      source: 'manage_variables',
      sourceLabel: nodeData.displayName || 'Manage Variables',
    };
    if (nextValue !== undefined) {
      nextVariableArgs.value = nextValue;
    }

    result.set(name, createVariableOutput(nextVariableArgs));
  }

  return Array.from(result.values());
};

const collectMetadataVariableOutputs = ({
  nodeData,
  nodeMetadata,
}: {
  nodeData?: CustomNodeData;
  nodeMetadata?: NodeMetadata;
}): VariableOutput[] => {
  const outputVariablesMetadata = nodeMetadata?.[OUTPUT_VARIABLES_METADATA_KEY];
  if (
    !outputVariablesMetadata ||
    outputVariablesMetadata.type !== 'VARIABLE_MAP' ||
    !Array.isArray(outputVariablesMetadata.variables)
  ) {
    return [];
  }

  const sourceLabel = nodeData?.displayName || nodeData?.name;

  return outputVariablesMetadata.variables.flatMap(
    (descriptor: VariableDescriptorMetadata) => {
      const name = descriptor.name?.trim() ?? '';
      const type = asVariableType(descriptor.type);
      if (!name || !type) {
        return [];
      }

      return [
        createVariableOutput({
          name,
          type,
          scope: descriptor.var_type === 'system' ? 'system' : 'user',
          source: 'linked',
          ...(sourceLabel ? { sourceLabel } : {}),
        }),
      ];
    }
  );
};

const collectLinkedVariables = ({
  nodeID,
  edges,
  nodeDataByID,
  nodeMetadataByID,
  visited,
}: {
  nodeID: string;
  edges: Edge[];
  nodeDataByID: Record<string, CustomNodeData>;
  nodeMetadataByID: Record<string, NodeMetadata>;
  visited: Set<string>;
}): Map<string, VariableOutput> => {
  if (visited.has(nodeID)) {
    return new Map();
  }

  visited.add(nodeID);

  const incomingVariableEdges = edges.filter(
    edge =>
      edge.target === nodeID && edge.targetHandle === VARIABLES_TARGET_HANDLE
  );

  const inheritedVariables = new Map<string, VariableOutput>();
  for (const edge of incomingVariableEdges) {
    if (!edge.source) {
      continue;
    }

    upsertVariables(
      inheritedVariables,
      collectLinkedVariables({
        nodeID: edge.source,
        edges,
        nodeDataByID,
        nodeMetadataByID,
        visited,
      }).values()
    );
  }

  const nodeData = nodeDataByID[nodeID];
  const nodeMetadata = nodeMetadataByID[nodeID];
  if (!nodeData) {
    upsertVariables(
      inheritedVariables,
      collectMetadataVariableOutputs({ nodeMetadata })
    );
    return inheritedVariables;
  }

  if (nodeData.name === 'CreateVariable') {
    upsertVariables(inheritedVariables, collectCreateVariableOutput(nodeData));
    return inheritedVariables;
  }

  if (nodeData.name === 'ManageVariables') {
    return new Map(
      collectManageVariablesOutput(nodeData, inheritedVariables).map(
        variable => [variable.name, variable]
      )
    );
  }

  upsertVariables(
    inheritedVariables,
    collectMetadataVariableOutputs({ nodeData, nodeMetadata })
  );

  return inheritedVariables;
};

const collectSystemVariables = ({
  nodeID,
  edges,
  nodeDataByID,
  nodeDefinitionsMap,
}: {
  nodeID: string;
  edges: Edge[];
  nodeDataByID: Record<string, CustomNodeData>;
  nodeDefinitionsMap: Record<string, NodeDefinition>;
}): VariableOutput[] => {
  const resultByName = new Map<string, VariableOutput>();

  const incomingSourceIDs = new Set(
    edges.filter(edge => edge.target === nodeID).map(edge => edge.source)
  );

  for (const sourceID of incomingSourceIDs) {
    if (!sourceID) continue;

    const sourceNodeData = nodeDataByID[sourceID];
    const sourceDefinition = sourceNodeData?.name
      ? nodeDefinitionsMap[sourceNodeData.name]
      : undefined;
    const systemVariables = sourceDefinition?.system_variable_definitions ?? {};

    for (const [name, definition] of Object.entries(systemVariables)) {
      const type = asVariableType(definition.type);
      if (!type || resultByName.has(name)) {
        continue;
      }

      const systemVariableArgs: Parameters<typeof createVariableOutput>[0] = {
        name,
        type,
        scope: 'system',
        source: 'system',
      };
      const sourceLabel =
        sourceNodeData?.displayName || sourceDefinition?.display_name;
      if (sourceLabel) {
        systemVariableArgs.sourceLabel = sourceLabel;
      }

      resultByName.set(name, createVariableOutput(systemVariableArgs));
    }
  }

  return Array.from(resultByName.values());
};

const sortVariables = (variables: VariableOutput[]): VariableOutput[] =>
  [...variables].sort((left, right) => {
    if (left.scope !== right.scope) {
      return left.scope.localeCompare(right.scope);
    }
    return left.name.localeCompare(right.name);
  });

/**
 * Best-effort variable resolver for extension components.
 * Keeps project variables separate from variables received from upstream nodes.
 */
export function useNodeVariableGroups(
  nodeID: string | null | undefined,
  options?: { enabled?: boolean }
): NodeVariableGroups {
  const enabled = options?.enabled ?? true;
  const dispatch = useAppDispatch();
  const edges = useStore(state =>
    enabled ? (state.edges as Edge[]) : EMPTY_EDGES
  );
  const nodeDataByID = useAppSelector(state =>
    enabled ? state.graph.nodeDataByID : EMPTY_NODE_DATA_BY_ID
  );
  const nodeMetadataByID = useAppSelector(state =>
    enabled ? state.nodeMetadata.nodeMetadataByID : EMPTY_NODE_METADATA_BY_ID
  );
  const nodeDefinitionsMap = useAppSelector(state =>
    enabled ? selectNodeDefinitionsMap(state) : EMPTY_NODE_DEFINITIONS_MAP
  );
  const selectedProjectID = useAppSelector(state =>
    enabled ? (state.projects.selectedProject?.id ?? null) : null
  );
  const projectVariableReads = useAppSelector(state =>
    enabled && selectedProjectID
      ? (state.projects.projectVariablesByProjectId[selectedProjectID] ??
        EMPTY_PROJECT_VARIABLE_READS)
      : EMPTY_PROJECT_VARIABLE_READS
  );
  const projectVariablesStatus = useAppSelector(state =>
    enabled && selectedProjectID
      ? (state.projects.projectVariablesStatusByProjectId[selectedProjectID] ??
        'idle')
      : 'idle'
  );

  useEffect(() => {
    if (!enabled || !selectedProjectID || projectVariablesStatus !== 'idle') {
      return;
    }

    void dispatch(fetchProjectVariables(selectedProjectID));
  }, [dispatch, enabled, projectVariablesStatus, selectedProjectID]);

  const projectVariables = useMemo(
    () => projectVariableReadsToOutputs(projectVariableReads),
    [projectVariableReads]
  );

  const linkedVariables = useMemo(() => {
    if (!enabled || !nodeID) {
      return EMPTY_VARIABLES;
    }

    return Array.from(
      collectLinkedVariables({
        nodeID,
        edges,
        nodeDataByID,
        nodeMetadataByID,
        visited: new Set<string>(),
      }).values()
    );
  }, [edges, enabled, nodeDataByID, nodeID, nodeMetadataByID]);

  const systemVariables = useMemo(() => {
    if (!enabled || !nodeID) {
      return EMPTY_VARIABLES;
    }

    return collectSystemVariables({
      nodeID,
      edges,
      nodeDataByID,
      nodeDefinitionsMap,
    });
  }, [edges, enabled, nodeDataByID, nodeDefinitionsMap, nodeID]);

  return useMemo(() => {
    const inputVariablesByName = new Map<string, VariableOutput>();
    upsertVariables(inputVariablesByName, linkedVariables);
    upsertVariables(inputVariablesByName, systemVariables, false);

    const resultByName = new Map<string, VariableOutput>();

    upsertVariables(resultByName, projectVariables);
    upsertVariables(resultByName, linkedVariables);
    upsertVariables(resultByName, systemVariables, false);

    return {
      inputVariables: sortVariables(Array.from(inputVariablesByName.values())),
      projectVariables: sortVariables(projectVariables),
      variables: sortVariables(Array.from(resultByName.values())),
    };
  }, [linkedVariables, projectVariables, systemVariables]);
}

/**
 * Backward-compatible merged variable resolver.
 */
export function useNodeVariables(
  nodeID: string | null | undefined,
  options?: { enabled?: boolean }
): VariableOutput[] {
  return useNodeVariableGroups(nodeID, options).variables;
}
