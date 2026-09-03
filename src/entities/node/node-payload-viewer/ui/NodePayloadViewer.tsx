import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Typography,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CodeIcon from '@mui/icons-material/Code';

import { useAppSelector, useAppDispatch } from '@/app/providers/store';
import type { RootState } from '@/app/providers/store';
import { nodePayloadViewerActions } from '@/entities/node/node-payload-viewer/ui/slice.ts';

export const NodePayloadViewer = () => {
  const dispatch = useAppDispatch();
  const [copied, setCopied] = useState(false);

  const { isOpen, nodeID } = useAppSelector(state => state.nodePayloadViewer);

  const nodeData = useAppSelector((state: RootState) =>
    nodeID ? state.graph.nodeDataByID[nodeID] : null
  );

  const definition = useAppSelector((state: RootState) => {
    const name = nodeData?.name;
    return name ? state.nodeDefinition.nodesDefinitionsMap[name] : null;
  });

  if (!isOpen) return null;

  const payload = {
    id: nodeID,
    name: nodeData?.name,
    display_name: nodeData?.displayName,
    input_values: nodeData?.inputValues || {},
    comment: nodeData?.comment,
    _definition: definition
      ? { category: definition.category }
      : 'Definition not found',
  };

  const handleClose = () => dispatch(nodePayloadViewerActions.close());

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1, // Более строгие углы
          border: '1px solid #e0e0e0',
          bgcolor: '#ffffff',
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CodeIcon fontSize='small' sx={{ color: '#000' }} />
          <Box>
            <Typography variant='body1' sx={{ fontWeight: 600, color: '#000' }}>
              Данные ноды
            </Typography>
            <Typography
              variant='caption'
              sx={{ color: '#666', fontFamily: 'monospace' }}
            >
              {nodeID}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} size='small' sx={{ color: '#000' }}>
          <CloseIcon fontSize='small' />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box
          component='pre'
          sx={{
            m: 0,
            p: 3,
            overflow: 'auto',
            fontSize: '13px',
            fontFamily: 'monospace',
            lineHeight: 1.5,
            color: '#000', // Просто черный текст
            whiteSpace: 'pre-wrap', // Перенос строк, если не влезает
            wordBreak: 'break-all',
            bgcolor: '#ffffff',
          }}
        >
          {JSON.stringify(payload, null, 2)}
        </Box>
      </DialogContent>

      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1,
          borderTop: '1px solid #f0f0f0',
        }}
      >
        <Button
          variant='outlined'
          size='small'
          startIcon={<ContentCopyIcon />}
          onClick={handleCopy}
        >
          Копировать
        </Button>
        <Button variant='contained' disableElevation onClick={handleClose}>
          Закрыть
        </Button>
      </Box>

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity='info'>Скопировано</Alert>
      </Snackbar>
    </Dialog>
  );
};
