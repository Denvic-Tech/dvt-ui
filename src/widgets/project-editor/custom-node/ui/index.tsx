import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  type NodeProps,
  useStore,
  useUpdateNodeInternals,
} from '@xyflow/react';

import {
  useNodeContentExtensions,
  useNodeHeaderDescriptionExtensions,
  useNodeInputDefinitionExtensions,
  useNodeModalExtensions,
  useNodeModalStepperExtensions,
  useNodeVariableGroups,
} from '@/app/providers/node-extensions';

import { useNodeConnections } from '@/features/node/get-node-connections';
import { useNodeDefinition } from '@/features/node/get-node-definition';
import { useConnectedNodeMetadata } from '@/features/node/get-node-metadata';
import { useNodeData } from '@/features/node/manage-node-data';
import { useGraphNodeSearchNodeState } from '@/features/project-editor/graph-node-search';

import {
  useNodeExecutionErrorMessage,
  useNodeExecutionStatus,
} from '@/entities/node/node-execution-status';
import { requiresConnectedNodeMetadata } from '@/entities/node/node-io';
import { CustomNodeType } from '@/entities/project-editor/graph';
import { useNodeContextMenuActions } from '@/entities/project-editor/node-context-menu';

import type {
  InputDefinitionModel,
  OutputDefinitionModel,
} from '@/shared/gatewayClient';

import { useNodeConnectionReveal } from '../model/connectionReveal';
import {
  hasIoType,
  useCustomNodeInputsOutputs,
} from '../model/useCustomNodeInputsOutputs';

import { getNodeStyles, getNodeWrapperStyles } from './styles';
import { CustomNodeView } from './view';

const COMPACT_NODE_ZOOM = 0.45;

export interface CustomNodeProps extends NodeProps<CustomNodeType> {
  onOutputContextMenu?: (
    e: React.MouseEvent,
    nodeId: string,
    handleId: string,
    type: any
  ) => void;
  onInputContextMenu?: (
    e: React.MouseEvent,
    nodeId: string,
    handleId: string,
    type: any
  ) => void;
  onSelectedGroupContextMenu?: (e: React.MouseEvent, nodeId: string) => boolean;
}

const EMPTY_SET: ReadonlySet<string> = new Set();
const EMPTY_INPUT_DEFINITIONS: InputDefinitionModel[] = [];
const EMPTY_OUTPUT_DEFINITIONS: OutputDefinitionModel[] = [];

