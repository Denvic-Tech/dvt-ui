import * as React from 'react';
import MuiCheckbox from '@mui/material/Checkbox';

export interface CheckboxProps
  extends Omit<React.ComponentProps<typeof MuiCheckbox>, 'onChange'> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ onCheckedChange, ...props }, ref) => (
    <MuiCheckbox
      ref={ref}
      size='small'
      onChange={(_event, checked) => onCheckedChange?.(checked)}
      {...props}
    />
  )
);
Checkbox.displayName = 'Checkbox';
