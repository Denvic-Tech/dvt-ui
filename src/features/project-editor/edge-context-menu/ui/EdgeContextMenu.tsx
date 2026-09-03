import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Paper,
  Theme,
} from '@mui/material';
import { useReactFlow } from '@xyflow/react';
import { createPortal } from 'react-dom';

import {
  EdgeContextMenuActionItem,
  EdgeContextMenuBuildContext,
  EdgeContextMenuItem,
  EdgeContextMenuSubmenuItem,
  useEdgeContextMenuItems,
} from '@/app/providers/edge-extensions';
import { useAppDispatch } from '@/app/providers/store';

import {
  useEdgeContextMenuActions,
  useEdgeContextMenuState,
} from '@/entities/project-editor/edge-context-menu';
import { CustomNodeType } from '@/entities/project-editor/graph';

const MENU_Z_INDEX = (theme: Theme) => theme.zIndex.tooltip + 110;
const SUBMENU_GAP = 8;
const CLOSE_DELAY = 150;

const ArrowIcon = () => <ChevronRightIcon fontSize='small' />;

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

const ActionMenuItem: React.FC<{
  item: EdgeContextMenuActionItem;
  context: EdgeContextMenuBuildContext;
}> = ({ item, context }) => {
  const handleClick = useCallback(async () => {
    if (item.disabled) return;
    try {
      await item.onSelect(context);
    } catch (error) {
      console.error('Edge context menu action failed', error);
    } finally {
      if (item.closeOnSelect !== false) {
        context.closeMenu();
      }
    }
  }, [context, item]);

  return (
    <MenuItem
      onClick={handleClick}
      disabled={item.disabled ?? false}
      title={item.tooltip}
      dense
    >
      {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
      <ListItemText primary={item.label} />
    </MenuItem>
  );
};

interface SubmenuPanelProps {
  item: EdgeContextMenuSubmenuItem;
  context: EdgeContextMenuBuildContext;
  anchorRect: DOMRect;
  depth: number;
  cancelClose: () => void;
  scheduleClose: () => void;
}

const SubmenuPanel: React.FC<SubmenuPanelProps> = ({
  item,
  context,
  anchorRect,
  depth,
  cancelClose,
  scheduleClose,
}) => {
  const portalContainerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  if (!portalContainerRef.current) {
    portalContainerRef.current = document.createElement('div');
  }

  useEffect(() => {
    const el = portalContainerRef.current!;
    document.body.appendChild(el);
    return () => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    };
  }, []);

  useEffect(() => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    const { dx, dy } = clampPosition(
      rect,
      window.innerWidth,
      window.innerHeight
    );
    panelRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
  }, [anchorRect, item]);

  const top = anchorRect.top;
  const left = anchorRect.right + SUBMENU_GAP;

  return createPortal(
    <Paper
      data-edge-context-menu-root='true'
      ref={panelRef}
      onPointerEnter={cancelClose}
      onPointerLeave={scheduleClose}
      sx={theme => ({
        position: 'fixed',
        top,
        left,
        minWidth: item.width ?? 200,
        maxWidth: 360,
        zIndex: MENU_Z_INDEX(theme) + depth + 1,
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
        overflow: 'hidden',
      })}
    >
      {item.renderContent ? (
        <Box>{item.renderContent(context)}</Box>
      ) : (
        <MenuList dense disablePadding={!item.disableListPadding}>
          {item.items?.map(child => (
            <ContextMenuItemRenderer
              key={child.id}
              item={child}
              context={context}
              depth={depth + 1}
            />
          ))}
        </MenuList>
      )}
    </Paper>,
    portalContainerRef.current!
  );
};

