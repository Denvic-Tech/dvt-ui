import * as React from 'react';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import { Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { hc, homeCardSx, homeEllipsisSx } from '../styles/tokens';

import type { HomeWidgetDefinition } from './types';

/**
 * Room around the body for hover fills and scaled elements. With the 16px
 * card padding, list rows can span the card leaving a 6px inset, like the
 * «Продолжить работу» list (see `WIDGET_ROW_BLEED`).
 */
const BODY_BLEED = 10;

export type HomeWidgetDragHandlers = {
  onDragEnd: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDragStart: (event: React.DragEvent) => void;
};

type HomeWidgetShellProps = {
  dragging: boolean;
  dragHandlers: HomeWidgetDragHandlers;
  widget: HomeWidgetDefinition;
};

/**
 * Widget card: header with drag handle, title and «Открыть» link, plus the
 * widget body. Dragging is armed only from the header so lists and charts
 * inside the body stay clickable.
 */
export const HomeWidgetShell = ({
  dragging,
  dragHandlers,
  widget,
}: HomeWidgetShellProps) => {
  const [armed, setArmed] = React.useState(false);
  const { Body } = widget;

  return (
    <Box
      component='section'
      aria-label={widget.title}
      draggable={armed}
      onDragStart={dragHandlers.onDragStart}
      onDragOver={dragHandlers.onDragOver}
      onDragEnd={() => {
        setArmed(false);
        dragHandlers.onDragEnd();
      }}
      sx={{
        ...homeCardSx,
        height: '100%',
        p: '14px 16px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        overflow: 'hidden',
        opacity: dragging ? 0.35 : 1,
        boxShadow: dragging ? 'none' : homeCardSx.boxShadow,
        transition: 'box-shadow .2s, border-color .2s, opacity .15s',
        '&:hover': { borderColor: hc.brandBorder },
        '&:hover .home-widget-handle': { color: hc.brand },
      }}
    >
      <Box
        component='header'
        onMouseDown={event => {
          if (!(event.target as Element).closest('a, button')) {
            setArmed(true);
          }
        }}
        onMouseUp={() => setArmed(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          height: 24,
          flexShrink: 0,
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <Box
          component='span'
          className='home-widget-handle'
          title='Перетащите, чтобы изменить порядок'
          sx={{
            display: 'flex',
            ml: '-6px',
            mr: '-2px',
            color: hc.ink4,
            transition: 'color .15s',
          }}
        >
          <DragIndicatorRoundedIcon sx={{ fontSize: 16 }} />
        </Box>
        <Box
          component='h3'
          sx={{
            ...homeEllipsisSx,
            m: 0,
            flex: 1,
            fontSize: 13.5,
            fontWeight: 600,
            letterSpacing: '-0.1px',
            color: hc.ink,
          }}
        >
          {widget.title}
        </Box>
        {widget.to ? (
          <Box
            component={RouterLink}
            to={widget.to}
            draggable={false}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.25,
              mr: -0.75,
              px: 0.75,
              py: 0.5,
              borderRadius: '7px',
              fontSize: 12.5,
              fontWeight: 500,
              color: hc.ink2,
              textDecoration: 'none',
              cursor: 'pointer',
              '&:hover, &:focus-visible': { color: hc.brand, outline: 'none' },
            }}
          >
            Открыть
            <ChevronRightRoundedIcon sx={{ fontSize: 15 }} />
          </Box>
        ) : null}
      </Box>
      {/* The clip box bleeds into the card padding so hover backgrounds and
          scaled chart bars at the edges are not cut off. */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          m: `-${BODY_BLEED}px`,
          p: `${BODY_BLEED}px`,
        }}
      >
        <Body />
      </Box>
    </Box>
  );
};
