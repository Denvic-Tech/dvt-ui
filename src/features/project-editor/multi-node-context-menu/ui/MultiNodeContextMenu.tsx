import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Box, MenuItem, Paper, Theme } from '@mui/material';
import { createPortal } from 'react-dom';

import { useAppDispatch } from '@/app/providers/store';

import {
  useMultiNodeContextMenuActions,
  useMultiNodeContextMenuState,
} from '@/entities/project-editor/multi-node-context-menu';

import {
  buildMultiNodeMenuItems,
  type MultiNodeMenuItem,
  type MultiNodeMenuItemFactory,
} from '../model/items';

type MultiNodeContextMenuProps = {
  onDeleteNodes: (nodeIDs: string[]) => Promise<void>;
  onCreateSubgraph: (nodeIDs: string[]) => Promise<void>;
  itemFactories?: MultiNodeMenuItemFactory[];
};

type IconPalette = {
  bg: string;
  hoverBg: string;
  color: string;
  hoverColor: string;
};

const ICON_PALETTES: Record<'default' | 'primary' | 'error', IconPalette> = {
  default: {
    bg: '#f3f4f6',
    hoverBg: '#dcfce7',
    color: '#6b7280',
    hoverColor: '#22c55e',
  },
  primary: {
    bg: '#dcfce7',
    hoverBg: '#bbf7d0',
    color: '#22c55e',
    hoverColor: '#16a34a',
  },
  error: {
    bg: '#fee2e2',
    hoverBg: '#fecaca',
    color: '#ef4444',
    hoverColor: '#dc2626',
  },
};

const resolvePalette = (itemID: string, danger?: boolean): IconPalette => {
  if (danger) {
    return ICON_PALETTES.error;
  }
  if (itemID === 'create-subgraph') {
    return ICON_PALETTES.primary;
  }
  return ICON_PALETTES.default;
};

const EMPTY_MULTI_NODE_MENU_ITEMS: MultiNodeMenuItem[] = [];
const MENU_Z_INDEX = (theme: Theme) => theme.zIndex.tooltip + 100;
const CLICK_AWAY_GUARD_MS = 180;

const clampPosition = (
  rect: DOMRect,
  viewportWidth: number,
  viewportHeight: number
) => {
  let dx = 0;
  let dy = 0;

  if (rect.right > viewportWidth - 4) {
    dx = viewportWidth - 4 - rect.right;
  }
  if (rect.left + dx < 4) {
    dx = 4 - rect.left;
  }

  if (rect.bottom > viewportHeight - 4) {
    dy = viewportHeight - 4 - rect.bottom;
  }
  if (rect.top + dy < 4) {
    dy = 4 - rect.top;
  }

  return { dx, dy };
};

const MultiNodeContextMenu_: React.FC<MultiNodeContextMenuProps> = ({
  onDeleteNodes,
  onCreateSubgraph,
  itemFactories,
}) => {
  const dispatch = useAppDispatch();
  const { close: closeMenu } = useMultiNodeContextMenuActions();
  const state = useMultiNodeContextMenuState();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const openedAtRef = useRef(0);
  const [visible, setVisible] = useState(false);
  const isMenuSessionActive = Boolean(
    state.open && state.position && state.nodeIDs.length > 0
  );

  const context = useMemo(
    () =>
      isMenuSessionActive
        ? {
            nodeIDs: state.nodeIDs,
            dispatch,
            closeMenu,
            onDeleteNodes,
            onCreateSubgraph,
          }
        : null,
    [
      closeMenu,
      dispatch,
      isMenuSessionActive,
      onCreateSubgraph,
      onDeleteNodes,
      state.nodeIDs,
    ]
  );

  const items = useMemo(
    () =>
      context
        ? buildMultiNodeMenuItems(context, itemFactories)
        : EMPTY_MULTI_NODE_MENU_ITEMS,
    [context, itemFactories]
  );

  const open = Boolean(context && items.length > 0);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }

    openedAtRef.current = Date.now();
    setVisible(true);
  }, [open]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const shouldIgnoreInitialEvent = () =>
      Date.now() - openedAtRef.current < CLICK_AWAY_GUARD_MS;

    const isInsideMenu = (target: EventTarget | null) => {
      const element = target as Node | null;
      return Boolean(element && containerRef.current?.contains(element));
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (shouldIgnoreInitialEvent() || isInsideMenu(event.target)) {
        return;
      }

      setVisible(false);
      closeMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      setVisible(false);
      closeMenu();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [closeMenu, visible]);

  useEffect(() => {
    if (!visible || !containerRef.current) {
      return;
    }

    containerRef.current.style.visibility = 'visible';
    containerRef.current.style.pointerEvents = 'auto';

    const rect = containerRef.current.getBoundingClientRect();
    const { dx, dy } = clampPosition(
      rect,
      window.innerWidth,
      window.innerHeight
    );
    containerRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
  }, [items, state.position, visible]);

  if (!visible || !state.position || !context || items.length === 0) {
    return null;
  }

  return createPortal(
    <Box
      data-multi-node-context-menu-root='true'
      ref={containerRef}
      sx={theme => ({
        position: 'fixed',
        top: state.position!.y,
        left: state.position!.x,
        zIndex: MENU_Z_INDEX(theme),
      })}
      onPointerDown={event => event.stopPropagation()}
      onMouseDown={event => event.stopPropagation()}
      onClick={event => event.stopPropagation()}
      onContextMenu={event => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <Paper
        sx={{
          minWidth: 200,
          maxWidth: 280,
          borderRadius: '14px',
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
          p: '5px',
        }}
      >
        {items.map(item => {
          const palette = resolvePalette(item.id, item.danger);
          const disabled = Boolean(item.disabled);

          return (
            <MenuItem
              key={item.id}
              disableRipple
              disabled={disabled}
              onClick={async () => {
                try {
                  await item.onSelect(context);
                } catch (error) {
                  console.error('Multi-node context menu action failed', error);
                } finally {
                  closeMenu();
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                py: '6px',
                px: '10px',
                borderRadius: '10px',
                transition: 'all 120ms ease',
                '&.Mui-disabled': {
                  opacity: 0.5,
                },
                '&:not(.Mui-disabled):hover': {
                  backgroundColor: '#f5f5f5',
                  '.multi-node-menu-icon-box': {
                    backgroundColor: palette.hoverBg,
                  },
                  '.multi-node-menu-icon': {
                    color: palette.hoverColor,
                  },
                  '.multi-node-menu-label': {
                    color: '#111827',
                  },
                },
                '&:not(.Mui-disabled):active': {
                  backgroundColor: '#eeeeee',
                  transform: 'scale(0.98)',
                },
              }}
            >
              {item.icon ? (
                <Box
                  className='multi-node-menu-icon-box'
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: '7px',
                    backgroundColor: palette.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 120ms ease',
                    '.MuiSvgIcon-root': {
                      fontSize: 15,
                    },
                  }}
                >
                  <Box
                    className='multi-node-menu-icon'
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color: palette.color,
                      transition: 'color 120ms ease',
                    }}
                  >
                    {item.icon}
                  </Box>
                </Box>
              ) : null}

              <Box
                component='span'
                className='multi-node-menu-label'
                sx={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#4b5563',
                  transition: 'color 120ms ease',
                }}
              >
                {item.label}
              </Box>
            </MenuItem>
          );
        })}
      </Paper>
    </Box>,
    document.body
  );
};

export const MultiNodeContextMenu = memo(MultiNodeContextMenu_);
MultiNodeContextMenu.displayName = 'MultiNodeContextMenu';
