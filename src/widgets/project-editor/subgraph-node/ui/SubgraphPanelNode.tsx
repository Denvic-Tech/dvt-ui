import React, { memo, useCallback, useMemo } from 'react';
import CompressRoundedIcon from '@mui/icons-material/CompressRounded';
import { Box, IconButton, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { type NodeProps, useStore } from '@xyflow/react';

import type {
  SubgraphPanelDropSide,
  SubgraphPanelNodeType,
} from '@/features/project-editor/subgraph';

import { EditableTypography } from '@/shared/ui';
import { getRadius } from '@/shared/ui/primitives/components/theme-style-helpers.ts';

interface SubgraphPanelNodeProps extends NodeProps<SubgraphPanelNodeType> {
  onSubgraphContextMenu?: (event: React.MouseEvent, subgraphId: string) => void;
  onDisplayNameChange?: (subgraphId: string, displayName: string) => void;
  onSubgraphCollapse?: (subgraphId: string) => void;
  onToggleEditMode?: (subgraphId: string) => void;
}

const uniformElevationShadow = '0 2px 8px rgba(15, 23, 42, 0.08)';

const SubgraphPanelNode_: React.FC<SubgraphPanelNodeProps> = ({
  data,
  selected,
  onSubgraphContextMenu,
  onDisplayNameChange,
  onSubgraphCollapse,
  onToggleEditMode,
}) => {
  const color = data.color ?? '#3B82F6';
  const extractMode = Boolean(data.editMode && data.extractMode);
  const dropHoverActive = Boolean(data.dropHoverActive);
  const dropHoverSide = (data.dropHoverSide ??
    null) as SubgraphPanelDropSide | null;
  const editModeHintText = extractMode
    ? 'Сейчас можно вытащить ноду из subgraph'
    : 'Удерживайте Shift, чтобы вытащить ноду из subgraph';
  const panelStatusText = extractMode
    ? 'Режим извлечения'
    : data.editMode
      ? 'Режим редактирования'
      : 'Перемещение панели';
  const zoom = useStore(state => state.transform?.[2] ?? 1);
  const hintScale = useMemo(() => {
    if (!Number.isFinite(zoom) || zoom <= 0) {
      return 1;
    }
    return Math.min(Math.max(1 / zoom, 1), 8);
  }, [zoom]);
  const dropHoverSideShadow = useMemo(() => {
    if (!dropHoverActive || !dropHoverSide) {
      return '';
    }
    if (dropHoverSide === 'left') {
      return `inset 6px 0 0 ${alpha(color, 0.75)}`;
    }
    if (dropHoverSide === 'right') {
      return `inset -6px 0 0 ${alpha(color, 0.75)}`;
    }
    if (dropHoverSide === 'top') {
      return `inset 0 6px 0 ${alpha(color, 0.75)}`;
    }
    return `inset 0 -6px 0 ${alpha(color, 0.75)}`;
  }, [color, dropHoverActive, dropHoverSide]);

  const handleContextMenu = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onSubgraphContextMenu?.(event, data.subgraphId);
    },
    [data.subgraphId, onSubgraphContextMenu]
  );

  const handleDisplayNameChange = useCallback(
    (displayName: string) => {
      onDisplayNameChange?.(data.subgraphId, displayName);
    },
    [data.subgraphId, onDisplayNameChange]
  );

  const handleCollapse = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onSubgraphCollapse?.(data.subgraphId);
    },
    [data.subgraphId, onSubgraphCollapse]
  );

  const handleBodyDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onToggleEditMode?.(data.subgraphId);
    },
    [data.subgraphId, onToggleEditMode]
  );

  return (
    <Box
      className='nopan subgraph-panel-drag-surface'
      onContextMenu={handleContextMenu}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        borderRadius: theme => getRadius(theme),
        border: extractMode
          ? `2px dashed ${alpha(color, 0.95)}`
          : dropHoverActive
            ? `2px solid ${alpha(color, 0.95)}`
            : `1.5px solid ${alpha(color, selected ? 0.78 : 0.5)}`,
        backgroundColor: alpha(color, 0.18),
        boxShadow: [
          extractMode || dropHoverActive
            ? `0 0 0 2px ${alpha(color, 0.35)}, 0 0 0 4px ${alpha(
                color,
                0.2
              )}, inset 0 0 0 1px ${alpha(color, 0.62)}, ${uniformElevationShadow}`
            : selected
              ? `0 0 0 3px ${alpha(color, 0.2)}`
              : uniformElevationShadow,
          dropHoverSideShadow,
        ]
          .filter(Boolean)
          .join(', '),
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        userSelect: 'none',
        transition:
          'border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease',
        transform: dropHoverActive ? 'scale(1.005)' : 'scale(1)',
      }}
    >
      {data.editMode && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: `translate(-50%, calc(-100% - 8px)) scale(${hintScale})`,
            transformOrigin: 'bottom center',
            px: 1,
            py: 0.2,
            borderRadius: 99,
            fontSize: 11,
            fontWeight: 600,
            lineHeight: 1.3,
            color: 'text.primary',
            backgroundColor: alpha(color, 0.22),
            border: `1px solid ${alpha(color, 0.4)}`,
            boxShadow: uniformElevationShadow,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {editModeHintText}
        </Box>
      )}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: 'inherit',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: alpha(color, 0.18),
        }}
      >
        <Box
          className='subgraph-panel-header'
          sx={{
            minHeight: 30,
            px: 1.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            backgroundColor: alpha(color, 0.3),
            borderBottom: `1px solid ${alpha(color, 0.38)}`,
            cursor: data.editMode ? 'default' : 'grab',
          }}
        >
          <EditableTypography
            value={data.displayName}
            onChange={handleDisplayNameChange}
            typographyVariant='caption'
            showButton={data.editMode}
            containerSx={{
              width: 'auto',
              flex: '1 1 auto',
              minWidth: 0,
              alignItems: 'center',
            }}
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              letterSpacing: 0.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            textFieldProps={{
              inputProps: {
                style: {
                  fontWeight: 700,
                },
              },
            }}
          />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.25,
              flexShrink: 0,
            }}
          >
            <Typography variant='caption' color='text.secondary'>
              {panelStatusText}
            </Typography>
            <IconButton
              size='small'
              onClick={handleCollapse}
              title='Свернуть'
              aria-label='Свернуть'
              className='nodrag nopan'
            >
              <CompressRoundedIcon fontSize='small' />
            </IconButton>
          </Box>
        </Box>
        <Box
          data-testid='subgraph-panel-body'
          sx={{ flex: 1, minHeight: 0 }}
          onDoubleClick={handleBodyDoubleClick}
        />
      </Box>
    </Box>
  );
};

const arePropsEqual = (
  prev: SubgraphPanelNodeProps,
  next: SubgraphPanelNodeProps
): boolean =>
  prev.id === next.id &&
  prev.selected === next.selected &&
  prev.data === next.data &&
  prev.onSubgraphContextMenu === next.onSubgraphContextMenu &&
  prev.onDisplayNameChange === next.onDisplayNameChange &&
  prev.onSubgraphCollapse === next.onSubgraphCollapse &&
  prev.onToggleEditMode === next.onToggleEditMode;

export const SubgraphPanelNode = memo(SubgraphPanelNode_, arePropsEqual);
