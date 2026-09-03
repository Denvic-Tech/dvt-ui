import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import { Box, Stack, Typography } from '@mui/material';
import type React from 'react';
import { Link as RouterLink } from 'react-router-dom';

import type { ProjectReadSchema } from '@/shared/gatewayClient';
import { Button } from '@/shared/ui/primitives';

import { RECENT_PROJECTS_LIMIT } from '../lib/recent-projects.ts';

import { EmptyRecentProjectsCard } from './EmptyRecentProjectsCard.tsx';
import { RecentProjectCard } from './RecentProjectCard.tsx';
import { RecentProjectPlaceholderCard } from './RecentProjectPlaceholderCard.tsx';
import { RecentProjectSkeleton } from './RecentProjectSkeleton.tsx';

type RecentProjectsSectionProps = {
  canCreateProject: boolean;
  onCreateProject: () => void;
  recentProjects: ProjectReadSchema[];
  recentProjectsLoading: boolean;
  targetProjectsUrl: string;
};

const recentProjectsGridSx = {
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, minmax(0, 1fr))',
    lg: 'repeat(4, minmax(0, 1fr))',
  },
  gap: 1.75,
} as const;

export const RecentProjectsSection = ({
  canCreateProject,
  onCreateProject,
  recentProjects,
  recentProjectsLoading,
  targetProjectsUrl,
}: RecentProjectsSectionProps) => {
  const hasProjects = recentProjects.length > 0;
  const recentProjectPlaceholderCount = Math.max(
    RECENT_PROJECTS_LIMIT - recentProjects.length,
    0
  );

  return (
    <>
      <Stack
        direction='row'
        spacing={1.5}
        alignItems='baseline'
        justifyContent='space-between'
        sx={{ mb: 0.25 }}
      >
        <Box>
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
            Продолжить работу
          </Typography>
        </Box>

        {hasProjects ? (
          <Button
            component={RouterLink as React.ElementType}
            {...({ to: targetProjectsUrl } as { to: string })}
            variant='ghost'
            size='sm'
            disableRipple
            endIcon={<ArrowOutwardRoundedIcon />}
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
            Все проекты
          </Button>
        ) : null}
      </Stack>

      {recentProjectsLoading ? (
        <Box sx={recentProjectsGridSx}>
          {Array.from({ length: RECENT_PROJECTS_LIMIT }).map((_, index) => (
            <RecentProjectSkeleton key={index} />
          ))}
        </Box>
      ) : hasProjects ? (
        <Box sx={recentProjectsGridSx}>
          {recentProjects.map(project => (
            <RecentProjectCard key={project.id} project={project} />
          ))}
          {Array.from({ length: recentProjectPlaceholderCount }).map(
            (_, index) => (
              <RecentProjectPlaceholderCard key={`placeholder-${index}`} />
            )
          )}
        </Box>
      ) : (
        <EmptyRecentProjectsCard
          canCreateProject={canCreateProject}
          onCreateProject={onCreateProject}
        />
      )}
    </>
  );
};
