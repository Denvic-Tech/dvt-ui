import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListSubheader from '@mui/material/ListSubheader';
import Menu from '@mui/material/Menu';
import MenuItem, { type MenuItemProps } from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { Check, ChevronRight } from 'lucide-react';
import * as React from 'react';

import { mergeSx } from './control-styles.ts';

interface DropdownMenuContextValue {
  closeMenu: () => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(
  null
);

const useDropdownMenuContext = () => React.useContext(DropdownMenuContext);

export interface DropdownMenuProps
  extends Omit<React.ComponentProps<typeof Menu>, 'children' | 'onClose' | 'slotProps'> {
  onClose?: () => void;
}

const DropdownMenu = ({
  children,
  onClose,
  PaperProps,
  ...props
}: React.PropsWithChildren<DropdownMenuProps>) => (
  <DropdownMenuContext.Provider value={{ closeMenu: () => onClose?.() }}>
    <Menu
      {...props}
      PaperProps={{
        ...PaperProps,
        sx: mergeSx(
          {
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            minWidth: 180,
          },
          PaperProps?.sx
        ),
      }}
      onClose={onClose}
    >
      {children}
    </Menu>
  </DropdownMenuContext.Provider>
);

type DropdownMenuItemOwnProps = {
  inset?: boolean;
};

const DropdownMenuItem = React.forwardRef<
  HTMLLIElement,
  MenuItemProps & DropdownMenuItemOwnProps
>(({ children, inset, onClick, sx, ...props }, ref) => {
  const context = useDropdownMenuContext();

  return (
    <MenuItem
      ref={ref}
      sx={mergeSx(
        {
          pl: inset ? 4 : 1.5,
        },
        sx
      )}
      {...props}
      onClick={event => {
        onClick?.(event as never);
        context?.closeMenu();
      }}
    >
      {children}
    </MenuItem>
  );
});
DropdownMenuItem.displayName = 'DropdownMenuItem';

type DropdownMenuCheckboxItemProps = MenuItemProps & {
  checked?: boolean;
};

const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLLIElement,
  DropdownMenuCheckboxItemProps
>(({ checked, children, onClick, ...props }, ref) => {
  const context = useDropdownMenuContext();

  return (
    <MenuItem
      ref={ref}
      {...props}
      onClick={event => {
        onClick?.(event as never);
        context?.closeMenu();
      }}
    >
      <ListItemIcon sx={{ minWidth: 24 }}>
        {checked ? <Check size={16} /> : null}
      </ListItemIcon>
      {children}
    </MenuItem>
  );
});
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

const DropdownMenuRadioItem = React.forwardRef<
  HTMLLIElement,
  DropdownMenuCheckboxItemProps
>(({ checked, children, onClick, ...props }, ref) => {
  const context = useDropdownMenuContext();

  return (
    <MenuItem
      ref={ref}
      {...props}
      onClick={event => {
        onClick?.(event as never);
        context?.closeMenu();
      }}
    >
      <ListItemIcon sx={{ minWidth: 24 }}>
        {checked ? <Check size={16} /> : null}
      </ListItemIcon>
      {children}
    </MenuItem>
  );
});
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

const DropdownMenuLabel = ({
  children,
  inset,
}: {
  children?: React.ReactNode;
  inset?: boolean;
}) => (
  <ListSubheader sx={{ pl: inset ? 4 : 2, pr: 2, py: 1, typography: 'caption' }}>
    {children}
  </ListSubheader>
);
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

const DropdownMenuSeparator = () => <Divider sx={{ my: 0.5 }} />;
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

const DropdownMenuShortcut = ({ children }: { children?: React.ReactNode }) => (
  <Typography color='text.secondary' component='span' sx={{ ml: 'auto', typography: 'caption' }}>
    {children}
  </Typography>
);
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

const DropdownMenuSubTrigger = React.forwardRef<
  HTMLLIElement,
  MenuItemProps & DropdownMenuItemOwnProps
>(({ children, inset, ...props }, ref) => (
  <MenuItem ref={ref} sx={{ pl: inset ? 4 : 1.5 }} {...props}>
    {children}
    <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
  </MenuItem>
));
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSubTrigger,
};