const CustomNode_: React.FC<CustomNodeProps> = props => {
  const {
    id: nodeID,
    selected,
    data,
    onOutputContextMenu,
    onInputContextMenu,
    onSelectedGroupContextMenu,
  } = props;

  const theme = useTheme();
  const subgraphHeaderColor = useMemo(() => {
    const value = data?.['subgraphHeaderColor'];
    return typeof value === 'string' ? value : null;
  }, [data]);

  const { nodeData, updateDisplayName, updateInputValue } = useNodeData(nodeID);
  const nodeExecutionStatus = useNodeExecutionStatus(nodeID);
  const nodeExecutionErrorMessage = useNodeExecutionErrorMessage(nodeID);
  const nodeDefinition = useNodeDefinition(nodeData?.name);
  const { open: openContextMenu } = useNodeContextMenuActions();

  const { connectedInputs, connectedOutputs } = useNodeConnections(nodeID);
  const {
    connectedNodeMetadataByInput,
    connectedNodeMetadataActualityByInput,
  } = useConnectedNodeMetadata(nodeID);

  const zoom = useStore(state => state.transform?.[2] ?? 1);
  const isCompactView = zoom <= COMPACT_NODE_ZOOM;
  const updateNodeInternals = useUpdateNodeInternals();

  const inputDefinitions = useMemo(
    () =>
      Object.values(nodeDefinition?.input_definitions ?? {}) ??
      EMPTY_INPUT_DEFINITIONS,
    [nodeDefinition?.input_definitions]
  );
  const outputDefinitions = useMemo(
    () =>
      Object.values(nodeDefinition?.output_definitions ?? {}) ??
      EMPTY_OUTPUT_DEFINITIONS,
    [nodeDefinition?.output_definitions]
  );

  const inputDefinitionsByAttrName = useMemo(() => {
    const next = new Map<string, InputDefinitionModel>();
    inputDefinitions.forEach(definition => {
      next.set(definition.attr_name, definition);
    });
    return next;
  }, [inputDefinitions]);

  const outputDefinitionsByAttrName = useMemo(() => {
    const next = new Map<string, OutputDefinitionModel>();
    outputDefinitions.forEach(definition => {
      next.set(definition.attr_name, definition);
    });
    return next;
  }, [outputDefinitions]);

  const connectedInputNamesSet = useMemo<ReadonlySet<string>>(() => {
    if (!connectedInputs) {
      return EMPTY_SET;
    }
    return new Set(Object.keys(connectedInputs));
  }, [connectedInputs]);

  const connectedOutputNamesSet = useMemo<ReadonlySet<string>>(() => {
    if (!connectedOutputs) {
      return EMPTY_SET;
    }
    return new Set(Object.keys(connectedOutputs));
  }, [connectedOutputs]);

  const getInputValue = useCallback(
    (inputName: string) => nodeData?.inputValues[inputName],
    [nodeData?.inputValues]
  );

  const connectedInputsRequiringMetadata = useMemo(() => {
    if (!connectedInputs) {
      return null;
    }

    const entries = Object.entries(connectedInputs).filter(([inputName]) => {
      const inputDefinition = inputDefinitionsByAttrName.get(inputName);
      return inputDefinition
        ? requiresConnectedNodeMetadata(inputDefinition)
        : true;
    });

    if (entries.length === 0) {
      return null;
    }

    return Object.fromEntries(entries);
  }, [connectedInputs, inputDefinitionsByAttrName]);

  const metadataReadyForConnectedNodes = useMemo(() => {
    if (!connectedInputsRequiringMetadata) {
      return true;
    }

    const requiredInputNames = Object.keys(connectedInputsRequiringMetadata);
    if (requiredInputNames.length === 0) {
      return true;
    }

    if (
      !connectedNodeMetadataByInput ||
      !connectedNodeMetadataActualityByInput
    ) {
      return false;
    }

    return requiredInputNames.every(
      inputName =>
        Boolean(connectedNodeMetadataByInput[inputName]) &&
        Boolean(connectedNodeMetadataActualityByInput[inputName])
    );
  }, [
    connectedInputsRequiringMetadata,
    connectedNodeMetadataActualityByInput,
    connectedNodeMetadataByInput,
  ]);

  const showConnectedMetadataSkeleton = Boolean(
    connectedInputsRequiringMetadata && !metadataReadyForConnectedNodes
  );

  const { searchMatch, searchActive, matchesDisplayName, matchesNodeID } =
    useGraphNodeSearchNodeState(nodeID, nodeData?.displayName);

  const storeEnabledDefault = useMemo(
    () => nodeDefinition?.input_definitions?.['store_enabled']?.default,
    [nodeDefinition?.input_definitions]
  );
  const cacheEnabled = Boolean(
    nodeData?.storeEnabled ?? storeEnabledDefault ?? false
  );

  const nodeStyles = useMemo(
    () => getNodeStyles(theme, nodeExecutionStatus, selected, cacheEnabled),
    [cacheEnabled, nodeExecutionStatus, selected, theme]
  );
  const nodeWrapperStyles = useMemo(
    () => getNodeWrapperStyles(selected, searchMatch, searchActive),
    [searchActive, searchMatch, selected]
  );

  const normalizedNodeErrorMessage = useMemo(() => {
    if (typeof nodeExecutionErrorMessage !== 'string') {
      return '';
    }
    return nodeExecutionErrorMessage.trim();
  }, [nodeExecutionErrorMessage]);

  const contentTopExtensions = useNodeContentExtensions(
    'node_content_top',
    nodeDefinition
  );
  const contentBottomExtensions = useNodeContentExtensions(
    'node_content_bottom',
    nodeDefinition
  );
  const headerDescriptionExtensions =
    useNodeHeaderDescriptionExtensions(nodeDefinition);
  const inputDefinitionExtensions = useNodeInputDefinitionExtensions(
    nodeDefinition,
    'node'
  );
  const modalExtensions = useNodeModalExtensions(nodeDefinition);
  const modalStepperExtensions = useNodeModalStepperExtensions(nodeDefinition);
  const settingsEnabled =
    metadataReadyForConnectedNodes ||
    [...modalExtensions, ...modalStepperExtensions].some(
      extension => extension.allowOpenWithoutConnectedMetadata
    );

  const {
    connectionFromSpecialIoType,
    temporaryInputDefinitionsReveal,
    temporaryOutputDefinitionsReveal,
  } = useNodeConnectionReveal(nodeID);

  const shouldShowSignalInputDefinitions =
    Boolean(nodeData?.showSignalIo) ||
    (connectionFromSpecialIoType === 'SIGNAL' &&
      temporaryInputDefinitionsReveal);
  const shouldShowSignalOutputDefinitions =
    Boolean(nodeData?.showSignalIo) ||
    (connectionFromSpecialIoType === 'SIGNAL' &&
      temporaryOutputDefinitionsReveal);

  const shouldShowVariablesIO = nodeData?.showVariablesIo !== false;
  const shouldShowVariableInputDefinitions =
    shouldShowVariablesIO ||
    (connectionFromSpecialIoType === 'VARIABLE' &&
      temporaryInputDefinitionsReveal);
  const shouldShowVariableOutputDefinitions =
    shouldShowVariablesIO ||
    (connectionFromSpecialIoType === 'VARIABLE' &&
      temporaryOutputDefinitionsReveal);

  const {
    visibleInputDefinitions,
    variablesInputDefinition,
    visibleOutputDefinitions,
  } = useCustomNodeInputsOutputs({
    inputDefinitions,
    outputDefinitions,
    showSignalIO: Boolean(nodeData?.showSignalIo),
    showVariablesIO: shouldShowVariablesIO,
    showSignalInputDefinitions: shouldShowSignalInputDefinitions,
    showSignalOutputDefinitions: shouldShowSignalOutputDefinitions,
    showVariableInputDefinitions: shouldShowVariableInputDefinitions,
    showVariableOutputDefinitions: shouldShowVariableOutputDefinitions,
    connectedInputNamesSet,
    connectedOutputNamesSet,
  });

  const variablesInputName = variablesInputDefinition?.attr_name ?? null;
  const isVariablesConnected = useMemo(
    () =>
      Boolean(
        variablesInputName && connectedInputNamesSet.has(variablesInputName)
      ),
    [connectedInputNamesSet, variablesInputName]
  );

  const showVariablesPeek = useMemo(() => {
    if (!variablesInputDefinition) {
      return false;
    }

    return (
      isVariablesConnected ||
      (connectionFromSpecialIoType === 'VARIABLE' &&
        temporaryInputDefinitionsReveal)
    );
  }, [
    connectionFromSpecialIoType,
    isVariablesConnected,
    temporaryInputDefinitionsReveal,
    variablesInputDefinition,
  ]);

  const firstSignalInputIndex = useMemo(
    () =>
      visibleInputDefinitions.findIndex(inputDefinition =>
        hasIoType(inputDefinition.type, 'SIGNAL')
      ),
    [visibleInputDefinitions]
  );

  const inputDefinitionsBeforeSignal = useMemo(
    () =>
      firstSignalInputIndex === -1
        ? visibleInputDefinitions
        : visibleInputDefinitions.slice(0, firstSignalInputIndex),
    [firstSignalInputIndex, visibleInputDefinitions]
  );
  const signalInputDefinitions = useMemo(
    () =>
      firstSignalInputIndex === -1
        ? EMPTY_INPUT_DEFINITIONS
        : visibleInputDefinitions.slice(firstSignalInputIndex),
    [firstSignalInputIndex, visibleInputDefinitions]
  );

  const shouldResolveVariables =
    !isCompactView &&
    (inputDefinitionsBeforeSignal.length > 0 ||
      signalInputDefinitions.length > 0 ||
      showVariablesPeek ||
      inputDefinitionExtensions.size > 0 ||
      headerDescriptionExtensions.length > 0 ||
      contentTopExtensions.length > 0 ||
      contentBottomExtensions.length > 0);
  const { inputVariables, projectVariables, variables } = useNodeVariableGroups(
    nodeID,
    {
      enabled: shouldResolveVariables,
    }
  );

  const resolvedNodeDescription = useMemo(() => {
    if (!nodeDefinition || !nodeData) {
      return null;
    }

    for (const extension of headerDescriptionExtensions) {
      const nextDescription = extension.getHeaderDescription({
        nodeDefinition,
        data: nodeData,
        variables,
      });

      if (nextDescription === undefined) {
        continue;
      }

      return nextDescription;
    }

    return nodeDefinition.description ?? null;
  }, [headerDescriptionExtensions, nodeData, nodeDefinition, variables]);

  useEffect(() => {
    if (
      !showVariablesPeek &&
      !temporaryInputDefinitionsReveal &&
      !temporaryOutputDefinitionsReveal
    ) {
      return;
    }

    updateNodeInternals(nodeID);
    const timeoutId = window.setTimeout(() => updateNodeInternals(nodeID), 320);
    return () => window.clearTimeout(timeoutId);
  }, [
    nodeID,
    showVariablesPeek,
    temporaryInputDefinitionsReveal,
    temporaryOutputDefinitionsReveal,
    updateNodeInternals,
  ]);

  const handleOutputContextMenu = useCallback(
    (event: React.MouseEvent, outputName: string) => {
      if (!onOutputContextMenu) {
        return;
      }

      const outputDefinition = outputDefinitionsByAttrName.get(outputName);
      onOutputContextMenu(
        event,
        nodeID,
        `output-${outputName}`,
        outputDefinition?.type || 'unknown'
      );
    },
    [nodeID, onOutputContextMenu, outputDefinitionsByAttrName]
  );

  const handleInputContextMenu = useCallback(
    (event: React.MouseEvent, inputName: string) => {
      if (!onInputContextMenu) {
        return;
      }

      const inputDefinition = inputDefinitionsByAttrName.get(inputName);
      onInputContextMenu(
        event,
        nodeID,
        `input-${inputName}`,
        inputDefinition?.type || 'unknown'
      );
    },
    [inputDefinitionsByAttrName, nodeID, onInputContextMenu]
  );

  const handleContextMenu = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!nodeData || !nodeDefinition) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (selected && onSelectedGroupContextMenu) {
        const handled = onSelectedGroupContextMenu(event, nodeID);
        if (handled) {
          return;
        }
      }

      openContextMenu({
        position: { x: event.clientX, y: event.clientY },
        nodeID,
        nodeDefinition,
        nodeData,
      });
    },
    [
      nodeData,
      nodeDefinition,
      nodeID,
      onSelectedGroupContextMenu,
      openContextMenu,
      selected,
    ]
  );

  if (!nodeData || !nodeDefinition) {
    return <Typography>Error while node rendering</Typography>;
  }

  return (
    <CustomNodeView
      cacheEnabled={cacheEnabled}
      connectedInputNamesSet={connectedInputNamesSet}
      connectedOutputNamesSet={connectedOutputNamesSet}
      contentBottomExtensions={contentBottomExtensions}
      contentTopExtensions={contentTopExtensions}
      getInputValue={getInputValue}
      handleContextMenu={handleContextMenu}
      handleInputContextMenu={handleInputContextMenu}
      handleOutputContextMenu={handleOutputContextMenu}
      inputDefinitionExtensions={inputDefinitionExtensions}
      inputDefinitionsBeforeSignal={inputDefinitionsBeforeSignal}
      isCompactView={isCompactView}
      isVariablesConnected={isVariablesConnected}
      matchesDisplayName={matchesDisplayName}
      matchesNodeID={matchesNodeID}
      metadataReadyForConnectedNodes={metadataReadyForConnectedNodes}
      nodeData={nodeData}
      nodeDescription={resolvedNodeDescription}
      nodeDefinition={nodeDefinition}
      nodeExecutionErrorMessage={normalizedNodeErrorMessage}
      nodeExecutionStatus={nodeExecutionStatus}
      nodeID={nodeID}
      nodeProps={props}
      nodeStyles={nodeStyles}
      nodeWrapperStyles={nodeWrapperStyles}
      showConnectedMetadataSkeleton={showConnectedMetadataSkeleton}
      showVariablesPeek={showVariablesPeek}
      signalInputDefinitions={signalInputDefinitions}
      subgraphHeaderColor={subgraphHeaderColor}
      updateDisplayName={updateDisplayName}
      updateInputValue={updateInputValue}
      variables={variables}
      inputVariables={inputVariables}
      projectVariables={projectVariables}
      settingsEnabled={settingsEnabled}
      variablesInputDefinition={variablesInputDefinition}
      viewportZoom={zoom}
      visibleOutputDefinitions={visibleOutputDefinitions}
    />
  );
};

const areCustomNodePropsEqual = (
  prev: CustomNodeProps,
  next: CustomNodeProps
): boolean =>
  prev.id === next.id &&
  prev.selected === next.selected &&
  prev.data === next.data &&
  prev.onOutputContextMenu === next.onOutputContextMenu &&
  prev.onInputContextMenu === next.onInputContextMenu &&
  prev.onSelectedGroupContextMenu === next.onSelectedGroupContextMenu;

export const CustomNode = memo(CustomNode_, areCustomNodePropsEqual);
