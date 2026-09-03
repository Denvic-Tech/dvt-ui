import TooltipMui from '@mui/material/Tooltip';
import * as React from 'react';

type TooltipProviderProps = {
  children: React.ReactNode;
};

export interface TooltipProps
  extends Omit<React.ComponentProps<typeof TooltipMui>, 'arrow'> {}

const TooltipProvider = ({ children }: TooltipProviderProps) => <>{children}</>;

const Tooltip = ({ children, slotProps, ...props }: TooltipProps) => (
  <TooltipMui
    {...props}
    arrow
    {...(slotProps ? { slotProps } : {})}
  >
    {children}
  </TooltipMui>
);

export { Tooltip, TooltipProvider };
