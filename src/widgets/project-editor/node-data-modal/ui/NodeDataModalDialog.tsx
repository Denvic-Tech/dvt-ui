import { alpha } from '@mui/material/styles';
import type { PropsWithChildren } from 'react';

import type { NodeModalDialogSize } from '@/app/providers/node-extensions/lib/types';

import { Dialog } from '@/shared/ui/primitives';

import { ModalContainer } from './styles';

const DEFAULT_WIDTH = 'calc(100vw - 96px)';
const DEFAULT_HEIGHT = 'calc(100dvh - 64px)';

type NodeDataModalDialogProps = PropsWithChildren<{
  onClose: () => void;
  open: boolean;
  size?: NodeModalDialogSize | undefined;
}>;

export const NodeDataModalDialog = ({
  children,
  onClose,
  open,
  size,
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
          width: size?.width ?? DEFAULT_WIDTH,
          height: size?.height ?? DEFAULT_HEIGHT,
          maxWidth: size?.width !== undefined ? DEFAULT_WIDTH : 'none',
          maxHeight: size?.height !== undefined ? DEFAULT_HEIGHT : 'none',
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
