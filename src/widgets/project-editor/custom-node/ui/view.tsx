import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Box, Divider, Paper, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { alpha, useTheme } from '@mui/material/styles';
import type { NodeProps } from '@xyflow/react';

import type {
  NodeContentExtension,
  NodeInputDefinitionExtension,
} from '@/app/providers/node-extensions';

import {
  CustomNodeData,
  CustomNodeType,
} from '@/entities/project-editor/graph';

import type {
  ExecutionStatus,
  InputDefinitionModel,
  NodeDefinition,
  NodeInputValue,
  OutputDefinitionModel,
} from '@/shared/gatewayClient';
import type { VariableOutput } from '@/shared/lib/variables';

import { CustomNodeHeader } from './header';
import { NodeErrorTooltip } from './helpers';
import { CustomNodeInput } from './input';
import { CustomNodeOutput } from './output';
import { skeletonShimmer } from './styles';
import { CustomNodeToolbar } from './toolbar';

interface CustomNodeProps extends NodeProps<CustomNodeType> {
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

interface CustomNodeViewProps {
  cacheEnabled: boolean;
  connectedInputNamesSet: ReadonlySet<string>;
  connectedOutputNamesSet: ReadonlySet<string>;
  contentBottomExtensions: NodeContentExtension[];
  contentTopExtensions: NodeContentExtension[];
  getInputValue: (inputName: string) => NodeInputValue | undefined;
  handleContextMenu: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleInputContextMenu: (event: React.MouseEvent, inputName: string) => void;
  handleOutputContextMenu: (
    event: React.MouseEvent,
    outputName: string
  ) => void;
  inputDefinitionExtensions: ReadonlyMap<string, NodeInputDefinitionExtension>;
  inputDefinitionsBeforeSignal: InputDefinitionModel[];
  isCompactView: boolean;
  isVariablesConnected: boolean;
  matchesDisplayName: boolean;
  matchesNodeID: boolean;
  metadataReadyForConnectedNodes: boolean;
  nodeData: CustomNodeData;
  nodeDescription: string | null;
  nodeDefinition: NodeDefinition;
  nodeExecutionErrorMessage: string;
  nodeExecutionStatus: ExecutionStatus;
  nodeID: string;
  nodeProps: CustomNodeProps;
  nodeStyles: SxProps<Theme>;
  nodeWrapperStyles: SxProps<Theme>;
  showConnectedMetadataSkeleton: boolean;
  showVariablesPeek: boolean;
  signalInputDefinitions: InputDefinitionModel[];
  subgraphHeaderColor: string | null;
  updateDisplayName: (displayName: string) => void;
  updateInputValue: (inputName: string, value: NodeInputValue) => void;
  variables: VariableOutput[];
  inputVariables: VariableOutput[];
  projectVariables: VariableOutput[];
  settingsEnabled: boolean;
  variablesInputDefinition: InputDefinitionModel | null;
  viewportZoom: number;
  visibleOutputDefinitions: OutputDefinitionModel[];
}

const CustomNodeView_: React.FC<CustomNodeViewProps> = ({
  cacheEnabled,
  connectedInputNamesSet,
  connectedOutputNamesSet,
  contentBottomExtensions,
  contentTopExtensions,
  getInputValue,
  handleContextMenu,
  handleInputContextMenu,
  handleOutputContextMenu,
  inputDefinitionExtensions,
  inputDefinitionsBeforeSignal,
  isCompactView,
  isVariablesConnected,
  matchesDisplayName,
  matchesNodeID,
  metadataReadyForConnectedNodes,
  nodeData,
  nodeDescription,
  nodeDefinition,
  nodeExecutionErrorMessage,
  nodeExecutionStatus,
  nodeID,
  nodeProps,
  nodeStyles,
  nodeWrapperStyles,
  showConnectedMetadataSkeleton,
  showVariablesPeek,
  signalInputDefinitions,
  subgraphHeaderColor,
  updateDisplayName,
  updateInputValue,
  variables,
  inputVariables,
  projectVariables,
  settingsEnabled,
  variablesInputDefinition,
  viewportZoom,
  visibleOutputDefinitions,
}) => {
  const theme = useTheme();
  const shouldShowErrorTooltip =
    nodeExecutionStatus === 'error' && nodeExecutionErrorMessage.length > 0;
  const errorTooltipScaleCompensation = useMemo(() => {
    if (!Number.isFinite(viewportZoom) || viewportZoom <= 0) {
      return 1;
    }

    return viewportZoom < 1 ? Math.min(Math.max(1 / viewportZoom, 1), 8) : 1;
  }, [viewportZoom]);

  const [copiedErrorMessage, setCopiedErrorMessage] = useState(false);
  const copyResetTimeoutRef = useRef<number | null>(null);

  const handleCopyErrorMessage = useCallback(
    async (event: React.MouseEvent) => {
      event.stopPropagation();
      if (!nodeExecutionErrorMessage) {
        return;
      }

      try {
        await navigator.clipboard.writeText(nodeExecutionErrorMessage);
      } catch {
        return;
      }

      setCopiedErrorMessage(true);
      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }

      copyResetTimeoutRef.current = window.setTimeout(() => {
        setCopiedErrorMessage(false);
      }, 2000);
    },
    [nodeExecutionErrorMessage]
  );

