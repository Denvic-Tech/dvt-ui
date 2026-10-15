import * as React from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import { Box, ButtonBase, type SxProps, type Theme } from '@mui/material';

import { useHomeWidgetsPreference } from '@/entities/ui-preferences';

import type { HomeRole } from '../config/sections';
import {
  layoutWidgets,
  toGridArea,
  WIDGET_CELL_HEIGHT,
  WIDGET_GRID_GAP,
} from '../lib/widgetLayout';
import { homeAppearSx } from '../styles/motion';
import { hc, homeCardSx, homeSectionTitleSx } from '../styles/tokens';

import { HomeWidgetPicker } from './HomeWidgetPicker';
import { HomeWidgetShell } from './HomeWidgetShell';
import { getAvailableHomeWidgets, resolveHomeWidgets } from './registry';
import type { HomeWidgetId } from './types';
import { WidgetSkeleton } from './WidgetSkeleton';

const NARROW_QUERY = '(max-width: 900px)';

const getColumns = () =>
  typeof window !== 'undefined' && window.matchMedia?.(NARROW_QUERY).matches
    ? 2
    : 3;

const useWidgetColumns = () => {
  const [columns, setColumns] = React.useState(getColumns);

  React.useEffect(() => {
    const media = window.matchMedia?.(NARROW_QUERY);
    if (!media) {
      return undefined;
    }

    const update = () => setColumns(getColumns());
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return columns;
};

const moveId = (
  ids: readonly HomeWidgetId[],
  draggedId: HomeWidgetId,
  targetId: HomeWidgetId
): HomeWidgetId[] => {
  const next = ids.filter(id => id !== draggedId);
  next.splice(ids.indexOf(targetId), 0, draggedId);
  return next;
};

type HomeWidgetsSectionProps = {
  /**
   * Role of the signed-in user, or `undefined` while it is still loading.
   * Nothing role-gated is mounted (and nothing is fetched) until it resolves.
   */
  role: HomeRole | null | undefined;
};

export const HomeWidgetsSection = ({ role }: HomeWidgetsSectionProps) => {
  const { widgetIds: savedIds, setWidgetIds } = useHomeWidgetsPreference();
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [draggedId, setDraggedId] = React.useState<HomeWidgetId | null>(null);
  // Live order while dragging; committed to preferences on drop.
  const [draftIds, setDraftIds] = React.useState<HomeWidgetId[] | null>(null);
  const columns = useWidgetColumns();

  const available = React.useMemo(
    () => (role === undefined ? [] : getAvailableHomeWidgets(role)),
    [role]
  );
  const widgets = React.useMemo(
    () => resolveHomeWidgets(savedIds, available),
    [available, savedIds]
  );
  const widgetById = React.useMemo(
    () => new Map(available.map(widget => [widget.id, widget])),
    [available]
  );
  const ids = draftIds ?? widgets.map(widget => widget.id);
  const selectedIds = React.useMemo(() => new Set(ids), [ids]);
  const canAdd = available.some(widget => !selectedIds.has(widget.id));

  const layout = React.useMemo(
    () =>
      layoutWidgets(
        ids.flatMap(id => {
          const widget = widgetById.get(id);
          return widget ? [{ id, ...widget.size }] : [];
        }),
        columns
      ),
    [columns, ids, widgetById]
  );

  const handleToggle = (id: HomeWidgetId) => {
    setWidgetIds(
      selectedIds.has(id) ? ids.filter(item => item !== id) : [...ids, id]
    );
  };

  const openPicker = () => setPickerOpen(true);

  if (role === undefined) {
    return (
      <Box
        component='section'
        aria-label='Виджеты'
        aria-busy
        sx={homeAppearSx(240)}
      >
        <Box component='h2' sx={{ ...homeSectionTitleSx, mb: 1.25 }}>
          Виджеты
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridAutoRows: `${WIDGET_CELL_HEIGHT}px`,
            gap: `${WIDGET_GRID_GAP}px`,
          }}
        >
          {Array.from({ length: columns }, (_, index) => (
            <Box
              key={index}
              sx={{ ...homeCardSx, p: '14px 16px 16px', overflow: 'hidden' }}
            >
              <WidgetSkeleton variant='compact-list' />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box component='section' aria-label='Виджеты' sx={homeAppearSx(240)}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.25 }}>
        <Box component='h2' sx={{ ...homeSectionTitleSx, flex: 1 }}>
          Виджеты
        </Box>
        {available.length ? (
          <ButtonBase
            disableRipple
            onClick={openPicker}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              mr: -0.75,
              px: 0.75,
              py: 0.5,
              borderRadius: '7px',
              fontFamily: 'inherit',
              fontSize: 12.5,
              fontWeight: 500,
              color: hc.ink2,
              '&:hover': { color: hc.brand },
              '&:focus-visible': { boxShadow: `0 0 0 2px ${hc.brandFocus}` },
            }}
          >
            <TuneRoundedIcon sx={{ fontSize: 15 }} />
            Выбрать виджеты
          </ButtonBase>
        ) : null}
      </Box>

      {ids.length ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridAutoRows: `${WIDGET_CELL_HEIGHT}px`,
            gap: `${WIDGET_GRID_GAP}px`,
          }}
          onDragOver={event => {
            if (draggedId) {
              event.preventDefault();
            }
          }}
          onDrop={event => event.preventDefault()}
        >
          {ids.map(id => {
            const widget = widgetById.get(id);
            const rect = layout.positions[id];

            if (!widget || !rect) {
              return null;
            }

            return (
              <Box key={id} sx={{ ...toGridArea(rect), minHeight: 0 }}>
                <HomeWidgetShell
                  widget={widget}
                  dragging={draggedId === id}
                  dragHandlers={{
                    onDragStart: event => {
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', id);
                      setDraggedId(id);
                      setDraftIds(ids);
                    },
                    onDragOver: event => {
                      if (!draggedId) {
                        return;
                      }
                      event.preventDefault();
                      if (draggedId !== id) {
                        setDraftIds(current =>
                          moveId(current ?? ids, draggedId, id)
                        );
                      }
                    },
                    onDragEnd: () => {
                      if (draftIds) {
                        setWidgetIds(draftIds);
                      }
                      setDraggedId(null);
                      setDraftIds(null);
                    },
                  }}
                />
              </Box>
            );
          })}
          {canAdd
            ? layout.gaps.map(gap => (
                <AddWidgetTile
                  key={`${gap.row}-${gap.col}`}
                  onClick={openPicker}
                  sx={toGridArea(gap)}
                />
              ))
            : null}
        </Box>
      ) : (
        <AddWidgetTile
          disabled={!available.length}
          hint={
            available.length
              ? 'Выберите виджеты разделов, которыми пользуетесь чаще всего'
              : 'Для вашей роли виджеты пока недоступны'
          }
          onClick={openPicker}
          sx={{ width: '100%', height: WIDGET_CELL_HEIGHT }}
        />
      )}

      <HomeWidgetPicker
        available={available}
        onClose={() => setPickerOpen(false)}
        onToggle={handleToggle}
        open={pickerOpen}
        selectedIds={selectedIds}
      />
    </Box>
  );
};

