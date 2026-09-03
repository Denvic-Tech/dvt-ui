import Box from '@mui/material/Box';
import PopoverMui from '@mui/material/Popover';
import type { SxProps, Theme } from '@mui/material/styles';
import * as React from 'react';

import { mergeSx } from './control-styles.ts';

export interface PopoverProps
  extends Omit<
    React.ComponentProps<typeof PopoverMui>,
    'children' | 'onClose' | 'slotProps'
  > {
  contentSx?: SxProps<Theme>;
  onClose?: () => void;
  paperSx?: SxProps<Theme>;
}

const defaultPopoverPaperSx: SxProps<Theme> = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  boxShadow: theme => '0 2px 8px rgba(15, 23, 42, 0.08)',
  overflow: 'hidden',
};

const Popover = ({
  children,
  contentSx,
  onClose,
  paperSx,
  ...props
}: React.PropsWithChildren<PopoverProps>) => (
  <PopoverMui
    {...props}
    slotProps={{
      paper: {
        sx: mergeSx(defaultPopoverPaperSx, paperSx),
      },
    }}
    onClose={onClose}
  >
    <Box {...(contentSx ? { sx: contentSx } : {})}>{children}</Box>
  </PopoverMui>
);

export { Popover };
