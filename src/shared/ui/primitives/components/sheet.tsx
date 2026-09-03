import Box, { type BoxProps } from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography, { type TypographyProps } from '@mui/material/Typography';
import * as React from 'react';

import { mergeSx } from './control-styles.ts';

type SheetSide = 'bottom' | 'left' | 'right' | 'top';

export interface SheetProps
  extends Omit<React.ComponentProps<typeof Drawer>, 'anchor' | 'children' | 'onClose'> {
  onClose?: () => void;
  side?: SheetSide;
}

const getPaperSx = (side: SheetSide) => {
  switch (side) {
    case 'left':
    case 'right':
      return {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxWidth: '100vw',
        width: { sm: 512, xs: '100vw' },
      };
    case 'top':
    case 'bottom':
      return {
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100vh',
        width: '100%',
      };
    default:
      return {};
  }
};

const Sheet = ({
  children,
  onClose,
  PaperProps,
  side = 'right',
  ...props
}: React.PropsWithChildren<SheetProps>) => (
  <Drawer
    {...props}
    PaperProps={{
      ...PaperProps,
      sx: mergeSx(
        {
          borderRadius:
            side === 'left' || side === 'right' ? 0 : '16px 16px 0 0',
          ...getPaperSx(side),
        },
        PaperProps?.sx
      ),
    }}
    anchor={side}
    onClose={onClose}
  >
    <Box sx={{ display: 'grid', minHeight: '100%' }}>{children}</Box>
  </Drawer>
);

const SheetHeader = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ children, sx, ...props }, ref) => (
    <Box
      ref={ref}
      sx={mergeSx(
        {
          bgcolor: 'action.hover',
          borderBottom: theme => `1px solid ${theme.palette.divider}`,
          display: 'grid',
          gap: 0.75,
          px: 3,
          py: 2.5,
        },
        sx
      )}
      {...props}
    >
      {children}
    </Box>
  )
);
SheetHeader.displayName = 'SheetHeader';

const SheetContent = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ children, sx, ...props }, ref) => (
    <Box
      ref={ref}
      sx={mergeSx({ display: 'grid', flex: 1, gap: 2.5, px: 3, py: 3 }, sx)}
      {...props}
    >
      {children}
    </Box>
  )
);
SheetContent.displayName = 'SheetContent';

const SheetFooter = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ children, sx, ...props }, ref) => (
    <Box
      ref={ref}
      sx={mergeSx(
        {
          alignItems: { sm: 'center' },
          borderTop: theme => `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: { sm: 'row', xs: 'column-reverse' },
          gap: 1,
          justifyContent: 'flex-end',
          mt: 'auto',
          px: 3,
          py: 2.5,
        },
        sx
      )}
      {...props}
    >
      {children}
    </Box>
  )
);
SheetFooter.displayName = 'SheetFooter';

const SheetTitle = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  (props, ref) => <Typography ref={ref} component='h2' variant='h6' {...props} />
);
SheetTitle.displayName = 'SheetTitle';

const SheetDescription = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ sx, ...props }, ref) => (
    <Typography
      ref={ref}
      color='text.secondary'
      component='p'
      sx={mergeSx({ mt: 0.5 }, sx)}
      variant='body2'
      {...props}
    />
  )
);
SheetDescription.displayName = 'SheetDescription';

export {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
};
