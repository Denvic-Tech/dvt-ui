import * as React from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Dialog, IconButton } from '@mui/material';

import {
  HeaderContent,
  HeaderDescription,
  HeaderIcon,
  HeaderTitle,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@/shared/ui/create-entity-dialog/styles';

import { headerIconButtonSx } from './styles';

type McpDialogProps = {
  open: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  // Shows a close button in the header.
  onClose?: () => void;
  onExited?: () => void;
};

export const McpDialog = ({
  open,
  icon,
  title,
  subtitle,
  children,
  actions,
  onClose,
  onExited,
}: McpDialogProps) => (
  <Dialog
    open={open}
    maxWidth={false}
    aria-label={title}
    TransitionProps={{ onExited }}
    slotProps={{
      backdrop: { sx: { bgcolor: 'rgba(20, 24, 40, 0.32)' } },
    }}
    PaperProps={{
      sx: {
        width: 480,
        maxWidth: 'calc(100vw - 32px)',
        m: 2,
        borderRadius: '16px',
        backgroundImage: 'none',
        boxShadow: '0 24px 64px rgba(20, 24, 40, 0.22)',
      },
    }}
  >
    <ModalHeader
      sx={{ alignItems: 'center', borderBottom: '1px solid #f3f4f6' }}
    >
      <HeaderIcon>{icon}</HeaderIcon>
      <HeaderContent>
        <HeaderTitle sx={{ mb: 0, lineHeight: '22px' }}>{title}</HeaderTitle>
        <HeaderDescription sx={{ lineHeight: '18px' }}>
          {subtitle}
        </HeaderDescription>
      </HeaderContent>
      {onClose ? (
        <IconButton
          disableRipple
          aria-label='Закрыть'
          onClick={onClose}
          sx={{ ...headerIconButtonSx, alignSelf: 'flex-start' }}
        >
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      ) : null}
    </ModalHeader>

    <ModalContent
      sx={{
        pt: 2.5,
        minHeight: 0,
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: '#D3D8E2 transparent',
      }}
    >
      {children}
    </ModalContent>

    {actions ? <ModalFooter>{actions}</ModalFooter> : null}
  </Dialog>
);
