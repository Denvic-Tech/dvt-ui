import FormLabel from '@mui/material/FormLabel';
import * as React from 'react';

import { mergeSx } from './control-styles.ts';

type LabelProps = React.ComponentProps<typeof FormLabel>;

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ sx, ...props }, ref) => (
    <FormLabel
      ref={ref}
      sx={mergeSx(
        {
          color: 'text.primary',
          display: 'inline-flex',
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.4,
        },
        sx
      )}
      {...props}
    />
  )
);
Label.displayName = 'Label';
