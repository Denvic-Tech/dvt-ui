import React, {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Box, Theme } from '@mui/material';
import { createPortal } from 'react-dom';

import {
  NodeContextMenuActionItem,
  NodeContextMenuBuildContext,
  NodeContextMenuItem,
  NodeContextMenuSubmenuItem,
  NodeContextMenuToggleItem,
  useNodeContextMenuItems,
  useNodeVariables,
} from '@/app/providers/node-extensions';
import { useAppDispatch } from '@/app/providers/store';

import { useNodeData } from '@/features/node/manage-node-data';

import {
  useNodeContextMenuActions,
  useNodeContextMenuState,
} from '@/entities/project-editor/node-context-menu';

import {
  IconWrapper,
  MenuContainer,
  MenuDivider,
  MenuItemLabel,
  MenuItemWrapper,
  SubmenuArrow,
  ToggleItemContent,
  ToggleItemSwitch,
  ToggleItemText,
} from './styles';

const MENU_Z_INDEX = (theme: Theme) => theme.zIndex.tooltip + 100;
const SUBMENU_GAP = 8;
const CLOSE_DELAY = 150;

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

const getIconVariant = (
  item: NodeContextMenuItem
): 'default' | 'primary' | 'error' => {
  if (item.type === 'separator') return 'default';

  // Проверяем id для определения варианта
  if (item.id === 'run-to-node') return 'primary';
  if (item.id === 'cancel-execution') return 'error';

  return 'default';
};

interface ContextMenuItemRendererProps {
  item: NodeContextMenuItem;
  context: NodeContextMenuBuildContext;
  depth: number;
}

interface NodeContextMenuProps {
  duplicateNode?: (nodeID: string) => Promise<void>;
}

const ActionMenuItem: React.FC<{
  item: NodeContextMenuActionItem;
  context: NodeContextMenuBuildContext;
}> = ({ item, context }) => {
  const handleClick = useCallback(async () => {
    if (item.disabled) return;
    try {
      await item.onSelect(context);
    } catch (error) {
      console.error('Node context menu action failed', error);
    } finally {
      if (item.closeOnSelect !== false) {
        context.closeMenu();
      }
    }
  }, [context, item]);

  const variant = getIconVariant(item);

  return (
    <MenuItemWrapper
      onClick={handleClick}
      disabled={item.disabled ?? false}
      title={item.tooltip}
    >
      {item.icon && <IconWrapper variant={variant}>{item.icon}</IconWrapper>}
      <MenuItemLabel>{item.label}</MenuItemLabel>
    </MenuItemWrapper>
  );
};

const ToggleMenuItem: React.FC<{
  item: NodeContextMenuToggleItem;
  context: NodeContextMenuBuildContext;
}> = ({ item, context }) => {
  const handleToggle = useCallback(
    async (nextChecked: boolean) => {
      if (item.disabled) return;
      try {
        await item.onToggle(context, nextChecked);
      } catch (error) {
        console.error('Node context menu toggle failed', error);
      } finally {
        if (item.closeOnToggle === true) {
          context.closeMenu();
        }
      }
    },
    [context, item]
  );

  const handleRowClick = useCallback(() => {
    void handleToggle(!item.checked);
  }, [handleToggle, item.checked]);

  const handleSwitchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      event.stopPropagation();
      void handleToggle(checked);
    },
    [handleToggle]
  );

  const handleSwitchClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
    },
    []
  );

  const variant = getIconVariant(item);

  return (
    <MenuItemWrapper
      onClick={handleRowClick}
      disabled={item.disabled ?? false}
      title={item.tooltip}
    >
      {item.icon && <IconWrapper variant={variant}>{item.icon}</IconWrapper>}
      <ToggleItemContent>
        <ToggleItemText>{item.label}</ToggleItemText>
        <ToggleItemSwitch
          checked={item.checked}
          onChange={handleSwitchChange}
          onClick={handleSwitchClick}
          disableRipple
        />
      </ToggleItemContent>
    </MenuItemWrapper>
  );
};

interface SubmenuPanelProps {
  items: NodeContextMenuItem[];
  context: NodeContextMenuBuildContext;
  anchorRect: DOMRect;
  depth: number;
  cancelClose: () => void;
  scheduleClose: () => void;
}

