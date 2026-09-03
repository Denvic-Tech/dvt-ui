import * as React from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PowerOutlinedIcon from '@mui/icons-material/PowerOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Alert,
  alpha,
  Box,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';

import { useAdmin } from '@/entities/admin/admin';
import { useOrganizations } from '@/entities/admin/organizations';
import {
  DatabaseConnectionCreateUpdateModal,
  type DBConnectionRecord,
  type DBConnectionScopeOption,
  DBConnectionsManager,
  useConnections,
} from '@/entities/data/db-connection';
import { normalizeRole, useCurrentUser } from '@/entities/user';

import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  Input,
} from '@/shared/ui/primitives';

import { HomeConnectionCard } from './HomeConnectionCard';

const HOME_CONNECTIONS_LIMIT = 5;

const connectionsGridSx = {
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, minmax(0, 1fr))',
    lg: 'repeat(3, minmax(0, 1fr))',
  },
  gap: 1.75,
} as const;

const buildAvailableUsers = (
  users: ReturnType<typeof useAdmin>['users']
): DBConnectionScopeOption[] =>
  users
    .filter(
      (
        item
      ): item is typeof item & {
        id: string;
        email: string;
        user_name?: string | null;
      } => typeof item.id === 'string' && item.id.length > 0
    )
    .map(item => ({
      value: item.id,
      label: item.user_name || item.email || item.id,
      description:
        item.email && item.email !== item.user_name ? item.email : null,
    }));

const buildAvailableOrganizations = (
  organizations: ReturnType<typeof useOrganizations>['organizations']
): DBConnectionScopeOption[] =>
  organizations
    .filter(
      (
        item
      ): item is typeof item & {
        id: string;
        name?: string | null;
      } => typeof item.id === 'string' && item.id.length > 0
    )
    .map(item => ({
      value: item.id,
      label: item.name || item.id,
    }));

const AddConnectionCard = ({ onClick }: { onClick: () => void }) => (
  <Box
    component='button'
    type='button'
    onClick={onClick}
    aria-label='Добавить подключение'
    data-testid='widgets/home-dashboard/add-connection-card'
    sx={{
      display: 'block',
      width: '100%',
      height: '100%',
      minHeight: 60,
      p: 0,
      border: 0,
      background: 'transparent',
      cursor: 'pointer',
      textAlign: 'left',
    }}
  >
    <Card
      sx={theme => ({
        height: '100%',
        borderRadius: '14px',
        border: `1px dashed ${theme.palette.divider}`,
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.62) 0%, rgba(248,250,252,0.92) 100%)',
        boxShadow: '0 8px 18px -16px rgba(22, 24, 29, 0.08)',
        transition:
          'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          borderColor: 'rgba(91, 75, 255, 0.22)',
          boxShadow: '0 18px 34px -22px rgba(22, 24, 29, 0.18)',
        },
      })}
    >
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          minHeight: 60,
          px: 1.5,
          py: 1,
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(91, 75, 255, 0.08)',
            color: 'primary.main',
            flexShrink: 0,
          }}
        >
          <AddRoundedIcon sx={{ fontSize: 20 }} />
        </Box>
        <Typography
          sx={{
            fontSize: 13.5,
            fontWeight: 600,
            lineHeight: 1.1,
            color: 'text.secondary',
          }}
        >
          Добавить подключение
        </Typography>
      </CardContent>
    </Card>
  </Box>
);

const EmptyConnectionsBanner = ({ onClick }: { onClick: () => void }) => (
  <Box
    sx={theme => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 2,
      minHeight: 88,
      px: { xs: 2, md: 3 },
      py: 1.75,
      borderRadius: '18px',
      border: `1px dashed ${alpha(theme.palette.primary.main, 0.18)}`,
      background:
        'linear-gradient(180deg, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0.36) 100%)',
      backdropFilter: 'blur(10px)',
      boxShadow: 'none',
    })}
  >
    <Stack
      direction='row'
      spacing={1.75}
      alignItems='center'
      sx={{ minWidth: 0, flex: 1 }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: '12px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(99, 102, 241, 0.08)',
          color: 'primary.main',
          flexShrink: 0,
        }}
      >
        <PowerOutlinedIcon sx={{ fontSize: 18 }} />
      </Box>

      <Stack spacing={0.45} sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 15.5,
            fontWeight: 600,
            lineHeight: 1.1,
            color: 'text.primary',
          }}
        >
          Нет подключений
        </Typography>
        <Typography
          sx={{
            fontSize: 14,
            lineHeight: 1.2,
            color: 'text.secondary',
          }}
        >
          Добавьте источник данных — БД, очередь или файловое хранилище.
        </Typography>
      </Stack>
    </Stack>

    <Button
      type='button'
      variant='outline'
      onClick={onClick}
      startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
      sx={{
        px: 2,
        flexShrink: 0,
        borderRadius: '14px',
        whiteSpace: 'nowrap',
      }}
    >
      Добавить
    </Button>
  </Box>
);

