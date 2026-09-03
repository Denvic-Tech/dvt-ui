import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import { Box, Stack, Typography } from '@mui/material';

import {
  ConnectionLogo,
  type DBConnectionRecord,
  getConnectionTypeLabel,
} from '@/entities/data/db-connection';
import {
  getFileStorageConnectionMeta,
  toFileStorageConnection,
} from '@/entities/data/storage/model/helpers';

import { Card, CardContent } from '@/shared/ui/primitives';

const toDisplayText = (value: unknown) => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
};

const getConnectionHint = (connection: DBConnectionRecord) => {
  const fileStorageConnection = toFileStorageConnection(connection);

  if (fileStorageConnection) {
    return getFileStorageConnectionMeta(fileStorageConnection).hint ?? '';
  }

  if (connection.type === 'kafka') {
    const bootstrapServers = connection.properties['bootstrap_servers'];

    if (Array.isArray(bootstrapServers)) {
      return bootstrapServers.join(', ');
    }

    return toDisplayText(bootstrapServers);
  }

  const host = toDisplayText(connection.properties['host']);
  const port = toDisplayText(connection.properties['port']);

  if (host) {
    return port ? `${host}:${port}` : host;
  }

  const database = toDisplayText(connection.properties['database']);

  if (database) {
    return database;
  }

  return toDisplayText(connection.driver);
};

type HomeConnectionCardProps = {
  connection: DBConnectionRecord;
  onClick?: (() => void) | undefined;
};

export const HomeConnectionCard = ({
  connection,
  onClick,
}: HomeConnectionCardProps) => {
  const typeLabel = getConnectionTypeLabel(connection.type);
  const hint = getConnectionHint(connection);

  return (
    <Box
      component='button'
      type='button'
      onClick={onClick}
      sx={{
        display: 'block',
        width: '100%',
        height: '100%',
        p: 0,
        border: 0,
        background: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        transition:
          'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          '& .home-connection-card': {
            borderColor: 'rgba(91, 75, 255, 0.18)',
            boxShadow: '0 18px 34px -22px rgba(22, 24, 29, 0.22)',
          },
          '& .home-connection-card-arrow': {
            opacity: 1,
            transform: 'translate3d(0, 0, 0)',
          },
        },
        '&:focus-visible': {
          outline: 'none',
          '& .home-connection-card': {
            borderColor: 'rgba(91, 75, 255, 0.22)',
            boxShadow: '0 0 0 3px rgba(91, 75, 255, 0.14)',
          },
          '& .home-connection-card-arrow': {
            opacity: 1,
            transform: 'translate3d(0, 0, 0)',
          },
        },
      }}
    >
      <Card
        className='home-connection-card'
        sx={{
          height: '100%',
          position: 'relative',
          borderRadius: '14px',
          boxShadow: '0 8px 18px -16px rgba(22, 24, 29, 0.12)',
        }}
      >
        <ArrowOutwardRoundedIcon
          className='home-connection-card-arrow'
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: 'text.disabled',
            fontSize: 18,
            opacity: 0,
            transform: 'translate3d(-4px, 4px, 0)',
            transition: 'opacity 160ms ease, transform 160ms ease',
            pointerEvents: 'none',
          }}
        />
        <CardContent
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            minWidth: 0,
            minHeight: 60,
            boxSizing: 'border-box',
            px: 1.5,
            py: 1,
          }}
        >
          <Box
            sx={{
              flex: '0 0 auto',
              '& .MuiAvatar-root': {
                width: 34,
                height: 34,
                borderRadius: '10px',
                fontSize: 12,
                border: 0,
                bgcolor: 'transparent',
              },
            }}
          >
            <ConnectionLogo type={connection.type} label={connection.name} />
          </Box>

          <Stack
            spacing={0.35}
            sx={{
              minWidth: 0,
              flex: 1,
              justifyContent: 'center',
              minHeight: 34,
            }}
          >
            <Typography
              sx={{
                minWidth: 0,
                flex: 1,
                fontSize: 13.5,
                fontWeight: 600,
                lineHeight: 1.1,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={connection.name}
            >
              {connection.name}
            </Typography>

            <Typography
              sx={{
                fontSize: 12,
                lineHeight: 1.15,
                color: 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={hint ? `${typeLabel} · ${hint}` : typeLabel}
            >
              {hint ? `${typeLabel} · ${hint}` : typeLabel}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
