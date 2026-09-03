import React, { memo, useCallback, useMemo } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, IconButton } from '@mui/material';
import { alpha, getContrastRatio } from '@mui/material/styles';
import { Edge, useReactFlow } from '@xyflow/react';

import { useAutoReconnectNodes } from '@/features/project-editor/auto-reconnect-nodes';
import {
  useGraphCreates,
  useGraphDeletes,
} from '@/features/project-editor/manage-graph';
import { useSelectNode } from '@/features/project-editor/select-node';
import { useNodeDataModalUI } from '@/features/ui-layout';

import { CustomNodeType } from '@/entities/project-editor/graph';

import { useConfirmDialog } from '@/shared/ui/confirm-dialog';

interface CustomNodeToolbarProps {
  nodeID: string;
  settingsEnabled: boolean;
  subgraphHeaderColor?: string | null;
}

const CustomNodeToolbar_: React.FC<CustomNodeToolbarProps> = ({
  nodeID,
  settingsEnabled,
  subgraphHeaderColor,
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
  const toolbarIconColor = useMemo(() => {
    if (!subgraphHeaderColor) {
      return undefined;
    }
    return getContrastRatio(subgraphHeaderColor, '#fff') >= 2.8
      ? '#fff'
      : '#111827';
  }, [subgraphHeaderColor]);

  const handleOpenDataModal = useCallback(() => {
    selectNode(nodeID);
    setDataModalOpen(true);
  }, [nodeID, selectNode, setDataModalOpen]);

  const handleDeleteNode = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const nodeToDelete = getNodes().find(node => node.id === nodeID);
      if (!nodeToDelete) {
        console.warn(`[CustomNodeToolbar] Node not found: ${nodeID}`);
        return;
      }

      const edgesToDelete: Edge[] = getEdges().filter(
        edge => edge.source === nodeID || edge.target === nodeID
      );

      const nodeLabel =
        nodeToDelete.data?.displayName ??
        nodeToDelete.data?.name ??
        nodeToDelete.id;

      const confirmed = await confirm({
        title: 'Удалить элемент?',
        message: `Узел "${nodeLabel}" (id: ${nodeToDelete.id}) и все связанные соединения будут удалены. Действие необратимо.`,
        confirmLabel: 'Удалить',
        cancelLabel: 'Отмена',
        confirmColor: 'error',
        maxWidth: 'sm',
      });

      if (!confirmed) {
        return;
      }

      try {
        // Calculate reconnection edges before deletion
        const reconnectionEdges = calculateReconnectionEdges(
          [nodeToDelete],
          getEdges()
        );

        // Delete the node and its connected edges
        await deleteGraphEntities([nodeToDelete], edgesToDelete);

        // Create new reconnection edges if any
        if (reconnectionEdges.length > 0) {
          await createGraphEdges(reconnectionEdges);
        }
      } catch (error) {
        console.error(
          `[CustomNodeToolbar] Failed to delete node ${nodeID}:`,
          error
        );
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
    <Box
      sx={{
        borderBottom: '1px solid',
        borderColor: subgraphHeaderColor
          ? alpha(subgraphHeaderColor, 0.52)
          : 'divider',
        bgcolor: subgraphHeaderColor
          ? alpha(subgraphHeaderColor, 0.28)
          : 'action.hover',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <IconButton
        data-testid='widgets/project-editor/custom-node/node-settings-open-button'
        data-node-id={nodeID}
        disabled={!settingsEnabled}
        onClick={handleOpenDataModal}
        size='small'
        sx={{ color: toolbarIconColor }}
      >
        <OpenInNewIcon fontSize='small' />
      </IconButton>

      <IconButton
        data-testid='widgets/project-editor/custom-node/node-delete-button'
        data-node-id={nodeID}
        onClick={handleDeleteNode}
        size='small'
        sx={{ color: toolbarIconColor }}
      >
        <CloseIcon fontSize='small' />
      </IconButton>
    </Box>
  );
};

export const CustomNodeToolbar = memo(CustomNodeToolbar_);
