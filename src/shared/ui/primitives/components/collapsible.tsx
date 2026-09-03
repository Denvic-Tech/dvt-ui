import * as React from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';

interface CollapsibleContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null);

const useCollapsibleContext = () => {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error('Collapsible components must be used within Collapsible');
  }
  return context;
};

export const Collapsible = ({
  children,
  defaultOpen = false,
  onOpenChange,
  open,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = open !== undefined;
  const resolvedOpen = isControlled ? open : internalOpen;

  const setOpen: CollapsibleContextValue['setOpen'] = nextValue => {
    const next =
      typeof nextValue === 'function'
        ? (nextValue as (value: boolean) => boolean)(resolvedOpen)
        : nextValue;

    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <CollapsibleContext.Provider
      value={{ open: resolvedOpen, setOpen }}
    >
      <Box>{children}</Box>
    </CollapsibleContext.Provider>
  );
};

export const CollapsibleTrigger = ({
  children,
}: {
  children: React.ReactElement<{ onClick?: (event: React.MouseEvent) => void }>;
}) => {
  const { open, setOpen } = useCollapsibleContext();

  return React.cloneElement(children, {
    onClick: (event: React.MouseEvent) => {
      children.props.onClick?.(event);
      setOpen(!open);
    },
  });
};

export const CollapsibleContent = ({
  children,
  ...props
}: React.ComponentProps<typeof Box>) => {
  const { open } = useCollapsibleContext();

  return (
    <Collapse in={open}>
      <Box {...props}>{children}</Box>
    </Collapse>
  );
};
