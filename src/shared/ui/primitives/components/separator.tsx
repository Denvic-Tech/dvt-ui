import * as React from 'react';
import Divider from '@mui/material/Divider';

export const Separator = React.forwardRef<
  HTMLHRElement,
  React.ComponentProps<typeof Divider>
>(({ orientation = 'horizontal', ...props }, ref) => (
  <Divider ref={ref} orientation={orientation} {...props} />
));
Separator.displayName = 'Separator';
