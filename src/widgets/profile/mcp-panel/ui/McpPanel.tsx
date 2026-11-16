import * as React from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Alert, Box } from '@mui/material';
import { IconPlugConnected } from '@tabler/icons-react';

import { useAlert } from '@/app/notifications';

import { useMcpTokens } from '@/entities/admin/mcp-token';

import type { McpTokenReadSchema } from '@/shared/gatewayClient';
import { useContainerMinWidth } from '@/shared/lib/hooks/useContainerMinWidth';
import { useDelayedLoading } from '@/shared/lib/hooks/useDelayedLoading';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';
import { HeaderCopyChip } from '@/shared/ui/header-copy-chip';
import { PageLayout } from '@/shared/ui/page-layout';
import {
  getTokenListBoxHeight,
  TokenListBox,
  TokenListCreateButton,
  TokenListRowSkeleton,
  TokenListScroll,
} from '@/shared/ui/token-list';

import { useConnectAgentState } from '../model/useConnectAgentState';

import { ConnectAgentDrawer } from './ConnectAgentDrawer';
import { ConnectAgentPanel } from './ConnectAgentPanel';
import { CreateMcpTokenDialog } from './CreateMcpTokenDialog';
import { MCP_NAME_COLUMN_WIDTH, McpTokenItem } from './McpTokenItem';
import { McpTokensEmptyState } from './McpTokensEmptyState';
import { RenameMcpTokenDialog } from './RenameMcpTokenDialog';

const SKELETON_ROWS = [
  { nameWidth: 148, accessWidth: 196 },
  { nameWidth: 112, accessWidth: 164 },
  { nameWidth: 176, accessWidth: 196 },
];

// List 960 + gap 40 + panel 440 + container paddings 64.
const COLUMN_LAYOUT_MIN_WIDTH = 1504;

export const McpPanel: React.FC = () => {
  const { items, status, error, loadMcpTokens, revokeMcpToken } =
    useMcpTokens();
  const { confirm } = useConfirmDialog();
  const { showNotification } = useAlert();
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
  const listBoxHeight = getTokenListBoxHeight(items.length);

  const openCreateDialog = () => setIsCreateOpen(true);

  const serverAddress = (
    <HeaderCopyChip
      label='Сервер'
      value={mcpUrl}
      copyLabel='Скопировать адрес сервера'
      onCopyError={() =>
        showNotification({
          type: 'error',
          title: 'Не удалось скопировать',
          group: 'mcp-copy',
        })
      }
    />
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
              <TokenListCreateButton
                disableRipple
                onClick={() => setIsDrawerOpen(true)}
              >
                <AddRoundedIcon sx={{ fontSize: 16 }} />
                Подключить MCP
              </TokenListCreateButton>
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
                borderRadius: '12px',
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
          <TokenListBox
            aria-label='Токены'
            sx={{ flex: `0 1 ${listBoxHeight}px` }}
          >
            {showSkeleton ? (
              <>
                {SKELETON_ROWS.map(row => (
                  <TokenListRowSkeleton
                    key={row.nameWidth}
                    nameWidth={row.nameWidth}
                    detailsWidth={row.accessWidth}
                    nameColumnWidth={MCP_NAME_COLUMN_WIDTH}
                  />
                ))}
              </>
            ) : isLoadingList ? null : items.length === 0 ? (
              <McpTokensEmptyState onCreateToken={openCreateDialog} />
            ) : (
              <TokenListScroll>
                {items.map(token => (
                  <McpTokenItem
                    key={token.id}
                    token={token}
                    onRename={setRenamingToken}
                    onRevoke={item => void handleRevoke(item)}
                  />
                ))}
              </TokenListScroll>
            )}
          </TokenListBox>
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
