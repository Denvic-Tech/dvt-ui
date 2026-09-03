import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import { alpha, Box, Stack, Typography } from '@mui/material';

import type { ProjectReadSchema } from '@/shared/gatewayClient';
import { Avatar, Card, CardContent, Tooltip } from '@/shared/ui/primitives';

import { formatRelativeTime } from '../lib/date.ts';
import { getRunTone } from '../lib/run-tone.ts';
import { getDisplayInitial } from '../lib/user.ts';

type RecentProjectCardProps = {
  project: ProjectReadSchema;
};

export const RecentProjectCard = ({ project }: RecentProjectCardProps) => {
  const lastRun = project.last_runs?.[0] ?? null;
  const runTone = getRunTone(lastRun?.status);
  const lastActivity = project.updated_at ?? project.created_at ?? null;
  const timestampTitle = lastActivity
    ? new Date(lastActivity).toLocaleString('ru-RU', {
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        month: 'long',
      })
    : 'Дата изменения недоступна';

  return (
    <Box
      component='a'
      href={`/project-editor/${project.id}`}
      sx={{
        textDecoration: 'none',
        display: 'block',
        height: '100%',
        transition:
          'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          '& .home-recent-card': {
            borderColor: 'rgba(91, 75, 255, 0.18)',
            boxShadow: '0 18px 34px -22px rgba(22, 24, 29, 0.22)',
          },
          '& .home-recent-card-arrow': {
            opacity: 1,
            transform: 'translate3d(0, 0, 0)',
          },
        },
      }}
    >
      <Card
        className='home-recent-card'
        sx={{
          height: '100%',
          position: 'relative',
          borderRadius: '14px',
          boxShadow: '0 8px 18px -16px rgba(22, 24, 29, 0.12)',
        }}
      >
        <ArrowOutwardRoundedIcon
          className='home-recent-card-arrow'
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
        <CardContent sx={{ display: 'grid', gap: 1.25, p: 1.75 }}>
          <Stack direction='row' spacing={1.25} alignItems='center'>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                fontSize: 13,
                fontWeight: 700,
                bgcolor: 'rgba(91, 75, 255, 0.12)',
                color: 'primary.main',
              }}
            >
              {getDisplayInitial(project.name)}
            </Avatar>
            <Box
              component='span'
              title={runTone.label}
              sx={{
                width: 7,
                height: 7,
                borderRadius: '999px',
                backgroundColor: runTone.backgroundColor,
                boxShadow: `0 0 0 3px ${alpha(runTone.backgroundColor, 0.16)}`,
                flexShrink: 0,
              }}
            />
          </Stack>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {project.name}
            </Typography>
          </Box>
          <Tooltip title={timestampTitle}>
            <Stack
              direction='row'
              spacing={0.75}
              alignItems='center'
              sx={{ color: 'text.disabled' }}
            >
              <AccessTimeRoundedIcon sx={{ fontSize: 14 }} />
              <Typography sx={{ fontSize: 12, color: 'inherit' }}>
                {formatRelativeTime(lastActivity)}
              </Typography>
            </Stack>
          </Tooltip>
        </CardContent>
      </Card>
    </Box>
  );
};
