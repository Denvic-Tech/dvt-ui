import { useEffect, useMemo } from 'react';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import {
  ConnectionLogo,
  type DBConnectionRecord,
  isFileConnectionType,
  useConnections,
} from '@/entities/data/db-connection';
import {
  getFileStorageConnectionMeta,
  toFileStorageConnection,
} from '@/entities/data/storage';

type FileManagerSectionProps = {
  onOpenFileManager: (connection: DBConnectionRecord) => void;
  searchTerm?: string;
};

const getConnectionSearchValues = (connection: DBConnectionRecord) => {
  const storageConnection = toFileStorageConnection(connection);
  const storageHint = storageConnection
    ? getFileStorageConnectionMeta(storageConnection).hint
    : null;

  return [
    connection.name,
    connection.kind,
    connection.type,
    connection.driver ?? '',
    storageHint ?? '',
    String(connection.properties['bucket'] ?? ''),
    String(connection.properties['prefix'] ?? ''),
    String(connection.properties['endpoint_url'] ?? ''),
    String(connection.properties['host'] ?? ''),
    String(connection.properties['port'] ?? ''),
    String(connection.properties['share'] ?? ''),
    String(connection.properties['path'] ?? ''),
  ];
};

const getConnectionHint = (connection: DBConnectionRecord) => {
  const storageConnection = toFileStorageConnection(connection);

  if (!storageConnection) {
    return 'Тип пока не поддерживается в файловом менеджере';
  }

  return (
    getFileStorageConnectionMeta(storageConnection).hint ??
    'Корневой путь не задан'
  );
};

export const FileManagerSection = ({
  onOpenFileManager,
  searchTerm = '',
}: FileManagerSectionProps) => {
  const { clearErrors, connections, error, fetchConnections, loading } =
    useConnections();

  useEffect(() => {
    void fetchConnections();
  }, [fetchConnections]);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const fileConnections = useMemo(
    () =>
      connections
        .filter(connection => connection.kind === 'file')
        .filter(connection => {
          if (!normalizedSearchTerm) {
            return true;
          }

          return getConnectionSearchValues(connection).some(value =>
            value.toLowerCase().includes(normalizedSearchTerm)
          );
        }),
    [connections, normalizedSearchTerm]
  );

  const handleRefresh = () => {
    clearErrors();
    void fetchConnections();
  };

  return (
    <Box sx={{ px: 1.5, py: 1.25 }}>
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        spacing={1}
        sx={{ mb: 1.25 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
            Файловый менеджер
          </Typography>
        </Box>

        <Tooltip title='Обновить список'>
          <span>
            <IconButton
              size='small'
              onClick={handleRefresh}
              disabled={loading}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '10px',
              }}
            >
              <RefreshRoundedIcon fontSize='small' />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {error ? (
        <Alert severity='error' sx={{ mb: 1.25 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 6,
          }}
        >
          <CircularProgress size={22} />
        </Box>
      ) : null}

      {!loading && fileConnections.length === 0 ? (
        <Box
          sx={theme => ({
            border: `1px dashed ${alpha(theme.palette.text.primary, 0.14)}`,
            borderRadius: '12px',
            px: 2,
            py: 3,
            textAlign: 'center',
            color: 'text.secondary',
          })}
        >
          <Typography variant='body2' sx={{ fontWeight: 600, mb: 0.25 }}>
            {normalizedSearchTerm
              ? 'Файловые подключения не найдены'
              : 'Нет файловых подключений'}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            {normalizedSearchTerm
              ? 'Попробуйте изменить поисковый запрос.'
              : 'Создайте файловое подключение во вкладке "Подключения".'}
          </Typography>
        </Box>
      ) : null}

      {!loading && fileConnections.length > 0 ? (
        <List sx={{ p: 0, display: 'grid', gap: 0.75, minWidth: 0 }}>
          {fileConnections.map(connection => {
            const isSupported = isFileConnectionType(connection.type);

            return (
              <ListItem key={connection.id} disablePadding sx={{ minWidth: 0 }}>
                <ListItemButton
                  onClick={() => onOpenFileManager(connection)}
                  disabled={!isSupported}
                  sx={theme => ({
                    width: '100%',
                    minWidth: 0,
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    alignItems: 'center',
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: alpha(theme.palette.text.primary, 0.08),
                    borderRadius: '12px',
                    px: 0.875,
                    py: 0.75,
                    gap: 0.75,
                    transition:
                      'border-color 150ms ease, background-color 150ms ease',
                    '&:hover': {
                      borderColor: alpha(theme.palette.primary.main, 0.28),
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    },
                    '&.Mui-disabled': {
                      opacity: 0.72,
                    },
                  })}
                >
                  <Box
                    sx={{
                      flex: '0 0 28px',
                      width: 28,
                      minWidth: 28,
                      '& .MuiAvatar-root': {
                        width: 28,
                        height: 28,
                        fontSize: 11,
                      },
                    }}
                  >
                    <ConnectionLogo
                      type={connection.type}
                      label={connection.name}
                    />
                  </Box>

                  <Box
                    sx={{
                      minWidth: 0,
                      flex: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <Stack
                      direction='row'
                      alignItems='center'
                      justifyContent='space-between'
                      spacing={0.75}
                      sx={{ minWidth: 0 }}
                    >
                      <Typography
                        variant='body2'
                        noWrap
                        sx={{
                          minWidth: 0,
                          flex: 1,
                          fontSize: 13,
                          lineHeight: 1.2,
                          fontWeight: 600,
                        }}
                      >
                        {connection.name}
                      </Typography>

                      <Typography
                        variant='caption'
                        noWrap
                        sx={{
                          flexShrink: 0,
                          color: theme =>
                            alpha(theme.palette.text.primary, 0.54),
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          fontSize: 10,
                          lineHeight: 1,
                        }}
                      >
                        {connection.type}
                      </Typography>

                      <FolderOpenOutlinedIcon
                        sx={{
                          flexShrink: 0,
                          fontSize: 15,
                          color: isSupported ? 'primary.main' : 'text.disabled',
                        }}
                      />
                    </Stack>

                    <Typography
                      variant='caption'
                      noWrap
                      sx={{
                        display: 'block',
                        mt: 0.25,
                        minWidth: 0,
                        color: 'text.secondary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: 11,
                        lineHeight: 1.15,
                      }}
                    >
                      {getConnectionHint(connection)}
                    </Typography>
                  </Box>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      ) : null}
    </Box>
  );
};