const SubmenuPanel: React.FC<SubmenuPanelProps> = ({
  items,
  context,
  anchorRect,
  depth,
  cancelClose,
  scheduleClose,
}) => {
  const portalRef = useRef<HTMLDivElement | null>(null);

  if (!portalRef.current) {
    portalRef.current = document.createElement('div');
  }

  useEffect(() => {
    const el = portalRef.current!;
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  const top = anchorRect.top;
  const left = anchorRect.right + SUBMENU_GAP;

  const content = (
    <Box
      data-node-context-menu-root='true'
      sx={theme => ({
        position: 'fixed',
        top,
        left,
        zIndex: MENU_Z_INDEX(theme) + depth,
      })}
      onContextMenu={event => event.preventDefault()}
      onPointerEnter={cancelClose}
      onPointerLeave={scheduleClose}
    >
      <MenuContainer>
        {items.length === 0 ? (
          <MenuItemWrapper disabled>
            <MenuItemLabel>Нет действий</MenuItemLabel>
          </MenuItemWrapper>
        ) : (
          items.map(child => (
            <ContextMenuItemRenderer
              key={child.id}
              item={child}
              context={context}
              depth={depth}
            />
          ))
        )}
      </MenuContainer>
    </Box>
  );

  return createPortal(content, portalRef.current);
};

const SubmenuMenuItem: React.FC<{
  item: NodeContextMenuSubmenuItem;
  context: NodeContextMenuBuildContext;
  depth: number;
}> = ({ item, context, depth }) => {
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const closeTimerRef = useRef<number>();

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = undefined;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => {
      setAnchorRect(null);
    }, CLOSE_DELAY);
  }, [cancelClose]);

  const openFromElement = useCallback(
    (element: HTMLElement) => {
      cancelClose();
      const rect = element.getBoundingClientRect();
      setAnchorRect(rect);
    },
    [cancelClose]
  );

  const handleMouseEnter = useCallback<React.MouseEventHandler<HTMLDivElement>>(
    event => {
      if (item.disabled) return;
      openFromElement(event.currentTarget);
    },
    [item.disabled, openFromElement]
  );

  const handleFocus = useCallback<React.FocusEventHandler<HTMLDivElement>>(
    event => {
      if (item.disabled) return;
      openFromElement(event.currentTarget);
    },
    [item.disabled, openFromElement]
  );

  const handleClick = useCallback<React.MouseEventHandler<HTMLDivElement>>(
    event => {
      if (item.disabled) return;
      openFromElement(event.currentTarget);
    },
    [item.disabled, openFromElement]
  );

  const handleCloseImmediate = useCallback(() => {
    cancelClose();
    setAnchorRect(null);
  }, [cancelClose]);

  useEffect(
    () => () => {
      cancelClose();
    },
    [cancelClose]
  );

  const variant = getIconVariant(item);

  return (
    <Fragment>
      <MenuItemWrapper
        onMouseEnter={handleMouseEnter}
        onFocus={handleFocus}
        onMouseLeave={scheduleClose}
        onBlur={scheduleClose}
        onClick={handleClick}
        disabled={item.disabled ?? false}
        title={item.tooltip}
        tabIndex={0}
      >
        {item.icon && <IconWrapper variant={variant}>{item.icon}</IconWrapper>}
        <MenuItemLabel>{item.label}</MenuItemLabel>
        <SubmenuArrow />
      </MenuItemWrapper>

      {anchorRect && (
        <SubmenuPanel
          items={item.items}
          context={context}
          anchorRect={anchorRect}
          depth={depth + 1}
          cancelClose={cancelClose}
          scheduleClose={handleCloseImmediate}
        />
      )}
    </Fragment>
  );
};

const ContextMenuItemRenderer: React.FC<ContextMenuItemRendererProps> = ({
  item,
  context,
  depth,
}) => {
  if (item.type === 'separator') {
    return <MenuDivider key={item.id} />;
  }

  if (item.type === 'submenu') {
    return (
      <SubmenuMenuItem
        key={item.id}
        item={item}
        context={context}
        depth={depth}
      />
    );
  }

  if (item.type === 'toggle') {
    return <ToggleMenuItem key={item.id} item={item} context={context} />;
  }

  return <ActionMenuItem key={item.id} item={item} context={context} />;
};

const NodeContextMenu_: React.FC<NodeContextMenuProps> = ({
  duplicateNode,
}) => {
  const state = useNodeContextMenuState();
  const { close: closeMenu } = useNodeContextMenuActions();
  const dispatch = useAppDispatch();
  const { nodeData } = useNodeData(state.nodeID);
  const variables = useNodeVariables(state.nodeID);

  const skipRedispatchRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  const resolvedNodeData = nodeData ?? state.nodeData;

  const context = useMemo(() => {
    if (
      !state.open ||
      !state.nodeDefinition ||
      !resolvedNodeData ||
      !state.nodeID
    ) {
      return null;
    }

    return {
      nodeID: state.nodeID,
      nodeDefinition: state.nodeDefinition,
      data: resolvedNodeData,
      variables,
      closeMenu,
      dispatch,
      ...(duplicateNode ? { duplicateNode } : {}),
    };
  }, [
    closeMenu,
    dispatch,
    duplicateNode,
    resolvedNodeData,
    variables,
    state.nodeDefinition,
    state.nodeID,
    state.open,
  ]);

  const items = useNodeContextMenuItems(state.nodeDefinition, context);

  const canRender = Boolean(
    state.open && state.position && context && items.length > 0
  );

  useEffect(() => {
    setVisible(canRender);
  }, [canRender]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (skipRedispatchRef.current) {
        skipRedispatchRef.current = false;
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target &&
        target.closest<HTMLElement>('[data-node-context-menu-root="true"]')
      ) {
        return;
      }

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
  }, [closeMenu, state.open, visible]);

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
      data-node-context-menu-root='true'
      ref={containerRef}
      sx={theme => ({
        position: 'fixed',
        top: state.position!.y,
        left: state.position!.x,
        zIndex: MENU_Z_INDEX(theme),
      })}
      onContextMenu={event => event.preventDefault()}
    >
      <MenuContainer>
        {items.map(item => (
          <ContextMenuItemRenderer
            key={item.id}
            item={item}
            context={context}
            depth={0}
          />
        ))}
      </MenuContainer>
    </Box>,
    document.body
  );
};

export const NodeContextMenu = memo(NodeContextMenu_);
NodeContextMenu.displayName = 'NodeContextMenu';
