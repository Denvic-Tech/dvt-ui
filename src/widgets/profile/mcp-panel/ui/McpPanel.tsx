import * as React from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Alert, Box, ButtonBase, Typography } from '@mui/material';
import { IconPlugConnected } from '@tabler/icons-react';

import { useMcpTokens } from '@/entities/admin/mcp-token';

import type { McpTokenReadSchema } from '@/shared/gatewayClient';
import { useContainerMinWidth } from '@/shared/lib/hooks/useContainerMinWidth';
import { useDelayedLoading } from '@/shared/lib/hooks/useDelayedLoading';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';
import { PageLayout } from '@/shared/ui/page-layout';

import { useConnectAgentState } from '../model/useConnectAgentState';

import { ConnectAgentDrawer } from './ConnectAgentDrawer';
import { ConnectAgentPanel } from './ConnectAgentPanel';
import { CopyIconButton } from './CopyIconButton';
import { CreateMcpTokenDialog } from './CreateMcpTokenDialog';
import { McpTokenItem } from './McpTokenItem';
import { McpTokenItemSkeleton } from './McpTokenItemSkeleton';
import { McpTokensEmptyState } from './McpTokensEmptyState';
import { RenameMcpTokenDialog } from './RenameMcpTokenDialog';
import { connectButtonSx, MONO_FONT_FAMILY } from './styles';

const SKELETON_ROWS = [
  { nameWidth: 148, accessWidth: 196 },
  { nameWidth: 112, accessWidth: 164 },
  { nameWidth: 176, accessWidth: 196 },
];

// Fixed, so switching modes in the connect panel does not resize the token box.
const LIST_BOX_MIN_HEIGHT = 619;
const TOKEN_ROW_HEIGHT = 48;

// List 960 + gap 40 + panel 440 + container paddings 64.
const COLUMN_LAYOUT_MIN_WIDTH = 1504;

