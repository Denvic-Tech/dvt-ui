import React, { memo, useCallback, useMemo } from 'react';
import { Box, Grid2 as Grid, Tooltip, Typography } from '@mui/material';
import { Handle, Position } from '@xyflow/react';

import { getIOTypeColor } from '@/entities/node/node-io';

import { OutputDefinitionModel } from '@/shared/gatewayClient';

interface CustomNodeOutputProps {
  outputDefinition: OutputDefinitionModel;
  isConnected: boolean;
  nodeID?: string;
  cacheEnabled?: boolean;
  compact?: boolean;
  onContextMenu?: (event: React.MouseEvent, outputName: string) => void;
}

const CustomNodeOutput_: React.FC<CustomNodeOutputProps> = ({
  outputDefinition,
  isConnected,
  nodeID,
  cacheEnabled,
  compact = false,
  onContextMenu,
}) => {
  const { attr_name: outputName, type } = outputDefinition;

  const handleId = `output-${outputName}`;
  const color = useMemo(() => getIOTypeColor(type), [type]);
  const isDataFrame = useMemo(() => {
    if (Array.isArray(type)) {
      return type.includes('DATAFRAME');
    }
    return type === 'DATAFRAME';
  }, [type]);

  const handleRightClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (onContextMenu) {
        onContextMenu(event, outputName);
      }
    },
    [onContextMenu, outputName]
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
    <Box>
      <Grid
        className='nodrag nopan'
        container
        spacing={compact ? 1 : 2}
        alignItems={compact ? 'center' : 'baseline'}
        justifyContent='flex-end'
        onPointerDownCapture={stopRightButtonPropagation}
        onMouseDownCapture={stopRightButtonPropagation}
        onContextMenu={handleRightClick} // Вешаем обработчик на всю область выхода
        sx={{ cursor: 'context-menu' }}
      >
        <Grid>
          {compact ? (
            <Box sx={{ minHeight: 16 }} />
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 0.5,
                minWidth: 0,
              }}
            >
              {isDataFrame && (
                <Box
                  sx={theme => ({
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: cacheEnabled
                      ? theme.palette.success.main
                      : theme.palette.grey[400],
                    flex: '0 0 auto',
                  })}
                />
              )}
              <Typography
                variant='caption'
                sx={{
                  textAlign: 'right',
                  color: isConnected ? 'text.primary' : 'text.secondary',
                  fontWeight: isConnected ? 'medium' : 'normal',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={outputName}
              >
                {outputName}
                {outputDefinition.is_list_type ? '[]' : ''}
              </Typography>
            </Box>
          )}
        </Grid>
        <Grid size={0.1}>
          <Tooltip
            title={`${outputDefinition.description || outputDefinition.attr_name}${outputDefinition.is_list_type ? ' (список)' : ''}`}
            placement='left'
          >
            <Handle
              id={handleId}
              data-testid='widgets/project-editor/custom-node/node-output-handle'
              data-handle-id={handleId}
              data-handle-name={outputName}
              {...(nodeID ? { 'data-node-id': nodeID } : {})}
              type='source'
              position={Position.Right}
              isConnectable
              style={{
                backgroundColor: color,
                border: 'none',
                borderRadius: '50% 0 0 50%',
                width: '10px',
                height: '10px',
                top: 'auto',
                transform: 'translate(0, -100%)',
              }}
            />
          </Tooltip>
        </Grid>
      </Grid>
    </Box>
  );
};

export const CustomNodeOutput = memo(CustomNodeOutput_);
