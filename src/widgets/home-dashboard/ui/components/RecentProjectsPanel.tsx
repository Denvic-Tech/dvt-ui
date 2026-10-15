import * as React from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { Box, ButtonBase, InputBase } from '@mui/material';

import type {
  ProjectReadSchema,
  ProjectScheduleResponse,
} from '@/shared/gatewayClient';
import { Skeleton } from '@/shared/ui/primitives';

import type { HomeProject } from '../../model/types';
import { useProjectSearch } from '../../model/useProjectSearch';
import type { ScheduledProjectsState } from '../../model/useScheduledProjects';
import { formatUntil } from '../lib/date';
import { homeAppearSx } from '../styles/motion';
import { hc, homeCardSx } from '../styles/tokens';

import { HomeLoadError } from './HomeLoadError';
import {
  RECENT_ROW_COLUMNS,
  RECENT_ROW_HEIGHT,
  RecentProjectRow,
  type RecentProjectRowTime,
} from './RecentProjectRow';
import { RecentProjectsOnboarding } from './RecentProjectsOnboarding';

const COLUMN_HEADER_HEIGHT = 23;
const FOOTER_HEIGHT = 36;
/** Tabs row height; the onboarding card keeps the same overall height. */
const TOOLBAR_HEIGHT = 46;
const SKELETON_NAME_WIDTHS = ['46%', '62%', '38%', '54%', '42%'];
const SKELETON_DATE_WIDTHS = [64, 48, 72, 56, 60];
const MAX_VISIBLE_PROJECTS = 10;
const NO_ROWS: PanelRow[] = [];
const PANEL_SEARCH_OPTIONS = {
  includeLastRuns: true,
  limit: MAX_VISIBLE_PROJECTS,
};

type RecentTab = 'recent' | 'favorites' | 'scheduled';

type PanelRow = {
  project: HomeProject;
  time?: RecentProjectRowTime;
};

const toRows = (projects: readonly HomeProject[]): PanelRow[] =>
  projects.map(project => ({ project }));

/** Next-run label for the scheduled tab instead of «last opened». */
const getScheduleTime = (
  schedule: ProjectScheduleResponse
): RecentProjectRowTime => {
  if (schedule.disabled) {
    return { label: 'отключено', muted: true, title: schedule.cron };
  }

  return {
    label: schedule.next_run_time ? formatUntil(schedule.next_run_time) : '—',
    title: [
      schedule.cron,
      schedule.next_run_time
        ? new Date(schedule.next_run_time).toLocaleString('ru-RU')
        : null,
    ]
      .filter(Boolean)
      .join(' · '),
  };
};

type FavoriteProjectsState = {
  error: unknown;
  favorites: HomeProject[] | null;
  isFavorite: (project: HomeProject) => boolean;
  loading: boolean;
  reload: () => void;
};

type RecentProjectsPanelProps = {
  error: boolean;
  expandedCount?: number;
  favorites: FavoriteProjectsState;
  initialCount?: number;
  loading: boolean;
  onCreateProject: () => void;
  onExpandedChange?: (expanded: boolean) => void;
  onRetry: () => void;
  onToggleFavorite: (project: HomeProject) => void;
  projects: ProjectReadSchema[];
  scheduled: ScheduledProjectsState;
};