export const McpPanel: React.FC = () => {
  const { items, status, error, loadMcpTokens, revokeMcpToken } =
    useMcpTokens();
  const { confirm } = useConfirmDialog();
  const connectAgentState = useConnectAgentState();
  const { ref: containerRef, matches: isColumnLayout } =
    useContainerMinWidth<HTMLDivElement>(COLUMN_LAYOUT_MIN_WIDTH);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [renamingToken, setRenamingToken] =
    React.useState<McpTokenReadSchema | null>(null);
  const mcpUrl = `${window.location.origin}/mcp`;

  const refreshTokens = React.useCallback(() => {
    void loadMcpTokens().catch(() => undefined);
  }, [loadMcpTokens]);

  React.useEffect(() => {
    refreshTokens();
  }, [refreshTokens]);

  // An agent creates its token outside of this page, so nothing notifies the
  // list: catch up when the user comes back from the agent.
  React.useEffect(() => {
    if (status !== 'succeeded') return undefined;

    window.addEventListener('focus', refreshTokens);

    return () => window.removeEventListener('focus', refreshTokens);
  }, [refreshTokens, status]);

  // The column replaces an open floating panel; narrowing back must not reopen it.
  React.useEffect(() => {
    if (isColumnLayout) {
      setIsDrawerOpen(false);
    }
  }, [isColumnLayout]);

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    if (status === 'succeeded') {
      refreshTokens();
    }
  };

  const handleRevoke = async (token: McpTokenReadSchema) => {
    const approved = await confirm({
      title: 'Отозвать токен?',
      message: `Токен «${token.name ?? 'Без названия'}» сразу перестанет работать. Это действие нельзя отменить.`,
      confirmLabel: 'Отозвать',
      cancelLabel: 'Отмена',
      confirmColor: 'error',
      maxWidth: 'xs',
    });

    if (!approved) return;

    try {
      await revokeMcpToken(token.id);
    } catch {
      // The gateway client already shows the request error.
    }
  };

  // Background refreshes must not bring the skeleton back over an empty list.
  const hasLoadedRef = React.useRef(false);
  if (status === 'succeeded' || status === 'failed') {
    hasLoadedRef.current = true;
  }
  const isLoadingList = !hasLoadedRef.current && items.length === 0;
  const showSkeleton = useDelayedLoading(isLoadingList);
  // The box keeps its height with any number of tokens, and grows with a list
  // that does not fit; the container may still shrink it, then the rows scroll.
  const listBoxHeight = Math.max(
    LIST_BOX_MIN_HEIGHT,
    items.length * TOKEN_ROW_HEIGHT + 2
  );

  const openCreateDialog = () => setIsCreateOpen(true);

  const serverAddress = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minWidth: 0,
        height: 30,
        pl: 1.5,
        pr: '3px',
        borderRadius: '8px',
        bgcolor: '#F5F6FA',
      }}
    >
      <Typography sx={{ color: '#6B7385', fontSize: 13 }}>Сервер</Typography>
      <Typography
        noWrap
        sx={{
          color: '#3A4152',
          fontFamily: MONO_FONT_FAMILY,
          fontSize: 12.5,
        }}
      >
        {mcpUrl}
      </Typography>
      <CopyIconButton
        text={mcpUrl}
        label='Скопировать адрес сервера'
        alwaysVisible
      />
    </Box>
  );

  return (
    <Box ref={containerRef} sx={{ width: '100%', height: '100%' }}>
      <PageLayout
        width='default'
        title='MCP'
        icon={IconPlugConnected}
        headerActions={
          <>
            {serverAddress}
            {isColumnLayout ? null : (
              <ButtonBase
                disableRipple
                onClick={() => setIsDrawerOpen(true)}
                sx={connectButtonSx}
              >
                <AddRoundedIcon sx={{ fontSize: 16 }} />
                Подключить MCP
              </ButtonBase>
            )}
          </>
        }
        fitContent
        aside={
          isColumnLayout ? (
            <Box
              component='aside'
              aria-label='Подключить MCP'
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden',
                bgcolor: '#fff',
                border: '1px solid #EEF0F4',
                borderRadius: '16px',
              }}
            >
              <ConnectAgentPanel
                state={connectAgentState}
                mcpUrl={mcpUrl}
                onCreateToken={openCreateDialog}
              />
            </Box>
          ) : undefined
        }
      >
        {error && items.length === 0 ? (
          <Alert severity='error'>{error.description ?? error.message}</Alert>
        ) : (
          <Box
            component='section'
            aria-label='Токены'
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flex: `0 1 ${listBoxHeight}px`,
              minHeight: 0,
              overflow: 'hidden',
              bgcolor: '#fff',
              border: '1px solid #EEF0F4',
              borderRadius: '16px',
            }}
          >
            {showSkeleton ? (
              <>
                {SKELETON_ROWS.map(row => (
                  <McpTokenItemSkeleton key={row.nameWidth} {...row} />
                ))}
              </>
            ) : isLoadingList ? null : items.length === 0 ? (
              <McpTokensEmptyState onCreateToken={openCreateDialog} />
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#D3D8E2 transparent',
                }}
              >
                {items.map(token => (
                  <McpTokenItem
                    key={token.id}
                    token={token}
                    onRename={setRenamingToken}
                    onRevoke={item => void handleRevoke(item)}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}
      </PageLayout>

      {isColumnLayout ? null : (
        <ConnectAgentDrawer open={isDrawerOpen}>
          <ConnectAgentPanel
            state={connectAgentState}
            mcpUrl={mcpUrl}
            onCreateToken={openCreateDialog}
            onClose={handleCloseDrawer}
          />
        </ConnectAgentDrawer>
      )}
      <CreateMcpTokenDialog
        open={isCreateOpen}
        mcpUrl={mcpUrl}
        onClose={() => setIsCreateOpen(false)}
      />
      <RenameMcpTokenDialog
        token={renamingToken}
        onClose={() => setRenamingToken(null)}
      />
    </Box>
  );
};