  useEffect(
    () => () => {
      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    setCopiedErrorMessage(false);
  }, [nodeExecutionErrorMessage]);

  const renderNodeInput = useCallback(
    (
      inputDefinition: InputDefinitionModel,
      options: {
        compact?: boolean;
        renderWidget?: boolean;
        variant?: 'default' | 'peek';
      } = {}
    ) => {
      const inputName = inputDefinition.attr_name;
      const isConnected = connectedInputNamesSet.has(inputName);
      const ext = inputDefinitionExtensions.get(inputName);
      const compact = options.compact ?? false;
      const renderWidget = options.renderWidget ?? true;
      const variant = options.variant ?? 'default';

      if (ext && renderWidget && !compact) {
        return (
          <Box key={inputName} p='8px 8px'>
            <ext.component
              nodeId={nodeID}
              nodeName={nodeDefinition.name}
              inputDefinition={inputDefinition}
              value={getInputValue(inputName)}
              onChange={newValue => updateInputValue(inputName, newValue)}
              context='node'
              variables={variables}
              inputVariables={inputVariables}
              projectVariables={projectVariables}
            />
          </Box>
        );
      }

      return (
        <Box key={inputName} p={compact ? 0 : '8px 0'}>
          <CustomNodeInput
            value={variant === 'peek' ? undefined : getInputValue(inputName)}
            onChange={
              variant === 'peek'
                ? () => {}
                : newValue => updateInputValue(inputName, newValue)
            }
            nodeID={nodeID}
            nodeName={nodeDefinition.name}
            inputDefinition={inputDefinition}
            isConnected={
              variant === 'peek' ? isVariablesConnected : isConnected
            }
            onContextMenu={handleInputContextMenu}
            renderWidget={renderWidget}
            compact={compact}
            variant={variant}
            variables={variables}
            inputVariables={inputVariables}
            projectVariables={projectVariables}
          />
        </Box>
      );
    },
    [
      connectedInputNamesSet,
      getInputValue,
      handleInputContextMenu,
      inputDefinitionExtensions,
      isVariablesConnected,
      nodeID,
      updateInputValue,
      variables,
      inputVariables,
      projectVariables,
    ]
  );

  const renderNodeOutput = useCallback(
    (outputDefinition: OutputDefinitionModel, compact = false) => {
      const outputName = outputDefinition.attr_name;
      const isConnected = connectedOutputNamesSet.has(outputName);

      return (
        <CustomNodeOutput
          key={outputName}
          nodeID={nodeID}
          onContextMenu={handleOutputContextMenu}
          outputDefinition={outputDefinition}
          isConnected={isConnected}
          compact={compact}
          cacheEnabled={cacheEnabled}
        />
      );
    },
    [cacheEnabled, connectedOutputNamesSet, handleOutputContextMenu]
  );

  const metadataSkeleton = showConnectedMetadataSkeleton ? (
    <Box
      sx={currentTheme => ({
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        pointerEvents: 'none',
        backgroundColor: alpha(currentTheme.palette.primary.main, 0.01),
        backgroundImage: `linear-gradient(90deg,
          ${alpha(currentTheme.palette.primary.dark, 0.15)} 0%,
          ${alpha(currentTheme.palette.primary.light, 0.1)} 20%,
          ${alpha(currentTheme.palette.common.white, 0.15)} 40%,
          ${alpha(currentTheme.palette.primary.light, 0.1)} 60%,
          ${alpha(currentTheme.palette.primary.light, 0.1)} 80%,
          ${alpha(currentTheme.palette.primary.dark, 0.15)} 100%
        )`,
        backgroundSize: '300% 100%',
        animation: `${skeletonShimmer} 2.6s ease-in-out infinite`,
        zIndex: currentTheme.zIndex.tooltip,
      })}
    />
  ) : null;