export const RecentProjectsPanel = ({
  error,
  expandedCount = MAX_VISIBLE_PROJECTS,
  favorites,
  initialCount = 5,
  loading,
  onCreateProject,
  onExpandedChange,
  onRetry,
  onToggleFavorite,
  projects,
  scheduled,
}: RecentProjectsPanelProps) => {
  const [tab, setTab] = React.useState<RecentTab>('recent');
  const [query, setQuery] = React.useState('');
  const [expanded, setExpanded] = React.useState(false);

  const search = useProjectSearch(query, PANEL_SEARCH_OPTIONS);
  const isSearching = query.trim().length > 0;
  const { isFavorite } = favorites;
  const favoriteSearchResults = React.useMemo(
    () => search.results.filter(isFavorite),
    [isFavorite, search.results]
  );
  const { scheduleByProjectId } = scheduled;
  const scheduledRows = React.useMemo<PanelRow[]>(
    () =>
      (scheduled.items ?? []).map(({ project, schedule }) => ({
        project,
        time: getScheduleTime(schedule),
      })),
    [scheduled.items]
  );
  const scheduledSearchRows = React.useMemo<PanelRow[]>(
    () =>
      search.results.flatMap(project => {
        const schedule = scheduleByProjectId.get(project.id);
        return schedule ? [{ project, time: getScheduleTime(schedule) }] : [];
      }),
    [scheduleByProjectId, search.results]
  );
  const recentRows = React.useMemo(() => toRows(projects), [projects]);
  const searchRows = React.useMemo(
    () => toRows(search.results),
    [search.results]
  );
  const favoriteRows = React.useMemo(
    () => toRows(favorites.favorites ?? []),
    [favorites.favorites]
  );
  const favoriteSearchRows = React.useMemo(
    () => toRows(favoriteSearchResults),
    [favoriteSearchResults]
  );

  // The scheduler route is admin+, so regular users never see this tab.
  const activeTab: RecentTab =
    tab === 'scheduled' && !scheduled.enabled ? 'recent' : tab;
  const filteredProjects =
    activeTab === 'scheduled'
      ? isSearching
        ? scheduledSearchRows
        : scheduledRows
      : activeTab === 'favorites'
        ? isSearching
          ? favoriteSearchRows
          : favorites.favorites
            ? favoriteRows
            : NO_ROWS
        : isSearching
          ? searchRows
          : recentRows;
  const shownProjects = filteredProjects.slice(
    0,
    expanded ? expandedCount : initialCount
  );
  const canExpand = filteredProjects.length > initialCount;

  const handleToggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    onExpandedChange?.(next);
  };

  const createButton = (
    <ButtonBase disableRipple onClick={onCreateProject} sx={newButtonSx}>
      <AddRoundedIcon sx={{ fontSize: 16 }} />
      Новый проект
    </ButtonBase>
  );

  if (loading || error) {
    return (
      <Box
        component='section'
        aria-busy={loading}
        sx={{ ...homeCardSx, ...homeAppearSx(180), p: 0.75 }}
      >
        <Box sx={toolbarSx}>
          <Box component='span' sx={{ ...tabSx, ...tabActiveSx }}>
            Недавние
          </Box>
          <Box component='span' sx={tabSx}>
            Избранные
          </Box>
          {scheduled.enabled ? (
            <Box component='span' sx={tabSx}>
              По расписанию
            </Box>
          ) : null}
          <Box sx={{ flex: 1 }} />
          {createButton}
        </Box>
        {loading ? (
          <SkeletonRows count={initialCount} />
        ) : (
          <PanelLoadError
            minRows={initialCount}
            onRetry={onRetry}
            title='Не удалось загрузить проекты'
            text='Ваши проекты в безопасности — просто не получилось их показать. Попробуйте ещё раз.'
          />
        )}
      </Box>
    );
  }

  if (!projects.length) {
    return (
      <RecentProjectsOnboarding
        minHeight={
          initialCount * RECENT_ROW_HEIGHT +
          COLUMN_HEADER_HEIGHT +
          FOOTER_HEIGHT +
          TOOLBAR_HEIGHT
        }
        onCreateProject={onCreateProject}
      />
    );
  }

  const tabs: { count: number | null; id: RecentTab; label: string }[] = [
    { id: 'recent', label: 'Недавние', count: projects.length },
    {
      id: 'favorites',
      label: 'Избранные',
      count: favorites.favorites ? favorites.favorites.length : null,
    },
    ...(scheduled.enabled
      ? [
          {
            id: 'scheduled' as const,
            label: 'По расписанию',
            count: scheduled.items ? scheduled.items.length : null,
          },
        ]
      : []),
  ];
  const scheduledPending =
    activeTab === 'scheduled' && (scheduled.loading || !scheduled.items);
  const searchPending = isSearching && (search.loading || search.failed);
  const favoritesPending =
    activeTab === 'favorites' &&
    !isSearching &&
    (favorites.loading || !favorites.favorites);

  const emptyText = isSearching
    ? 'Ничего не найдено'
    : activeTab === 'scheduled'
      ? 'Нет проектов по расписанию — настройте расписание в проекте, и он появится здесь'
      : activeTab === 'favorites'
        ? 'В избранном пока пусто — отметьте проект звёздочкой, чтобы он появился здесь'
        : 'Проектов пока нет — создайте свой первый проект';

  return (
    <Box
      component='section'
      sx={{ ...homeCardSx, ...homeAppearSx(180), p: 0.75 }}
    >
      <Box sx={toolbarSx} role='tablist' aria-label='Проекты'>
        {tabs.map(item => (
          <ButtonBase
            disableRipple
            key={item.id}
            role='tab'
            aria-selected={activeTab === item.id}
            onClick={() => setTab(item.id)}
            sx={{
              ...tabSx,
              ...(activeTab === item.id ? tabActiveSx : null),
              '&:hover': {
                color: hc.brand,
                backgroundColor:
                  activeTab === item.id ? hc.brandSoft : hc.brandHover,
              },
            }}
          >
            {item.label}
            {item.count == null ? null : (
              <Box
                component='span'
                sx={{
                  fontSize: 11,
                  fontVariantNumeric: 'tabular-nums',
                  color: activeTab === item.id ? hc.brandIcon : hc.ink4,
                }}
              >
                {item.count}
              </Box>
            )}
          </ButtonBase>
        ))}
        <Box sx={{ flex: 1 }} />
        <Box
          component='label'
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            height: 30,
            px: '9px',
            borderRadius: '8px',
            border: `1px solid ${hc.line}`,
            color: hc.ink3,
            width: { xs: '100%', sm: 220 },
            order: { xs: 10, sm: 0 },
            transition: 'border-color .15s',
            '&:focus-within': { borderColor: hc.brandFocus },
          }}
        >
          <SearchRoundedIcon sx={{ fontSize: 16 }} />
          <InputBase
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder='Поиск по проектам'
            inputProps={{ 'aria-label': 'Поиск по проектам' }}
            sx={{
              flex: 1,
              fontSize: 12.5,
              color: hc.ink,
              '& input': { p: 0, height: 'auto' },
              '& input::placeholder': { color: hc.ink3, opacity: 1 },
            }}
          />
        </Box>
        {createButton}
      </Box>

      {scheduledPending ? (
        scheduled.loading || !scheduled.error ? (
          <SkeletonRows count={initialCount} />
        ) : (
          <PanelLoadError
            minRows={initialCount}
            onRetry={scheduled.reload}
            title='Не удалось загрузить расписания'
            text='Планировщик сейчас недоступен. Попробуйте ещё раз чуть позже.'
          />
        )
      ) : favoritesPending ? (
        favorites.loading ? (
          <SkeletonRows count={initialCount} />
        ) : (
          <PanelLoadError
            minRows={initialCount}
            onRetry={favorites.reload}
            title='Не удалось загрузить избранное'
            text='Проверьте подключение и попробуйте ещё раз.'
          />
        )
      ) : searchPending ? (
        search.loading ? (
          <SkeletonRows count={initialCount} />
        ) : (
          <PanelLoadError
            minRows={initialCount}
            onRetry={search.retry}
            title='Не удалось выполнить поиск'
            text='Проверьте подключение и попробуйте ещё раз.'
          />
        )
      ) : (
        <>
          <ColumnHeader
            hidden={filteredProjects.length === 0}
            timeLabel={activeTab === 'scheduled' ? 'Запуск' : 'Открыт'}
          />

          <Box
            sx={{
              minHeight: initialCount * RECENT_ROW_HEIGHT,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {shownProjects.map(({ project, time }, index) => (
              <RecentProjectRow
                key={project.id}
                animationDelayMs={
                  index < initialCount ? 0 : (index - initialCount) * 25
                }
                favorite={isFavorite(project)}
                onToggleFavorite={onToggleFavorite}
                project={project}
                time={time}
              />
            ))}
            {shownProjects.length === 0 ? (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2,
                  textAlign: 'center',
                  fontSize: 13,
                  color: hc.ink3,
                  textWrap: 'pretty',
                }}
              >
                {emptyText}
              </Box>
            ) : null}
          </Box>

          {canExpand ? (
            <ButtonBase
              disableRipple
              onClick={handleToggleExpanded}
              sx={moreButtonSx}
            >
              {expanded
                ? 'Свернуть'
                : `Ещё ${Math.min(filteredProjects.length, expandedCount) - initialCount}`}
              <KeyboardArrowDownRoundedIcon
                sx={{
                  fontSize: 16,
                  transform: expanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform .2s',
                }}
              />
            </ButtonBase>
          ) : (
            <ButtonBase disableRipple disabled sx={moreButtonSx}>
              {filteredProjects.length ? 'Показаны все проекты' : ' '}
            </ButtonBase>
          )}
        </>
      )}
    </Box>
  );
};

