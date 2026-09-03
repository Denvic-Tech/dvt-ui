import React, { memo, useCallback, useMemo, useState } from 'react';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ExpandRoundedIcon from '@mui/icons-material/ExpandRounded';
import { Box, Divider, IconButton, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Handle, type NodeProps, Position } from '@xyflow/react';

import { useAppSelector } from '@/app/providers/store';

import type { SubgraphNodeType } from '@/features/project-editor/subgraph';

import { getIOTypeColor } from '@/entities/node/node-io';

import { EditableTypography } from '@/shared/ui';
import { getRadius } from '@/shared/ui/primitives/components/theme-style-helpers.ts';

const SUBGRAPH_FULL_MIN_WIDTH = 640;
const SUBGRAPH_FULL_MAX_WIDTH = 960;
const SUBGRAPH_FULL_COLUMN_MIN_WIDTH = 280;

const SUBGRAPH_COMPACT_MIN_WIDTH = 320;
const SUBGRAPH_COMPACT_MAX_WIDTH = 540;
const SUBGRAPH_COMPACT_COLUMN_MIN_WIDTH = 128;

interface SubgraphNodeProps extends NodeProps<SubgraphNodeType> {
  onSelectedGroupContextMenu?: (
    event: React.MouseEvent,
    nodeId: string
  ) => boolean;
  onSubgraphContextMenu?: (event: React.MouseEvent, subgraphId: string) => void;
  onSubgraphDelete?: (subgraphId: string) => Promise<void> | void;
  onSubgraphExpand?: (subgraphId: string) => void;
  onDisplayNameChange?: (subgraphId: string, displayName: string) => void;
}