  if (isCompactView) {
    return (
      <Box
        sx={nodeWrapperStyles}
        className='custom-node-error-anchor'
        data-testid='widgets/project-editor/custom-node/canvas-node'
        data-node-id={nodeID}
        data-node-name={nodeDefinition.name}
        data-node-display-name={nodeData.displayName}
      >
        <NodeErrorTooltip
          copied={copiedErrorMessage}
          message={nodeExecutionErrorMessage}
          onCopy={handleCopyErrorMessage}
          scaleCompensation={errorTooltipScaleCompensation}
          visible={shouldShowErrorTooltip}
        />
        <Paper
          elevation={nodeProps.selected ? 8 : 2}
          sx={{
            ...nodeStyles,
            minWidth: 180,
            maxWidth: 260,
            p: 1,
          }}
          className='nowheel'
          onContextMenu={handleContextMenu}
        >
          {metadataSkeleton}
          <Typography
            variant='caption'
            sx={{
              display: 'block',
              textAlign: 'center',
              fontWeight: 600,
              px: 0.5,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              borderRadius: 1,
              backgroundColor: matchesDisplayName
                ? alpha(theme.palette.warning.main, 0.18)
                : 'transparent',
            }}
            title={nodeData.displayName}
          >
            {nodeData.displayName}
          </Typography>

          {matchesNodeID && (
            <Typography
              variant='caption'
              sx={{
                display: 'block',
                textAlign: 'center',
                mt: 0.25,
                fontSize: 11,
                color: 'text.secondary',
                px: 0.5,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                borderRadius: 1,
                backgroundColor: alpha(theme.palette.warning.main, 0.18),
              }}
              title={nodeID}
            >
              ({nodeID})
            </Typography>
          )}

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 1,
              mt: 0.5,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {inputDefinitionsBeforeSignal.map(inputDefinition =>
                renderNodeInput(inputDefinition, {
                  compact: true,
                  renderWidget: false,
                })
              )}
              {variablesInputDefinition &&
                showVariablesPeek &&
                renderNodeInput(variablesInputDefinition, {
                  compact: true,
                  renderWidget: false,
                  variant: 'peek',
                })}
              {signalInputDefinitions.map(inputDefinition =>
                renderNodeInput(inputDefinition, {
                  compact: true,
                  renderWidget: false,
                })
              )}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {visibleOutputDefinitions.map(outputDefinition =>
                renderNodeOutput(outputDefinition, true)
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={nodeWrapperStyles}
      className='custom-node-error-anchor'
      data-testid='widgets/project-editor/custom-node/canvas-node'
      data-node-id={nodeID}
      data-node-name={nodeDefinition.name}
      data-node-display-name={nodeData.displayName}
    >
      <NodeErrorTooltip
        copied={copiedErrorMessage}
        message={nodeExecutionErrorMessage}
        onCopy={handleCopyErrorMessage}
        scaleCompensation={errorTooltipScaleCompensation}
        visible={shouldShowErrorTooltip}
      />
      <Paper
        elevation={nodeProps.selected ? 8 : 2}
        sx={nodeStyles}
        className='nowheel'
        onContextMenu={handleContextMenu}
      >
        {metadataSkeleton}

        <CustomNodeToolbar
          nodeID={nodeID}
          settingsEnabled={settingsEnabled}
          subgraphHeaderColor={subgraphHeaderColor}
        />

        <CustomNodeHeader
          nodeID={nodeID}
          displayName={nodeData.displayName}
          onDisplayNameChange={updateDisplayName}
          nodeDescription={nodeDescription}
          nodeEmoji={nodeDefinition.emoji}
          matchesDisplayName={matchesDisplayName}
          matchesNodeID={matchesNodeID}
        />

        {contentTopExtensions.length > 0 && (
          <>
            <Divider />
            {contentTopExtensions.map((ext, extIndex) => (
              <Box key={ext.id}>
                <ext.component
                  {...nodeProps}
                  nodeDefinition={nodeDefinition}
                  data={nodeData}
                  variables={variables}
                />
                {extIndex !== contentTopExtensions.length - 1 && <Divider />}
              </Box>
            ))}
          </>
        )}

        {(showVariablesPeek ||
          inputDefinitionsBeforeSignal.length > 0 ||
          signalInputDefinitions.length > 0) && (
          <>
            <Divider />
            <Box>
              {inputDefinitionsBeforeSignal.map(inputDefinition =>
                renderNodeInput(inputDefinition)
              )}

              {variablesInputDefinition &&
                showVariablesPeek &&
                renderNodeInput(variablesInputDefinition, {
                  renderWidget: false,
                  variant: 'peek',
                })}

              {signalInputDefinitions.map(inputDefinition =>
                renderNodeInput(inputDefinition)
              )}
            </Box>
          </>
        )}

        {visibleOutputDefinitions.length > 0 && (
          <>
            <Divider />
            <Box p='8px 0'>
              {visibleOutputDefinitions.map(outputDefinition =>
                renderNodeOutput(outputDefinition)
              )}
            </Box>
          </>
        )}

        {contentBottomExtensions.length > 0 && (
          <>
            <Divider />
            {contentBottomExtensions.map((ext, extIndex) => (
              <Box key={ext.id}>
                <ext.component
                  {...nodeProps}
                  nodeDefinition={nodeDefinition}
                  data={nodeData}
                  variables={variables}
                />
                {extIndex !== contentBottomExtensions.length - 1 && <Divider />}
              </Box>
            ))}
          </>
        )}
      </Paper>
    </Box>
  );
};

export const CustomNodeView = memo(CustomNodeView_);