const SkeletonRows = ({ count }: { count: number }) => (
  <>
    <ColumnHeader />
    {SKELETON_NAME_WIDTHS.slice(0, count).map((width, index) => (
      <Box
        key={width}
        sx={{
          display: 'grid',
          gridTemplateColumns: RECENT_ROW_COLUMNS,
          gap: 1.5,
          alignItems: 'center',
          px: 1.5,
          height: RECENT_ROW_HEIGHT,
          boxShadow: `inset 0 -1px 0 ${hc.rowLine}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <Sk width={7} height={7} radius={99} />
          <Sk width={width} height={10} />
        </Box>
        <Box sx={{ display: 'flex', gap: '2px' }}>
          {Array.from({ length: 7 }, (_, tick) => (
            <Sk key={tick} width={4} height={12} radius={1.5} />
          ))}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Sk width={SKELETON_DATE_WIDTHS[index] ?? 56} height={9} />
        </Box>
        <span />
      </Box>
    ))}
    <Box
      sx={{
        height: FOOTER_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Sk width={64} height={9} />
    </Box>
  </>
);

const PanelLoadError = ({
  minRows,
  onRetry,
  text,
  title,
}: {
  minRows: number;
  onRetry: () => void;
  text: string;
  title: string;
}) => (
  <Box
    sx={{
      minHeight:
        minRows * RECENT_ROW_HEIGHT + COLUMN_HEADER_HEIGHT + FOOTER_HEIGHT,
      display: 'flex',
    }}
  >
    <HomeLoadError title={title} text={text} onRetry={onRetry} />
  </Box>
);

const ColumnHeader = ({
  hidden = false,
  timeLabel = 'Открыт',
}: {
  hidden?: boolean;
  timeLabel?: string;
}) => (
  <Box
    aria-hidden
    sx={{
      display: 'grid',
      gridTemplateColumns: RECENT_ROW_COLUMNS,
      gap: 1.5,
      px: 1.5,
      pt: 0.5,
      pb: 0.75,
      height: COLUMN_HEADER_HEIGHT,
      boxSizing: 'border-box',
      fontSize: 11,
      lineHeight: '13px',
      color: hc.ink4,
      visibility: hidden ? 'hidden' : 'visible',
    }}
  >
    <span>Проект</span>
    <span>7 запусков</span>
    <Box component='span' sx={{ textAlign: 'right' }}>
      {timeLabel}
    </Box>
    <span />
  </Box>
);

const Sk = ({
  height,
  radius = 5,
  width,
}: {
  height: number;
  radius?: number;
  width: number | string;
}) => (
  <Skeleton
    variant='rounded'
    animation='wave'
    width={width}
    height={height}
    sx={{ borderRadius: `${radius}px`, flexShrink: 0, bgcolor: hc.rowLine }}
  />
);

const toolbarSx = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 0.5,
  px: 1,
  pt: 0.75,
  pb: 1,
} as const;

const tabSx = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.75,
  height: 30,
  px: 1.25,
  borderRadius: '8px',
  fontFamily: 'inherit',
  fontSize: 13,
  color: hc.ink3,
  whiteSpace: 'nowrap',
  flexShrink: 0,
  transition: 'background-color .14s, color .14s',
} as const;

const tabActiveSx = {
  backgroundColor: hc.brandSoft,
  color: hc.brand,
  fontWeight: 500,
} as const;

const newButtonSx = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.75,
  height: 30,
  pl: 1.25,
  pr: 1.5,
  borderRadius: '8px',
  backgroundColor: hc.brandSoft,
  color: hc.brand,
  fontFamily: 'inherit',
  fontSize: 12.5,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  flexShrink: 0,
  transition: 'background-color .14s',
  '&:hover': { backgroundColor: hc.brandSoftHover },
  '&:focus-visible': { boxShadow: `0 0 0 2px ${hc.brandFocus}` },
} as const;

const moreButtonSx = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 0.5,
  width: '100%',
  height: FOOTER_HEIGHT,
  mt: '2px',
  borderRadius: '0 0 9px 9px',
  fontFamily: 'inherit',
  fontSize: 12.5,
  color: hc.ink2,
  '&:hover': { color: hc.brand },
  '&.Mui-disabled': { color: hc.ink4, cursor: 'default' },
} as const;
