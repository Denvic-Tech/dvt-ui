import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { Box, ButtonBase } from '@mui/material';
import type * as React from 'react';
import { Link as RouterLink } from 'react-router-dom';

import type { HomeProject } from '../../model/types';
import { formatOpenedAt } from '../lib/date';
import { isProjectRunning } from '../lib/runs';
import { homeRowAppearSx } from '../styles/motion';
import { hc, homeEllipsisSx } from '../styles/tokens';

import { ProjectRunTicks } from './ProjectRunTicks';
import { StatusDot } from './StatusDot';

export const RECENT_ROW_COLUMNS = 'minmax(0, 1fr) 92px 110px 28px';
export const RECENT_ROW_HEIGHT = 44;

const LONG_NAME_LIMIT = 48;

const shortenName = (name: string): string =>
  name.length > LONG_NAME_LIMIT
    ? `${name.slice(0, 30)}…${name.slice(-12)}`
    : name;

/** Right-hand time column; defaults to «last opened». */
export type RecentProjectRowTime = {
  label: string;
  muted?: boolean;
  title?: string;
};

type RecentProjectRowProps = {
  animationDelayMs: number;
  favorite: boolean;
  onToggleFavorite: (project: HomeProject) => void;
  project: HomeProject;
  time?: RecentProjectRowTime | undefined;
};

export const RecentProjectRow = ({
  animationDelayMs,
  favorite,
  onToggleFavorite,
  project,
  time,
}: RecentProjectRowProps) => {
  const running = isProjectRunning(project);
  const openedAt = project.updated_at ?? project.created_at ?? null;
  const timeSlot: RecentProjectRowTime = time ?? {
    label: formatOpenedAt(openedAt),
    ...(openedAt
      ? { title: new Date(openedAt).toLocaleString('ru-RU') }
      : null),
  };

  const handleFavoriteClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onToggleFavorite(project);
  };

  return (
    <Box
      component={RouterLink}
      to={`/project-editor/${project.id}`}
      className='home-project-row'
      sx={{
        ...homeRowAppearSx(animationDelayMs),
        display: 'grid',
        gridTemplateColumns: RECENT_ROW_COLUMNS,
        gap: 1.5,
        alignItems: 'center',
        px: 1.5,
        height: RECENT_ROW_HEIGHT,
        flexShrink: 0,
        position: 'relative',
        borderRadius: '9px',
        color: hc.ink,
        textDecoration: 'none',
        boxShadow: `inset 0 -1px 0 ${hc.rowLine}`,
        transition: 'background-color .14s',
        '&:hover, &:focus-visible': {
          backgroundColor: hc.brandHover,
          boxShadow: 'none',
          outline: 'none',
        },
        '&:has(+ .home-project-row:hover)': { boxShadow: 'none' },
        '&:hover .home-project-star, &:focus-visible .home-project-star': {
          opacity: 1,
        },
      }}
    >
      <Box
        component='span'
        sx={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}
      >
        <StatusDot
          tone={running ? 'run' : 'idle'}
          title={running ? 'Выполняется сейчас' : undefined}
        />
        <Box
          component='span'
          title={project.name}
          sx={{ ...homeEllipsisSx, fontSize: 13, color: hc.ink, minWidth: 0 }}
        >
          {shortenName(project.name)}
        </Box>
      </Box>
      <ProjectRunTicks project={project} />
      <Box
        component='span'
        title={timeSlot.title}
        sx={{
          fontSize: 12,
          color: timeSlot.muted ? hc.ink4 : hc.ink3,
          textAlign: 'right',
          whiteSpace: 'nowrap',
        }}
      >
        {timeSlot.label}
      </Box>
      <ButtonBase
        disableRipple
        className='home-project-star'
        aria-pressed={favorite}
        aria-label={favorite ? 'Убрать из избранного' : 'В избранное'}
        title={favorite ? 'Убрать из избранного' : 'В избранное'}
        onClick={handleFavoriteClick}
        sx={{
          width: 26,
          height: 26,
          borderRadius: '7px',
          color: favorite ? hc.warn : hc.ink4,
          opacity: favorite ? 1 : 0,
          transition: 'opacity .14s, color .14s, background-color .14s',
          '&:hover': {
            color: favorite ? hc.warn : hc.brand,
            backgroundColor: hc.brandSoft,
          },
          '&:focus-visible': { opacity: 1 },
        }}
      >
        {favorite ? (
          <StarRoundedIcon sx={{ fontSize: 17 }} />
        ) : (
          <StarBorderRoundedIcon sx={{ fontSize: 17 }} />
        )}
      </ButtonBase>
    </Box>
  );
};
