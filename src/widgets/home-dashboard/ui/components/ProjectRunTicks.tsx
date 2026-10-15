import * as React from 'react';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { Box, ButtonBase } from '@mui/material';

import type { ProjectLastRunSchema } from '@/shared/gatewayClient';

import type { HomeProject } from '../../model/types';
import { formatClock, formatRunDay } from '../lib/date';
import {
  getRecentRuns,
  getRunDuration,
  getRunErrorText,
  getRunStartTime,
  getRunTicks,
  getRunTone,
  getRunToneLabel,
  type HomeRunTone,
  RUN_TICKS_COUNT,
} from '../lib/runs';
import { useDismiss } from '../lib/useDismiss';
import { homePopAppearSx, homeSideAppearSx } from '../styles/motion';
import {
  hc,
  homeEllipsisSx,
  homeMonoFont,
  homePopoverSx,
} from '../styles/tokens';

import { HomePortal } from './HomePortal';
import { StatusDot } from './StatusDot';

const ERROR_LOG_ATTR = 'data-home-run-error-log';
const POPOVER_WIDTH = 280;
const ERROR_LOG_MIN_ROWS = 6;
/** Vertical padding (6px × 2) and border (1px × 2) of the runs popover. */
const POPOVER_CHROME = 14;

const TICK_COLORS: Record<HomeRunTone, string> = {
  ok: hc.okTick,
  err: hc.err,
  warn: hc.warn,
  run: hc.brand,
  queue: hc.line2,
  none: hc.line,
};

