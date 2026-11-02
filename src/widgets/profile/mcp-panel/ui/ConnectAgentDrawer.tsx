import * as React from 'react';
import { Drawer } from '@mui/material';

const PANEL_GAP = 12;
const ENTER_DURATION_MS = 420;
const EXIT_DURATION_MS = 160;

type ConnectAgentDrawerProps = {
  open: boolean;
  children: React.ReactNode;
};

// No onClose on the Drawer itself: the panel closes only with the cross button.
export const ConnectAgentDrawer = ({
  open,
  children,
}: ConnectAgentDrawerProps) => (
  <Drawer
    anchor='right'
    open={open}
    keepMounted
    disableScrollLock
    transitionDuration={{ enter: ENTER_DURATION_MS, exit: EXIT_DURATION_MS }}
    SlideProps={{
      easing: {
        enter: 'cubic-bezier(.16, 1, .3, 1)',
        exit: 'cubic-bezier(.4, 0, 1, 1)',
      },
    }}
    ModalProps={{
      slotProps: { backdrop: { sx: { bgcolor: 'rgba(20, 24, 40, 0.24)' } } },
    }}
    PaperProps={{
      'aria-label': 'Подключить агента',
      sx: {
        top: PANEL_GAP,
        right: PANEL_GAP,
        bottom: PANEL_GAP,
        height: 'auto',
        width: 480,
        maxWidth: `calc(100vw - ${PANEL_GAP * 2}px)`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: '#fff',
        backgroundImage: 'none',
        border: 'none',
        borderRadius: '18px',
        boxShadow:
          '0 24px 64px rgba(20, 24, 40, 0.18), 0 0 0 1px rgba(20, 24, 40, 0.04)',
      },
    }}
  >
    {children}
  </Drawer>
);
