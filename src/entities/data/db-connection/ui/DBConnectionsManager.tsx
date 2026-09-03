import * as React from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Alert, Box } from '@mui/material';

import { useConfirmDialog } from '@/shared/ui/confirm-dialog';

import { useConnections } from '../model/hooks/useConnections';
import type {
  DBConnectionRecord,
  DBConnectionScopeOption,
} from '../model/types';

import { DatabaseConnectionCreateUpdateModal } from './DatabaseConnectionCreateUpdateModal';
import { DBConnectionsList } from './DBConnectionsList';
import {
  AddButton,
  HeaderActions,
  HeaderTitle,
  ManagerContainer,
  ManagerHeader,
  RefreshButton,
} from './DBConnectionsManager.styles';

type DBConnectionsManagerProps = {
  onConnectionSelect?: ((connection: DBConnectionRecord) => void) | undefined;
  onOpenFileManager?: ((connection: DBConnectionRecord) => void) | undefined;
  showCreateForm?: boolean;
  showHeader?: boolean;
  contentScrollable?: boolean;
  searchTerm?: string;
  userId?: string | null | undefined;
  organizationId?: string | null | undefined;
  availableUsers?: DBConnectionScopeOption[] | undefined;
  availableOrganizations?: DBConnectionScopeOption[] | undefined;
  listPaddingX?: number;
  renderHeader?:
    | ((params: {
        connectionCount: number;
        loading: boolean;
        onCreate: () => void;
        onRefresh: () => void;
      }) => React.ReactNode)
    | undefined;
};

export const DBConnectionsManager = ({
  onConnectionSelect,
  onOpenFileManager,
  showCreateForm = true,
  showHeader = true,
  contentScrollable = false,
  searchTerm = '',
  userId,
  organizationId,
  availableUsers = [],
  availableOrganizations = [],
  listPaddingX = 0,
  renderHeader,
}: DBConnectionsManagerProps) => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingConnection, setEditingConnection] =
    React.useState<DBConnectionRecord | null>(null);
  const [resetToken, setResetToken] = React.useState(0);
  const { confirm } = useConfirmDialog();
  const bumpResetToken = () => setResetToken(value => value + 1);

  const {
    connections,
    loading,
    error,
    catalog,
    fetchConnections,
    fetchCatalog,
    deleteConnection,
    clearErrors,
    getConnectionById,
  } = useConnections();

  React.useEffect(() => {
    if (!catalog) {
      fetchCatalog();
    }
  }, [catalog, fetchCatalog]);

  React.useEffect(() => {
    void fetchConnections();
  }, [fetchConnections]);

  const handleRefresh = () => {
    clearErrors();
    void fetchCatalog();
    void fetchConnections();
    bumpResetToken();
  };

  const handleOpenCreate = React.useCallback(() => {
    setEditingConnection(null);
    setModalOpen(true);
  }, []);

  const handleDeleteConnection = async (connection: DBConnectionRecord) => {
    const isConfirmed = await confirm({
      title: 'Удалить подключение?',
      message: `Подключение "${connection.name}" будет удалено.`,
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      confirmColor: 'error',
    });

    if (!isConfirmed) {
      return;
    }

    await deleteConnection(connection.id);
  };

  const modalKey = editingConnection
    ? `edit-${editingConnection.id}`
    : 'create';
  const contentContainerSx = contentScrollable
    ? {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }
    : {};

  return (
    <ManagerContainer>
      <Box sx={contentContainerSx}>
        {renderHeader
          ? renderHeader({
              connectionCount: connections.length,
              loading,
              onCreate: handleOpenCreate,
              onRefresh: handleRefresh,
            })
          : null}
        {!renderHeader && showHeader ? (
          <ManagerHeader>
            <HeaderTitle>Подключения</HeaderTitle>
            <HeaderActions>
              <RefreshButton
                type='button'
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshRoundedIcon />
                Обновить
              </RefreshButton>
              {showCreateForm ? (
                <AddButton type='button' onClick={handleOpenCreate}>
                  <AddRoundedIcon />
                  Добавить
                </AddButton>
              ) : null}
            </HeaderActions>
          </ManagerHeader>
        ) : null}

        {error ? (
          <Alert severity='error' sx={{ mx: 1, mt: 1 }}>
            {error}
          </Alert>
        ) : null}

        <Box
          sx={{
            px: listPaddingX,
            ...(contentScrollable
              ? {
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  scrollbarGutter: 'stable',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#c7cbd1 transparent',
                  '&::-webkit-scrollbar': {
                    width: 10,
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#c7cbd1',
                    borderRadius: 999,
                    border: '3px solid transparent',
                    backgroundClip: 'content-box',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    backgroundColor: '#aeb4be',
                  },
                  '&::-webkit-scrollbar-button': {
                    display: 'none',
                    width: 0,
                    height: 0,
                  },
                }
              : null),
          }}
        >
          <DBConnectionsList
            searchTerm={searchTerm}
            handleRefresh={resetToken}
            onConnectionSelect={onConnectionSelect}
            onOpenFileManager={onOpenFileManager}
            onEditConnection={connection => {
              setEditingConnection(
                getConnectionById(connection.id) ?? connection
              );
              setModalOpen(true);
            }}
            onDeleteConnection={connection => {
              void handleDeleteConnection(connection);
            }}
            loading={loading}
          />
        </Box>
      </Box>

      {modalOpen ? (
        <DatabaseConnectionCreateUpdateModal
          key={modalKey}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingConnection(null);
          }}
          editingConnection={editingConnection}
          onSubmit={bumpResetToken}
          userId={userId}
          organizationId={organizationId}
          availableUsers={availableUsers}
          availableOrganizations={availableOrganizations}
        />
      ) : null}
    </ManagerContainer>
  );
};