const stopEvent = (event: React.SyntheticEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

type ProjectRunTicksProps = {
  project: HomeProject;
};

export const ProjectRunTicks = ({ project }: ProjectRunTicksProps) => {
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const [anchorRect, setAnchorRect] = React.useState<DOMRect | null>(null);
  const ticks = getRunTicks(project);
  const runsCount = ticks.filter(Boolean).length;

  const handleToggle = (event: React.MouseEvent) => {
    stopEvent(event);
    setAnchorRect(current =>
      current ? null : (anchorRef.current?.getBoundingClientRect() ?? null)
    );
  };

  return (
    <Box component='span' sx={{ display: 'flex' }}>
      <ButtonBase
        ref={anchorRef}
        disableRipple
        aria-label={`Последние запуски: ${runsCount} из ${RUN_TICKS_COUNT}`}
        aria-expanded={Boolean(anchorRect)}
        title='Последние запуски'
        onClick={handleToggle}
        sx={{
          display: 'inline-flex',
          gap: '2px',
          p: '4px 5px',
          m: '-4px -5px',
          borderRadius: '6px',
          transformOrigin: 'center',
          transition: 'transform .14s, background-color .14s',
          backgroundColor: anchorRect ? hc.brandSoft : 'transparent',
          transform: anchorRect ? 'scale(1.15)' : 'none',
          '& i': {
            display: 'block',
            width: 4,
            height: 12,
            borderRadius: '1.5px',
            transition: 'filter .14s',
            filter: anchorRect ? 'saturate(2.2) brightness(.8)' : 'none',
          },
          '&:hover': { transform: 'scale(1.15)' },
          '&:hover i': { filter: 'saturate(2.2) brightness(.8)' },
          '&:focus-visible': { boxShadow: `0 0 0 2px ${hc.brandFocus}` },
        }}
      >
        {ticks.map((run, index) => (
          <i
            key={run?.task_id ?? `empty-${index}`}
            style={{
              background: TICK_COLORS[run ? getRunTone(run.status) : 'none'],
            }}
          />
        ))}
      </ButtonBase>
      {anchorRect ? (
        <RunsPopover
          anchorRect={anchorRect}
          anchorRef={anchorRef}
          onClose={() => setAnchorRect(null)}
          project={project}
        />
      ) : null}
    </Box>
  );
};

type RunsPopoverProps = {
  anchorRect: DOMRect;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  project: HomeProject;
};

const RunsPopover = ({
  anchorRect,
  anchorRef,
  onClose,
  project,
}: RunsPopoverProps) => {
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const runs = getRecentRuns(project);

  useDismiss(true, [popoverRef, anchorRef], onClose, {
    closeOnScroll: true,
    ignoreSelector: `[${ERROR_LOG_ATTR}]`,
  });

  const left = Math.max(
    8,
    Math.min(
      window.innerWidth - POPOVER_WIDTH - 8,
      anchorRect.left + anchorRect.width / 2 - POPOVER_WIDTH / 2
    )
  );
  const spaceBelow = window.innerHeight - anchorRect.bottom - 16;
  const spaceAbove = anchorRect.top - 16;
  const below = spaceBelow >= 300 || spaceBelow >= spaceAbove;

  return (
    <HomePortal>
      <Box
        ref={popoverRef}
        role='dialog'
        aria-label={`Последние запуски ${project.name}`}
        onClick={event => event.stopPropagation()}
        sx={{
          ...homePopoverSx,
          ...homePopAppearSx,
          position: 'fixed',
          zIndex: 1400,
          left,
          width: POPOVER_WIDTH,
          ...(below
            ? { top: anchorRect.bottom + 8 }
            : { bottom: window.innerHeight - anchorRect.top + 8 }),
          maxHeight: Math.max(120, below ? spaceBelow : spaceAbove),
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            p: 0.75,
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
          }}
        >
          {runs.length ? (
            runs.map(run => (
              <RunRow
                key={run.task_id}
                popoverRef={popoverRef}
                projectName={project.name}
                run={run}
              />
            ))
          ) : (
            <Box sx={{ p: 1, fontSize: 12.5, color: hc.ink3 }}>
              Запусков не было
            </Box>
          )}
        </Box>
      </Box>
    </HomePortal>
  );
};

const runRowSx = {
  display: 'grid',
  gridTemplateColumns: '8px minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: '9px',
  px: 1,
  py: 0.75,
  borderRadius: '9px',
  fontSize: 12.5,
  color: hc.ink,
} as const;

type RunRowProps = {
  popoverRef: React.RefObject<HTMLDivElement | null>;
  projectName: string;
  run: ProjectLastRunSchema;
};

type ErrorLogBox = {
  height: number;
  left: number;
  top: number;
  width: number;
};

const RunRow = ({ popoverRef, projectName, run }: RunRowProps) => {
  const tone = getRunTone(run.status);
  const startTime = getRunStartTime(run);
  const duration = getRunDuration(run);
  const meta = [startTime != null ? formatRunDay(startTime) : null, duration]
    .filter(Boolean)
    .join(' · ');
  const isError = tone === 'err';
  const [logBox, setLogBox] = React.useState<ErrorLogBox | null>(null);
  const hideTimerRef = React.useRef(0);

  React.useEffect(() => () => window.clearTimeout(hideTimerRef.current), []);

  const showLog = (event: React.SyntheticEvent<HTMLElement>) => {
    window.clearTimeout(hideTimerRef.current);
    const popover = popoverRef.current;

    if (!popover) {
      return;
    }

    const rect = popover.getBoundingClientRect();
    const rowHeight = event.currentTarget.getBoundingClientRect().height;
    const width = Math.round(rect.width * 1.35);
    const gap = 8;
    const fitsRight = rect.right + gap + width <= window.innerWidth - 8;
    // Keep the log readable even for a single run: at least as tall as
    // ERROR_LOG_MIN_ROWS run rows plus the popover chrome.
    const height = Math.min(
      window.innerHeight - 16,
      Math.max(rect.height, rowHeight * ERROR_LOG_MIN_ROWS + POPOVER_CHROME)
    );
    const top = Math.max(
      8,
      Math.min(rect.top, window.innerHeight - 8 - height)
    );

    setLogBox({
      top,
      height,
      width,
      left: fitsRight ? rect.right + gap : Math.max(8, rect.left - gap - width),
    });
  };

  const hideLog = () => {
    window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => setLogBox(null), 120);
  };

  const content = (
    <>
      <StatusDot tone={tone} size={6} />
      <Box component='span' sx={{ ...homeEllipsisSx, minWidth: 0 }}>
        <Box component='span' sx={{ color: isError ? hc.err : hc.ink }}>
          {getRunToneLabel(tone)}
        </Box>
        {meta ? (
          <Box component='span' sx={{ color: hc.ink3 }}>
            {` · ${meta}`}
          </Box>
        ) : null}
      </Box>
      {isError ? (
        <ChevronRightRoundedIcon
          className='home-run-chevron'
          sx={{
            fontSize: 15,
            color: logBox ? hc.brand : hc.ink4,
            mr: '-3px',
            transition: 'color .14s, transform .14s',
          }}
        />
      ) : (
        <span />
      )}
    </>
  );

  if (!isError) {
    return <Box sx={runRowSx}>{content}</Box>;
  }

  return (
    <>
      <Box
        tabIndex={0}
        onMouseEnter={showLog}
        onMouseLeave={hideLog}
        onFocus={showLog}
        onBlur={hideLog}
        sx={{
          ...runRowSx,
          cursor: 'default',
          outline: 'none',
          transition: 'background-color .14s',
          backgroundColor: logBox ? hc.brandHover : 'transparent',
          '&:hover': { backgroundColor: hc.brandHover },
          '&:hover .home-run-chevron': {
            color: hc.brand,
            transform: 'translateX(1px)',
          },
        }}
      >
        {content}
      </Box>
      {logBox ? (
        <RunErrorLog
          box={logBox}
          duration={duration}
          onMouseEnter={() => window.clearTimeout(hideTimerRef.current)}
          onMouseLeave={hideLog}
          projectName={projectName}
          text={getRunErrorText(run)}
          time={
            startTime != null
              ? `${formatRunDay(startTime)}, ${formatClock(startTime)}`
              : null
          }
        />
      ) : null}
    </>
  );
};

