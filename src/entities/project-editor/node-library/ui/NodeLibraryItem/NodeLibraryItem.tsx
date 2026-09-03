import React, { memo, useCallback } from 'react';
import { Box, Chip, ListItem, ListItemText, Tooltip } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import { NodeDefinition } from '@/shared/gatewayClient';

interface NodeLibraryItemProps {
  nodeDefinition: NodeDefinition;
  enableDrag?: boolean;
  onSelect?: (nodeDefinition: NodeDefinition) => void;
}

const NodeLibraryItemComponent: React.FC<NodeLibraryItemProps> = ({
  nodeDefinition,
  enableDrag = true,
  onSelect,
}) => {
  const onDragStart = useCallback(
    (event: React.DragEvent, nodeType: string) => {
      if (!enableDrag) return;
      event.dataTransfer.setData('application/reactflow', nodeType);
      event.dataTransfer.effectAllowed = 'move';
    },
    [enableDrag]
  );

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (onSelect) {
        onSelect(nodeDefinition);
      }
    },
    [nodeDefinition, onSelect]
  );

  return (
    <Tooltip
      title={nodeDefinition.description || nodeDefinition.name}
      placement='right'
    >
      <ListItem
        draggable={enableDrag}
        onDragStart={event => onDragStart(event, nodeDefinition.name)}
        onClick={handleClick}
        sx={{
          cursor: enableDrag ? 'grab' : onSelect ? 'pointer' : 'default',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          mb: 1,
          bgcolor: 'background.paper',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
            bgcolor: 'action.hover',
          },
          '&:active': {
            cursor: enableDrag ? 'grabbing' : 'pointer',
            opacity: 0.9,
          },
        }}
      >
        <ListItemText
          disableTypography
          primary={
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                component='span'
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flexGrow: 1,
                }}
              >
                {nodeDefinition.display_name || nodeDefinition.name}
              </Box>
              {enableDrag && (
                <DragIndicatorIcon
                  fontSize='small'
                  sx={{ color: 'text.disabled', flexShrink: 0 }}
                />
              )}
            </Box>
          }
          secondary={
            nodeDefinition.tags?.length ? (
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {nodeDefinition.tags.map(tag => (
                  <Chip key={tag} label={tag} size='small' />
                ))}
              </Box>
            ) : null
          }
        />
      </ListItem>
    </Tooltip>
  );
};

export const NodeLibraryItem = memo(NodeLibraryItemComponent);