export const HomeConnectionsSection = () => {
  const { user } = useCurrentUser();
  const currentRole = normalizeRole(user?.role);
  const isAdminArea = currentRole === 'admin' || currentRole === 'superadmin';

  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [editingConnection, setEditingConnection] =
    React.useState<DBConnectionRecord | null>(null);
  const [isManagerOpen, setIsManagerOpen] = React.useState(false);
  const [managerSearchTerm, setManagerSearchTerm] = React.useState('');

  const {
    catalog,
    connections,
    error,
    fetchCatalog,
    fetchConnections,
    loadingState,
  } = useConnections();
  const { users, usersLoading, loadUsers } = useAdmin();
  const { organizations, organizationsLoading, loadOrganizations } =
    useOrganizations();

  React.useEffect(() => {
    void fetchConnections();
  }, [fetchConnections]);

  React.useEffect(() => {
    if (!catalog) {
      void fetchCatalog();
    }
  }, [catalog, fetchCatalog]);

  React.useEffect(() => {
    if (!isAdminArea || (!isCreateModalOpen && !isManagerOpen)) {
      return;
    }

    if (!usersLoading && users.length === 0) {
      void loadUsers();
    }

    if (!organizationsLoading && organizations.length === 0) {
      void loadOrganizations();
    }
  }, [
    isAdminArea,
    isCreateModalOpen,
    isManagerOpen,
    loadOrganizations,
    loadUsers,
    organizations.length,
    organizationsLoading,
    users.length,
    usersLoading,
  ]);

  const displayedConnections = React.useMemo(
    () => connections.slice(0, HOME_CONNECTIONS_LIMIT),
    [connections]
  );
  const availableUsers = React.useMemo(
    () => buildAvailableUsers(users),
    [users]
  );
  const availableOrganizations = React.useMemo(
    () => buildAvailableOrganizations(organizations),
    [organizations]
  );

  const handleOpenCreateModal = React.useCallback(() => {
    if (!catalog) {
      void fetchCatalog();
    }

    setEditingConnection(null);
    setIsCreateModalOpen(true);
  }, [catalog, fetchCatalog]);

  const handleOpenEditModal = React.useCallback(
    (connection: DBConnectionRecord) => {
      if (!catalog) {
        void fetchCatalog();
      }

      setEditingConnection(connection);
      setIsCreateModalOpen(true);
    },
    [catalog, fetchCatalog]
  );

  const handleOpenManager = React.useCallback(() => {
    if (!catalog) {
      void fetchCatalog();
    }

    setIsManagerOpen(true);
  }, [catalog, fetchCatalog]);

  const handleCloseManager = React.useCallback(() => {
    setIsManagerOpen(false);
    setManagerSearchTerm('');
  }, []);

  return (
    <>
      <Stack
        direction='row'
        spacing={1.5}
        alignItems='baseline'
        justifyContent='space-between'
        sx={{ mb: 0.25 }}
      >
        <Stack direction='row' spacing={1} alignItems='center'>
          <Typography
            component='h2'
            sx={{
              fontSize: 13.5,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          >
            Подключения
          </Typography>
          <Badge
            variant='default'
            style={{
              backgroundColor: '#eef2f7',
              borderColor: '#d6dde8',
              color: '#667085',
              minHeight: '20px',
              paddingLeft: '8px',
              paddingRight: '8px',
            }}
          >
            {connections.length}
          </Badge>
        </Stack>

        {connections.length > 0 ? (
          <Button
            variant='ghost'
            size='sm'
            disableRipple
            endIcon={<ArrowOutwardRoundedIcon />}
            onClick={handleOpenManager}
            data-testid='widgets/home-dashboard/connections-manager-open-button'
            sx={{
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'transparent',
              },
              '&:active': {
                backgroundColor: 'transparent',
              },
              '&:focus-visible': {
                backgroundColor: 'transparent',
                boxShadow: 'none',
              },
              '& .MuiButton-endIcon svg': {
                fontSize: 15,
              },
            }}
          >
            Управление
          </Button>
        ) : null}
      </Stack>

      {error && !loadingState.isFetching ? (
        <Alert severity='error' sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      ) : null}

      {loadingState.isFetching && connections.length === 0 ? (
        <Box sx={connectionsGridSx}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              variant='rounded'
              height={60}
              sx={{ borderRadius: '14px' }}
            />
          ))}
        </Box>
      ) : connections.length === 0 ? (
        <EmptyConnectionsBanner onClick={handleOpenCreateModal} />
      ) : (
        <Box sx={connectionsGridSx}>
          {displayedConnections.map(connection => (
            <HomeConnectionCard
              key={connection.id}
              connection={connection}
              onClick={() => handleOpenEditModal(connection)}
            />
          ))}
          <AddConnectionCard onClick={handleOpenCreateModal} />
        </Box>
      )}

      {isCreateModalOpen ? (
        <DatabaseConnectionCreateUpdateModal
          open={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingConnection(null);
          }}
          editingConnection={editingConnection}
          onSubmit={() => {
            void fetchConnections();
          }}
          availableUsers={availableUsers}
          availableOrganizations={availableOrganizations}
        />
      ) : null}

      <Dialog
        open={isManagerOpen}
        onClose={handleCloseManager}
        maxWidth='lg'
        slotProps={{
          paper: {
            sx: {
              width: 'min(600px, calc(100vw - 32px))',
              height: 'min(720px, calc(100dvh - 32px))',
              maxHeight: 'min(720px, calc(100dvh - 32px))',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              margin: '16px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': {
                display: 'none',
                width: 0,
                height: 0,
              },
              '& > .MuiBox-root': {
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
              },
            },
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              height: '100%',
            }}
          >
            <DBConnectionsManager
              searchTerm={managerSearchTerm}
              showCreateForm={true}
              contentScrollable={true}
              availableUsers={availableUsers}
              availableOrganizations={availableOrganizations}
              listPaddingX={1}
              renderHeader={({
                connectionCount,
                loading,
                onCreate,
                onRefresh,
              }) => (
                <Box
                  sx={{
                    px: 3,
                    pt: 3,
                    pb: 2,
                    borderBottom: '1px solid #f3f4f6',
                    display: 'grid',
                    gap: 2,
                  }}
                >
                  <Stack
                    direction='row'
                    alignItems='flex-start'
                    justifyContent='space-between'
                    spacing={2}
                  >
                    <Stack direction='row' spacing={1.5} alignItems='center'>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(99, 102, 241, 0.10)',
                          color: 'primary.main',
                          flexShrink: 0,
                        }}
                      >
                        <PowerOutlinedIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Box>
                        <Typography
                          sx={{
                            fontSize: 15,
                            fontWeight: 700,
                            lineHeight: 1.15,
                            color: 'text.primary',
                          }}
                        >
                          Подключения
                        </Typography>
                        <Typography
                          sx={{
                            mt: 0.35,
                            fontSize: 13,
                            lineHeight: 1.2,
                            color: 'text.secondary',
                          }}
                        >
                          {connectionCount} источников · доступны во всех
                          проектах
                        </Typography>
                      </Box>
                    </Stack>

                    <IconButton
                      onClick={handleCloseManager}
                      size='small'
                      sx={{
                        mt: -0.25,
                        color: '#98a2b3',
                        '&:hover': {
                          backgroundColor: '#f3f4f6',
                          color: '#667085',
                        },
                      }}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Stack>

                  <Stack direction='row' spacing={1.25} alignItems='center'>
                    <Input
                      value={managerSearchTerm}
                      data-testid='widgets/home-dashboard/connections-manager-search-input'
                      onChange={event =>
                        setManagerSearchTerm(event.target.value)
                      }
                      placeholder='Поиск по подключениям...'
                      startAdornment={
                        <SearchRoundedIcon
                          sx={{ fontSize: 18, color: '#98a2b3' }}
                        />
                      }
                      sx={{ flex: 1 }}
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='icon'
                      onClick={onRefresh}
                      disabled={loading}
                      data-testid='widgets/home-dashboard/connections-manager-refresh-button'
                      sx={{
                        minWidth: 40,
                        color: 'text.secondary',
                        boxShadow: 'none',
                      }}
                    >
                      <RefreshRoundedIcon sx={{ fontSize: 18 }} />
                    </Button>
                    <Button
                      type='button'
                      variant='default'
                      size='sm'
                      onClick={onCreate}
                      data-testid='widgets/home-dashboard/connections-manager-create-button'
                      startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
                      sx={{ px: 2 }}
                    >
                      Добавить
                    </Button>
                  </Stack>
                </Box>
              )}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};
