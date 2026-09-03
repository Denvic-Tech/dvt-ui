import React, { memo, useCallback, useMemo, useState } from 'react';
import { Box, Grid2 as Grid, Tooltip, Typography } from '@mui/material';
import { Handle, Position } from '@xyflow/react';

import { NodeInputDefinitionExtension } from '@/app/providers/node-extensions/lib/types';

import { NodeDataInput } from '@/features/node/use-universal-node-data-input';

import { getIOTypeColor } from '@/entities/node/node-io'; // TODO: CLR

import { InputDefinitionModel, NodeInputValue } from '@/shared/gatewayClient';
import {
  isInputValue,
  makeConst,
  unwrapInputValue,
} from '@/shared/lib/node-input-values';
import type { VariableOutput } from '@/shared/lib/variables';

import { macosPopInKeyframes } from './styles';

const uniformElevationShadow = '0 2px 8px rgba(15, 23, 42, 0.08)';

interface NodeHandleInputProps {
  value: NodeInputValue | undefined;
  onChange: (value: NodeInputValue) => void;
  nodeID: string;
  nodeName: string;
  inputDefinition: InputDefinitionModel;
  isConnected: boolean;
  renderWidget?: boolean;
  inputExtension?: NodeInputDefinitionExtension | undefined;
  compact?: boolean;
  onContextMenu?: (event: React.MouseEvent, inputName: string) => void;
  variant?: 'default' | 'peek';
  variables?: VariableOutput[];
  inputVariables?: VariableOutput[] | undefined;
  projectVariables?: VariableOutput[] | undefined;
}

const CustomNodeInput_: React.FC<NodeHandleInputProps> = ({
  value,
  onChange,
  nodeID,
  nodeName,
  inputDefinition,
  isConnected,
  renderWidget = true,
  inputExtension,
  compact = false,
  variant = 'default',
  variables = [],
  inputVariables,
  projectVariables,
  onContextMenu,
}) => {
  const {
    attr_name: inputName,
    type,
    is_list_type,
    description,
    optional,
  } = inputDefinition;

  const handleId = `input-${inputName}`;
  const [widgetCollapsed, setWidgetCollapsed] = useState<boolean>(true);

  const color = useMemo(() => getIOTypeColor(type), [type]);
  const tooltipTitle = useMemo(() => {
    const titleParts: string[] = [];
    const typeString = Array.isArray(type) ? `LIST of ${type[0]}` : type;
    titleParts.push(`${inputName}: ${typeString}`);

    if (description) {
      titleParts.push(description);
    }
    if (optional) {
      titleParts.push(`(Опционально)`);
    }

    return titleParts.join('\n');
  }, [inputName, type, description, optional]);

  const showLabel = !compact;
  const showWidget = renderWidget && !compact;
  const showLabelEffective = variant === 'peek' ? true : showLabel;

  const handleRightClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (onContextMenu) {
        onContextMenu(event, inputName);
      }
    },
    [onContextMenu, inputName]
  );

  const stopRightButtonPropagation = useCallback(
    (event: React.PointerEvent | React.MouseEvent) => {
      if (event.button === 2) {
        event.stopPropagation();
      }
    },
    []
  );

  return (
    <Box
      onDoubleClick={() => setWidgetCollapsed(prev => !prev)}
      sx={
        variant === 'peek'
          ? {
              transformOrigin: 'left center',
              animation: `${macosPopInKeyframes} 260ms cubic-bezier(0.16, 1, 0.3, 1) both`,
            }
          : {}
      }
    >
      <Grid
        className='nodrag nopan'
        container
        spacing={compact ? 1 : 2}
        alignItems={compact ? 'center' : 'baseline'}
        onPointerDownCapture={stopRightButtonPropagation}
        onMouseDownCapture={stopRightButtonPropagation}
        onContextMenu={handleRightClick} // Вешаем обработчик на всю область выхода
      >
        <Grid size={0.1}>
          <Tooltip
            title={<div style={{ whiteSpace: 'pre-line' }}>{tooltipTitle}</div>}
            placement='left'
            arrow
            slotProps={{
              popper: {
                style: { pointerEvents: 'none' }, // отключаем события мыши для Tooltip
              },
            }}
          >
            <Handle
              id={handleId}
              data-testid='widgets/project-editor/custom-node/node-input-handle'
              data-handle-id={handleId}
              data-handle-name={inputName}
              data-node-id={nodeID}
              type='target'
              position={Position.Left}
              isConnectable
              style={{
                backgroundColor: color,
                border: 'none',
                borderRadius: '0 50% 50% 0',
                width: '10px',
                height: '10px',
                top: 'auto',
                transform: 'translate(0, -100%)',
                boxShadow:
                  variant === 'peek'
                    ? `0 0 0 3px rgba(255, 255, 255, 0.85), ${uniformElevationShadow}`
                    : undefined,
              }}
            />
          </Tooltip>
        </Grid>

        <Grid>
          {showLabelEffective ? (
            <Typography
              variant='caption'
              sx={{
                color: isConnected ? 'text.primary' : 'text.secondary',
                fontWeight: isConnected ? 'medium' : 'normal',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                letterSpacing: variant === 'peek' ? '0.01em' : undefined,
              }}
              title={inputName}
            >
              {inputName}
              {is_list_type ? '[]' : ''}
              {!optional && !isConnected ? '*' : ''}
            </Typography>
          ) : (
            <Box sx={{ minHeight: 16 }} />
          )}

          {/* Секция: виджет (поле ввода) */}
          {widgetCollapsed && showWidget && (
            <Box>
              {inputExtension ? (
                <inputExtension.component
                  nodeId={nodeID}
                  nodeName={nodeName}
                  inputDefinition={inputDefinition}
                  value={value}
                  onChange={onChange}
                  context='node'
                  isConnected={isConnected}
                  variables={variables}
                  inputVariables={inputVariables}
                  projectVariables={projectVariables}
                />
              ) : (
                <NodeDataInput
                  nodeID={nodeID}
                  inputDefinition={inputDefinition}
                  currentValue={unwrapInputValue(value)}
                  variables={variables}
                  renderMode='canvas'
                  onValueChange={nextValue =>
                    onChange(
                      isInputValue(nextValue) ? nextValue : makeConst(nextValue)
                    )
                  }
                />
              )}
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export const CustomNodeInput = memo(CustomNodeInput_);
