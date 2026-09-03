import { alpha } from '@mui/material/styles';
import type { PropsWithChildren } from 'react';

import { Dialog } from '@/shared/ui/primitives';

import { ModalContainer } from './styles';

type NodeDataModalDialogProps = PropsWithChildren<{
  onClose: () => void;
  open: boolean;
}>;

export const NodeDataModalDialog = ({
  children,
  onClose,
  open,
}: NodeDataModalDialogProps) => (
  <Dialog
    data-testid='widgets/project-editor/node-data-modal'
    maxWidth={false}
    open={open}
    onClose={onClose}
    slotProps={{
      backdrop: {
        sx: theme => ({
          backgroundColor: alpha(theme.palette.common.black, 0.24),
          backdropFilter: 'blur(1.5px)',
        }),
      },
      paper: {
        'aria-label': 'Настройки ноды',
        sx: theme => ({
          width: 'calc(100vw - 96px)',
          height: 'calc(100dvh - 64px)',
          maxWidth: 'none',
          maxHeight: 'none',
          m: 0,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          boxShadow: '0 24px 72px rgba(15, 23, 42, 0.18)',
          '& > .MuiBox-root': {
            height: '100%',
            minHeight: 0,
          },
          [theme.breakpoints.down('sm')]: {
            width: 'calc(100vw - 24px)',
            height: 'calc(100dvh - 24px)',
          },
        }),
      },
    }}
  >
    <ModalContainer>{children}</ModalContainer>
  </Dialog>
);