type AddWidgetTileProps = {
  disabled?: boolean;
  hint?: string;
  onClick: () => void;
  sx: SxProps<Theme>;
};

/** «Добавить виджет» tile used for free grid cells and the empty state. */
const AddWidgetTile = ({
  disabled = false,
  hint,
  onClick,
  sx,
}: AddWidgetTileProps) => (
  <ButtonBase
    disableRipple
    disabled={disabled}
    onClick={onClick}
    sx={[
      {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.25,
        px: 2,
        borderRadius: '14px',
        border: `1px solid ${hc.line}`,
        backgroundColor: 'transparent',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 500,
        color: hc.ink2,
        transition: 'color .15s, border-color .15s, background-color .15s',
        '& .home-widget-add-icon': {
          width: 34,
          height: 34,
          borderRadius: '10px',
          backgroundColor: hc.brandSoft,
          color: hc.brand,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color .15s',
        },
        '&:hover': {
          color: hc.ink,
          borderColor: hc.brandBorder,
          backgroundColor: hc.card,
        },
        '&:hover .home-widget-add-icon': {
          backgroundColor: hc.brandSoftHover,
        },
        '&.Mui-disabled': { color: hc.ink3 },
        '&.Mui-disabled .home-widget-add-icon': {
          backgroundColor: hc.rowLine,
          color: hc.ink4,
        },
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    <span className='home-widget-add-icon'>
      <AddRoundedIcon sx={{ fontSize: 18 }} />
    </span>
    Добавить виджет
    {hint ? (
      <Box
        component='span'
        sx={{ mt: -0.75, fontSize: 12, fontWeight: 400, color: hc.ink3 }}
      >
        {hint}
      </Box>
    ) : null}
  </ButtonBase>
);
