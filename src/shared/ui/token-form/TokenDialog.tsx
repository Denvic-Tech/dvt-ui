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

import { dialogIconButtonSx } from './styles';

type TokenDialogProps = {
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

export const TokenDialog = ({
  open,
  icon,
  title,
  subtitle,
  children,
  actions,
  onClose,
  onExited,
}: TokenDialogProps) => (
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
      {/* Title and subtitle together are as tall as the 48px icon. */}
      <HeaderContent
        sx={{
          height: 48,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <HeaderTitle noWrap sx={{ mb: 0, lineHeight: '26px' }}>
          {title}
        </HeaderTitle>
        <HeaderDescription noWrap sx={{ lineHeight: '22px' }}>
          {subtitle}
        </HeaderDescription>
      </HeaderContent>
      {onClose ? (
        <IconButton
          disableRipple
          aria-label='Закрыть'
          onClick={onClose}
          sx={{ ...dialogIconButtonSx, alignSelf: 'flex-start' }}
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