const ContextMenuItemRenderer: React.FC<{
  item: EdgeContextMenuItem;
  context: EdgeContextMenuBuildContext;
  depth: number;
}> = ({ item, context, depth }) => {
  const anchorRef = useRef<HTMLLIElement | null>(null);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleClose = useCallback(() => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
    }
    closeTimeout.current = setTimeout(() => {
      setSubmenuOpen(false);
    }, CLOSE_DELAY);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimeout.current) {
        clearTimeout(closeTimeout.current);
      }
    };
  }, []);

  if (item.type === 'separator') {
    return (
      <Divider
        sx={{
          my: 0.5,
        }}
      />
    );
  }

  if (item.type === 'action') {
    return <ActionMenuItem item={item} context={context} />;
  }

  return (
    <Fragment>
      <MenuItem
        component='li'
        ref={anchorRef}
        onMouseEnter={() => {
          cancelClose();
          setSubmenuOpen(true);
        }}
        onMouseLeave={scheduleClose}
        disabled={Boolean(item.disabled)}
        title={item.tooltip}
        dense
      >
        {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
        <ListItemText primary={item.label} />
        <ArrowIcon />
      </MenuItem>
      {submenuOpen && anchorRef.current && (
        <SubmenuPanel
          item={item}
          context={context}
          anchorRect={anchorRef.current.getBoundingClientRect()}
          depth={depth}
          cancelClose={cancelClose}
          scheduleClose={scheduleClose}
        />
      )}
    </Fragment>
  );
};

export const EdgeContextMenu: React.FC = () => {
  const { close: closeMenu } = useEdgeContextMenuActions();
  const state = useEdgeContextMenuState();
  const dispatch = useAppDispatch();
  const reactFlow = useReactFlow<CustomNodeType>();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const skipRedispatchRef = useRef(false);
  const [visible, setVisible] = useState(false);

  const context = useMemo<EdgeContextMenuBuildContext | null>(() => {
    if (!state.edge) {
      return null;
    }
    return {
      edge: state.edge,
      flowPosition: state.flowPosition,
      geometry: state.geometry,
      closeMenu,
      dispatch,
      reactFlow,
    };
  }, [
    closeMenu,
    dispatch,
    reactFlow,
    state.edge,
    state.flowPosition,
    state.geometry,
  ]);

  const items = useEdgeContextMenuItems(state.edge, context);

  useEffect(() => {
    if (state.open) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [state.open]);

  useEffect(() => {
    if (!state.open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (skipRedispatchRef.current) {
        skipRedispatchRef.current = false;
        return;
      }

      const path = event.composedPath() as HTMLElement[];
      if (
        path.some(
          node =>
            (node as HTMLElement)?.dataset?.['edgeContextMenuRoot'] === 'true'
        )
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (containerRef.current) {
        containerRef.current.style.visibility = 'hidden';
        containerRef.current.style.pointerEvents = 'none';
      }

      setVisible(false);
      closeMenu();

      if (event.button !== 0) {
        return;
      }

      const pointerInit = {
        bubbles: true,
        cancelable: event.cancelable,
        composed: event.composed,
        button: event.button,
        buttons: event.buttons,
        clientX: event.clientX,
        clientY: event.clientY,
        screenX: event.screenX,
        screenY: event.screenY,
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        isPrimary: event.isPrimary,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        view: window,
      };

      const mouseInit = {
        bubbles: true,
        cancelable: event.cancelable,
        composed: event.composed,
        button: event.button,
        buttons: event.buttons,
        clientX: event.clientX,
        clientY: event.clientY,
        screenX: event.screenX,
        screenY: event.screenY,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        view: window,
      };

      const nextTarget = document.elementFromPoint(
        event.clientX,
        event.clientY
      ) as HTMLElement | null;

      if (!nextTarget) {
        return;
      }

      skipRedispatchRef.current = true;
      nextTarget.dispatchEvent(new PointerEvent('pointerdown', pointerInit));
      nextTarget.dispatchEvent(new MouseEvent('mousedown', mouseInit));
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [closeMenu, state.open]);

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
  }, [items, state.open, state.position, visible]);

  if (!visible || !state.position || !context || items.length === 0) {
    return null;
  }

  return createPortal(
    <Box
      data-edge-context-menu-root='true'
      ref={containerRef}
      sx={theme => ({
        position: 'fixed',
        top: state.position!.y,
        left: state.position!.x,
        zIndex: MENU_Z_INDEX(theme),
      })}
      onContextMenu={event => event.preventDefault()}
    >
      <Paper
        sx={theme => ({
          minWidth: 220,
          maxWidth: 360,
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
        })}
      >
        <MenuList dense disablePadding>
          {items.map(item => (
            <ContextMenuItemRenderer
              key={item.id}
              item={item}
              context={context}
              depth={0}
            />
          ))}
        </MenuList>
      </Paper>
    </Box>,
    document.body
  );
};

EdgeContextMenu.displayName = 'EdgeContextMenu';
