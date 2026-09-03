import React, { memo, useCallback } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, IconButton, Paper } from '@mui/material';
import { NodeToolbar, useReactFlow } from '@xyflow/react';

import { useAutoReconnectNodes } from '@/features/project-editor/auto-reconnect-nodes';
import {
  useGraphCreates,
  useGraphDeletes,
} from '@/features/project-editor/manage-graph';
import { useSelectNode } from '@/features/project-editor/select-node';
import { useNodeDataModalUI } from '@/features/ui-layout';

import { CustomNodeType } from '@/entities/project-editor/graph';

import { useConfirmDialog } from '@/shared/ui/confirm-dialog';

interface WidgetToolbarProps {
  nodeID: string;
  isVisible: boolean;
}

const WidgetToolbar_: React.FC<WidgetToolbarProps> = ({
  nodeID,
  isVisible,
}) => {
  const { selectNode } = useSelectNode();
  const { setOpen: setDataModalOpen } = useNodeDataModalUI();
  const { setNodes, setEdges, getNodes, getEdges } =
    useReactFlow<CustomNodeType>();

  const { deleteGraphEntities } = useGraphDeletes({
    setGraphNodes: setNodes,
    setGraphEdges: setEdges,
  });
  const { createGraphEdges } = useGraphCreates({
    setGraphNodes: setNodes,
    setGraphEdges: setEdges,
  });
  const { calculateReconnectionEdges } = useAutoReconnectNodes();
  const { confirm } = useConfirmDialog();

  const handleOpenDataModal = useCallback(() => {
    selectNode(nodeID);
    setDataModalOpen(true);
  }, [nodeID, selectNode, setDataModalOpen]);

  const handleDeleteNode = useCallback(
    async (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const nodeToDelete = getNodes().find(node => node.id === nodeID);
      if (!nodeToDelete) return;

      const edgesToDelete = getEdges().filter(
        edge => edge.source === nodeID || edge.target === nodeID
      );

      const confirmed = await confirm({
        title: 'Удалить виджет?',
        message: 'Вы уверены, что хотите удалить этот виджет?',
        confirmLabel: 'Удалить',
        cancelLabel: 'Отмена',
        confirmColor: 'error',
      });

      if (confirmed) {
        const reconnectionEdges = calculateReconnectionEdges(
          [nodeToDelete],
          getEdges()
        );
        await deleteGraphEntities([nodeToDelete], edgesToDelete);
        if (reconnectionEdges.length > 0)
          await createGraphEdges(reconnectionEdges);
      }
    },
    [
      confirm,
      deleteGraphEntities,
      getEdges,
      getNodes,
      nodeID,
      calculateReconnectionEdges,
      createGraphEdges,
    ]
  );

  return (
    <NodeToolbar isVisible={isVisible} offset={10}>
      <Paper
        elevation={3}
        sx={{
          display: 'flex',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <IconButton
          onClick={handleOpenDataModal}
          size='small'
          sx={{ borderRadius: 0 }}
        >
          <OpenInNewIcon fontSize='small' />
        </IconButton>

        <Box sx={{ width: '1px', bgcolor: 'divider' }} />

        <IconButton
          onClick={handleDeleteNode}
          size='small'
          sx={{ borderRadius: 0, '&:hover': { color: 'error.main' } }}
        >
          <CloseIcon fontSize='small' />
        </IconButton>
      </Paper>
    </NodeToolbar>
  );
};

export const WidgetToolbar = memo(WidgetToolbar_);
