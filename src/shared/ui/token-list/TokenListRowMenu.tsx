import * as React from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Menu, MenuList, Paper, Popper } from '@mui/material';
import { IconChevronRight } from '@tabler/icons-react';

import {
  RowActionsButton,
  RowMenuItem,
  rowMenuPaperSx,
  RowMenuSeparator,
  RowSubmenuArrow,
  RowSubmenuItem,
  RowSubmenuNote,
  rowSubmenuPaperSx,
  RowSubmenuScroll,
} from './styled';

export type TokenListRowSubmenuItem = {
  key: string;
  label: string;
  // Muted text on the right, e.g. «Установлено».
  note?: string;
  disabled?: boolean;
  onSelect: () => void;
};

type TokenListRowActionBase = {
  label: string;
  // Red, separated from the actions above.
  danger?: boolean;
  // Green, separated from the actions above, e.g. «Активировать».
  success?: boolean;
  disabled?: boolean;
};

export type TokenListRowAction = TokenListRowActionBase &
  (
    | { onSelect: () => void; submenu?: never }
    // Opens a nested menu on hover instead of running an action.
    | { submenu: TokenListRowSubmenuItem[]; onSelect?: never }
  );

type TokenListRowMenuProps = {
  label: string;
  actions: TokenListRowAction[];
};

// Faster than the MUI default («auto», about 250 ms for a short menu).
const MENU_TRANSITION_DURATION = { enter: 140, exit: 100 };

// Time to move the cursor from the item into the submenu across the gap.
const SUBMENU_CLOSE_DELAY = 150;

const SUBMENU_MODIFIERS = [
  // Lines the first item up with the parent item: paper padding + border.
  { name: 'offset', options: { offset: [-5, 8] } },
  { name: 'flip', options: { fallbackPlacements: ['left-start'] } },
  { name: 'preventOverflow', options: { padding: 8 } },
];

// The «⋮» button at the end of a list row with its actions menu.
export const TokenListRowMenu = ({ label, actions }: TokenListRowMenuProps) => {
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [submenu, setSubmenu] = React.useState<{
    anchor: HTMLElement;
    label: string;
    // Opened from the keyboard: the first item takes the focus.
    focus: boolean;
  } | null>(null);

  const closeTimerRef = React.useRef<number | undefined>(undefined);

  const cancelSubmenuClose = () => window.clearTimeout(closeTimerRef.current);

  // The cursor left the item or the submenu: closes unless it enters the
  // other one in time.
  const scheduleSubmenuClose = () => {
    cancelSubmenuClose();
    closeTimerRef.current = window.setTimeout(
      () => setSubmenu(null),
      SUBMENU_CLOSE_DELAY
    );
  };

  React.useEffect(() => {
    const timerRef = closeTimerRef;
    return () => window.clearTimeout(timerRef.current);
  }, []);

  const hasSubmenu = actions.some(action => action.submenu);
  const submenuItems =
    actions.find(action => action.label === submenu?.label)?.submenu ?? [];

  const closeMenu = () => {
    cancelSubmenuClose();
    setSubmenu(null);
    setMenuAnchor(null);
  };

  const closeSubmenu = () => {
    cancelSubmenuClose();
    submenu?.anchor.focus();
    setSubmenu(null);
  };

  const openSubmenu = (
    anchor: HTMLElement,
    action: TokenListRowAction,
    focus: boolean
  ) => {
    cancelSubmenuClose();
    if (submenu?.label === action.label && !focus) {
      return;
    }
    setSubmenu({ anchor, label: action.label, focus });
  };

  return (
    <>
      <RowActionsButton
        disableRipple
        aria-label={label}
        onClick={event => setMenuAnchor(event.currentTarget)}
      >
        <MoreVertIcon sx={{ fontSize: 18 }} />
      </RowActionsButton>

      <Menu
        anchorEl={menuAnchor}
        open={menuAnchor !== null}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        transitionDuration={MENU_TRANSITION_DURATION}
        // The submenu is rendered outside the menu and takes the focus.
        disableEnforceFocus={hasSubmenu}
        PaperProps={{ sx: rowMenuPaperSx }}
        MenuListProps={{ disablePadding: true }}
      >
        {actions.flatMap((action, index) => {
          const isSubmenuOpen = submenu?.label === action.label;
          const item = action.submenu ? (
            <RowMenuItem
              key={action.label}
              disableRipple
              aria-haspopup='menu'
              aria-expanded={isSubmenuOpen}
              selected={isSubmenuOpen}
              disabled={action.disabled ?? false}
              onMouseEnter={event =>
                openSubmenu(event.currentTarget, action, false)
              }
              onMouseLeave={scheduleSubmenuClose}
              onClick={event => openSubmenu(event.currentTarget, action, false)}
              onKeyDown={event => {
                if (event.key === 'ArrowRight' || event.key === 'Enter') {
                  event.preventDefault();
                  openSubmenu(event.currentTarget, action, true);
                }
              }}
            >
              {action.label}
              <RowSubmenuArrow aria-hidden>
                <IconChevronRight size={16} stroke={1.6} />
              </RowSubmenuArrow>
            </RowMenuItem>
          ) : (
            <RowMenuItem
              key={action.label}
              disableRipple
              danger={action.danger}
              success={action.success}
              disabled={action.disabled ?? false}
              onMouseEnter={() => {
                cancelSubmenuClose();
                setSubmenu(null);
              }}
              onClick={() => {
                closeMenu();
                action.onSelect();
              }}
            >
              {action.label}
            </RowMenuItem>
          );

          return [
            ...((action.danger || action.success) && index > 0
              ? [
                  <RowMenuSeparator
                    key={`${action.label}-separator`}
                    role='separator'
                  />,
                ]
              : []),
            item,
          ];
        })}
      </Menu>

      <Popper
        open={menuAnchor !== null && submenu !== null}
        anchorEl={submenu?.anchor ?? null}
        placement='right-start'
        modifiers={SUBMENU_MODIFIERS}
        sx={theme => ({ zIndex: theme.zIndex.modal + 1 })}
      >
        <Paper
          sx={rowSubmenuPaperSx}
          onMouseEnter={cancelSubmenuClose}
          onMouseLeave={scheduleSubmenuClose}
        >
          <RowSubmenuScroll>
            <MenuList
              disablePadding
              aria-label={submenu?.label}
              autoFocusItem={submenu?.focus ?? false}
              onKeyDown={event => {
                if (
                  event.key === 'ArrowLeft' ||
                  event.key === 'Escape' ||
                  event.key === 'Tab'
                ) {
                  event.preventDefault();
                  closeSubmenu();
                }
              }}
            >
              {submenuItems.map(item => (
                <RowSubmenuItem
                  key={item.key}
                  disableRipple
                  disabled={item.disabled ?? false}
                  onClick={() => {
                    closeMenu();
                    item.onSelect();
                  }}
                >
                  {item.label}
                  {item.note ? (
                    <RowSubmenuNote>{item.note}</RowSubmenuNote>
                  ) : null}
                </RowSubmenuItem>
              ))}
            </MenuList>
          </RowSubmenuScroll>
        </Paper>
      </Popper>
    </>
  );
};