const SubgraphNode_: React.FC<SubgraphNodeProps> = props => {
  const {
    id,
    data,
    selected,
    onSelectedGroupContextMenu,
    onSubgraphContextMenu,
    onSubgraphDelete,
    onSubgraphExpand,
    onDisplayNameChange,
  } = props;

  const ports = Array.isArray(data.ports) ? data.ports : [];
  const memberNodeIDs = Array.isArray(data.memberNodeIDs)
    ? data.memberNodeIDs
    : [];

  const inputPorts = useMemo(
    () => ports.filter(port => port.side === 'input'),
    [ports]
  );
  const outputPorts = useMemo(
    () => ports.filter(port => port.side === 'output'),
    [ports]
  );
  const [showNodeNameInPorts, setShowNodeNameInPorts] = useState(false);
  const hasMemberError = useAppSelector(state =>
    memberNodeIDs.some(
      memberNodeID =>
        state.nodeExecutionStatus.statusByID[memberNodeID] === 'error'
    )
  );
  const isCompactMode = !showNodeNameInPorts;
  const subgraphColor = data.color ?? '#3B82F6';

  const getPortDisplayLabel = useCallback(
    (port: SubgraphNodeType['data']['ports'][number]) =>
      showNodeNameInPorts ? port.label : port.handleDisplayName,
    [showNodeNameInPorts]
  );

  const getPortTooltip = useCallback(
    (port: SubgraphNodeType['data']['ports'][number]) =>
      `${port.nodeDisplayName} (${port.internalNodeId})`,
    []
  );

  const handleContextMenu = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (selected && onSelectedGroupContextMenu) {
        const handledByGroup = onSelectedGroupContextMenu(event, id);
        if (handledByGroup) {
          return;
        }
      }

      onSubgraphContextMenu?.(event, id);
    },
    [id, onSelectedGroupContextMenu, onSubgraphContextMenu, selected]
  );

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setShowNodeNameInPorts(prev => !prev);
    },
    []
  );

  const handleExpand = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onSubgraphExpand?.(id);
    },
    [id, onSubgraphExpand]
  );

  const handleDelete = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      void onSubgraphDelete?.(id);
    },
    [id, onSubgraphDelete]
  );

  const handleDisplayNameChange = useCallback(
    (displayName: string) => {
      onDisplayNameChange?.(id, displayName);
    },
    [id, onDisplayNameChange]
  );

  return (
    <Box
      sx={theme => ({
        borderRadius: getRadius(theme),
        outline: selected
          ? `2px dashed ${theme.palette.primary.light}`
          : 'none',
        outlineOffset: 6,
        '&:hover': {
          outline: '2px dashed',
          outlineColor: selected
            ? theme.palette.primary.light
            : alpha(theme.palette.grey[500], 0.35),
          outlineOffset: 6,
        },
      })}
    >
      <Paper
        className='nowheel'
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
        elevation={2}
        sx={{
          minWidth: isCompactMode
            ? SUBGRAPH_COMPACT_MIN_WIDTH
            : SUBGRAPH_FULL_MIN_WIDTH,
          maxWidth: isCompactMode
            ? SUBGRAPH_COMPACT_MAX_WIDTH
            : SUBGRAPH_FULL_MAX_WIDTH,
          borderRadius: theme => getRadius(theme),
          border: '1px solid',
          borderColor: hasMemberError
            ? 'transparent'
            : alpha(subgraphColor, 0.45),
          outline: hasMemberError ? '1px solid' : 'none',
          outlineColor: hasMemberError ? 'error.main' : 'transparent',
          outlineWidth: hasMemberError ? '4px' : 0,
          backgroundColor: alpha(subgraphColor, 0.12),
          position: 'relative',
          overflow: 'hidden',
          ...(hasMemberError
            ? {
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  inset: -3,
                  borderRadius: 'inherit',
                  pointerEvents: 'none',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
                },
              }
            : {}),
        }}
      >
        <Box
          sx={{
            borderBottom: '1px solid',
            borderColor: alpha(subgraphColor, 0.52),
            bgcolor: alpha(subgraphColor, 0.28),
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <IconButton
            size='small'
            onClick={handleExpand}
            disabled={!onSubgraphExpand}
            title='Expand'
            aria-label='Expand'
          >
            <ExpandRoundedIcon fontSize='small' />
          </IconButton>
          <IconButton
            size='small'
            onClick={handleDelete}
            disabled={!onSubgraphDelete}
            title='Удалить'
            aria-label='Удалить'
          >
            <DeleteOutlineRoundedIcon fontSize='small' />
          </IconButton>
        </Box>

        <Box px={1.5} py={1}>
          <EditableTypography
            value={data.displayName}
            onChange={handleDisplayNameChange}
            typographyVariant='subtitle2'
            showButton={false}
            containerSx={{
              justifyContent: 'center',
            }}
            sx={{
              fontWeight: 600,
              textAlign: 'center',
            }}
            textFieldProps={{
              fullWidth: true,
              inputProps: {
                style: {
                  textAlign: 'center',
                  fontWeight: 600,
                },
              },
            }}
          />
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ textAlign: 'center', display: 'block' }}
          >
            ({id})
          </Typography>
          {data.comment && (
            <Typography
              variant='caption'
              color='text.secondary'
              sx={{ textAlign: 'center', display: 'block', mt: 0.5 }}
            >
              {data.comment}
            </Typography>
          )}
        </Box>

        <Divider />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `minmax(${
              isCompactMode
                ? SUBGRAPH_COMPACT_COLUMN_MIN_WIDTH
                : SUBGRAPH_FULL_COLUMN_MIN_WIDTH
            }px, 1fr) minmax(${
              isCompactMode
                ? SUBGRAPH_COMPACT_COLUMN_MIN_WIDTH
                : SUBGRAPH_FULL_COLUMN_MIN_WIDTH
            }px, 1fr)`,
            gap: 1,
            px: 0,
            py: 1,
          }}
        >
          <Box>
            {inputPorts.map(port => {
              const color = getIOTypeColor(port.ioType);
              return (
                <Box
                  key={port.id}
                  title={getPortTooltip(port)}
                  sx={theme => ({
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: 24,
                    pl: 0,
                    pr: 1.5,
                    '&:hover .subgraph-port-label': {
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                    },
                  })}
                >
                  <Handle
                    id={port.id}
                    type='target'
                    position={Position.Left}
                    isConnectable
                    style={{
                      backgroundColor: color,
                      border: 'none',
                      borderRadius: '0 50% 50% 0',
                      width: 10,
                      height: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  />
                  <Typography
                    className='subgraph-port-label'
                    variant='caption'
                    color={port.connected ? 'text.primary' : 'text.secondary'}
                    sx={{
                      pl: 2.25,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      transition: 'color 120ms ease, font-weight 120ms ease',
                    }}
                  >
                    {getPortDisplayLabel(port)}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <Box>
            {outputPorts.map(port => {
              const color = getIOTypeColor(port.ioType);
              return (
                <Box
                  key={port.id}
                  title={getPortTooltip(port)}
                  sx={theme => ({
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    minHeight: 24,
                    pl: 1.5,
                    pr: 0,
                    '&:hover .subgraph-port-label': {
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                    },
                  })}
                >
                  <Typography
                    className='subgraph-port-label'
                    variant='caption'
                    color={port.connected ? 'text.primary' : 'text.secondary'}
                    sx={{
                      pr: 2.25,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textAlign: 'right',
                      transition: 'color 120ms ease, font-weight 120ms ease',
                    }}
                  >
                    {getPortDisplayLabel(port)}
                  </Typography>
                  <Handle
                    id={port.id}
                    type='source'
                    position={Position.Right}
                    isConnectable
                    style={{
                      backgroundColor: color,
                      border: 'none',
                      borderRadius: '50% 0 0 50%',
                      width: 10,
                      height: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

const areSubgraphNodePropsEqual = (
  prev: SubgraphNodeProps,
  next: SubgraphNodeProps
): boolean =>
  prev.id === next.id &&
  prev.selected === next.selected &&
  prev.data === next.data &&
  prev.onSelectedGroupContextMenu === next.onSelectedGroupContextMenu &&
  prev.onSubgraphContextMenu === next.onSubgraphContextMenu &&
  prev.onSubgraphDelete === next.onSubgraphDelete &&
  prev.onSubgraphExpand === next.onSubgraphExpand &&
  prev.onDisplayNameChange === next.onDisplayNameChange;

export const SubgraphNode = memo(SubgraphNode_, areSubgraphNodePropsEqual);
