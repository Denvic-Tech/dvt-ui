import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Box, IconButton, Typography } from '@mui/material';

import type {
  ConnectAgentState,
  ConnectMode,
} from '../model/useConnectAgentState';

import { AutoConnectTab } from './AutoConnectTab';
import { ManualConnectTab } from './ManualConnectTab';
import { headerIconButtonSx } from './styles';

const CONNECT_MODES: Array<{ value: ConnectMode; label: string }> = [
  { value: 'auto', label: 'Автоматически' },
  { value: 'manual', label: 'Вручную' },
];

type ConnectAgentPanelProps = {
  state: ConnectAgentState;
  mcpUrl: string;
  onCreateToken: () => void;
  onClose?: () => void;
};

export const ConnectAgentPanel = ({
  state,
  mcpUrl,
  onCreateToken,
  onClose,
}: ConnectAgentPanelProps) => {
  const { mode, setMode } = state;

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          gap: 1.5,
          px: 3,
          pt: 3,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            component='h2'
            sx={{
              color: '#1B1F2A',
              fontSize: 18,
              fontWeight: 600,
              lineHeight: '24px',
            }}
          >
            Подключить MCP
          </Typography>
          <Typography
            sx={{ color: '#6B7385', fontSize: 13, lineHeight: '18px' }}
          >
            Выберите способ подключения
          </Typography>
        </Box>
        {onClose ? (
          <IconButton
            disableRipple
            aria-label='Закрыть'
            onClick={onClose}
            sx={headerIconButtonSx}
          >
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        ) : null}
      </Box>

      <Box
        role='tablist'
        aria-label='Способ подключения'
        sx={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          flexShrink: 0,
          mx: 3,
          mt: 2,
          p: '3px',
          borderRadius: '11px',
          bgcolor: '#F5F6FA',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 3,
            bottom: 3,
            left: 3,
            width: 'calc(50% - 3px)',
            borderRadius: '8px',
            bgcolor: '#fff',
            boxShadow: 'inset 0 0 0 1px rgba(20, 24, 40, 0.06)',
            transform: mode === 'auto' ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 220ms cubic-bezier(.3, .7, .2, 1)',
          }}
        />
        {CONNECT_MODES.map(option => (
          <Box
            key={option.value}
            component='button'
            type='button'
            role='tab'
            aria-selected={mode === option.value}
            onClick={() => setMode(option.value)}
            sx={{
              position: 'relative',
              zIndex: 1,
              height: 34,
              border: 'none',
              borderRadius: '8px',
              bgcolor: 'transparent',
              color: mode === option.value ? '#1B1F2A' : '#6B7385',
              font: 'inherit',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'color 200ms ease',
              '&:hover': { color: '#1B1F2A' },
            }}
          >
            {option.label}
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          px: 3,
          pt: 2.5,
          pb: 3.5,
          scrollbarWidth: 'thin',
          scrollbarColor: '#D3D8E2 transparent',
        }}
      >
        <Box sx={{ display: mode === 'auto' ? 'block' : 'none' }}>
          <AutoConnectTab state={state} />
        </Box>
        <Box sx={{ display: mode === 'manual' ? 'block' : 'none' }}>
          <ManualConnectTab
            mcpUrl={mcpUrl}
            agentId={state.agentId}
            onAgentChange={state.setAgentId}
            onCreateToken={onCreateToken}
          />
        </Box>
      </Box>
    </>
  );
};