type RunErrorLogProps = {
  box: ErrorLogBox;
  duration: string | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  projectName: string;
  text: string;
  time: string | null;
};

const RunErrorLog = ({
  box,
  duration,
  onMouseEnter,
  onMouseLeave,
  projectName,
  text,
  time,
}: RunErrorLogProps) => {
  const [copied, setCopied] = React.useState(false);
  const copiedTimerRef = React.useRef(0);

  React.useEffect(() => () => window.clearTimeout(copiedTimerRef.current), []);

  const handleCopy = () => {
    void navigator.clipboard?.writeText(text);
    setCopied(true);
    window.clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = window.setTimeout(() => setCopied(false), 1400);
  };

  const meta = [time, duration].filter(Boolean).join(' · ');

  return (
    <HomePortal>
      <Box
        {...{ [ERROR_LOG_ATTR]: '' }}
        role='dialog'
        aria-label='Лог ошибки'
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={event => event.stopPropagation()}
        sx={{
          ...homePopoverSx,
          ...homeSideAppearSx,
          position: 'fixed',
          zIndex: 1401,
          top: box.top,
          left: box.left,
          width: box.width,
          height: box.height,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.25,
            px: 1.75,
            pt: 1.5,
            pb: 1,
            flexShrink: 0,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <StatusDot tone='err' size={6} />
              Лог ошибки
            </Box>
            <Box
              sx={{
                ...homeEllipsisSx,
                mt: 0.25,
                fontSize: 12,
                fontFamily: homeMonoFont,
                color: hc.ink2,
              }}
            >
              {projectName}
            </Box>
            {meta ? (
              <Box sx={{ mt: '1px', fontSize: 11.5, color: hc.ink3 }}>
                {meta}
              </Box>
            ) : null}
          </Box>
          <ButtonBase
            disableRipple
            onClick={handleCopy}
            sx={{
              mr: -0.75,
              px: 0.75,
              py: 0.5,
              borderRadius: '7px',
              fontFamily: 'inherit',
              fontSize: 12.5,
              fontWeight: 500,
              color: hc.ink2,
              '&:hover': { color: hc.brand },
            }}
          >
            {copied ? 'Скопировано' : 'Копировать'}
          </ButtonBase>
        </Box>
        <Box
          component='pre'
          sx={{
            flex: 1,
            minHeight: 0,
            m: '0 8px 8px',
            p: '10px 12px',
            borderRadius: '8px',
            backgroundColor: hc.codeBg,
            border: `1px solid ${hc.codeLine}`,
            fontFamily: homeMonoFont,
            fontSize: 11.5,
            lineHeight: 1.6,
            color: hc.ink,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflow: 'auto',
            overscrollBehavior: 'contain',
            userSelect: 'text',
          }}
        >
          {text}
        </Box>
      </Box>
    </HomePortal>
  );
};
