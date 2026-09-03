import * as React from 'react';
import MuiSwitch from '@mui/material/Switch';

export interface SwitchProps
  extends Omit<React.ComponentProps<typeof MuiSwitch>, 'onChange'> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ onCheckedChange, ...props }, ref) => (
    <MuiSwitch
      ref={ref}
      size='small'
      onChange={(_event, checked) => onCheckedChange?.(checked)}
      {...props}
    />
  )
);
Switch.displayName = 'Switch';
