import * as React from 'react';
import Box, { type BoxProps } from '@mui/material/Box';
import DialogMui from '@mui/material/Dialog';
import Typography, { type TypographyProps } from '@mui/material/Typography';

import { mergeSx } from './control-styles';

export interface DialogProps extends Omit<
  React.ComponentProps<typeof DialogMui>,
  'children' | 'onClose'
> {
  onClose?: () => void;
}

const Dialog = ({
  children,
  maxWidth = 'sm',
  onClose,
  slotProps,
  ...props
}: React.PropsWithChildren<DialogProps>) => {
  const paperSlotProps = slotProps?.paper;

  return (
    <DialogMui
      {...props}
      fullWidth={props.fullWidth ?? true}
      maxWidth={maxWidth}
      onClose={onClose}
      slotProps={{
        ...slotProps,
        paper:
          typeof paperSlotProps === 'function'
            ? paperSlotProps
            : {
                ...paperSlotProps,
                sx: mergeSx(
                  {
                    overflow: 'hidden',
                  },
                  paperSlotProps?.sx
                ),
              },
      }}
    >
      <Box sx={{ display: 'grid' }}>{children}</Box>
    </DialogMui>
  );
};

const DialogHeader = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ children, sx, ...props }, ref) => (
    <Box
      ref={ref}
      sx={mergeSx(
        {
          backgroundColor: 'action.hover',
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
DialogHeader.displayName = 'DialogHeader';

const DialogContent = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ children, sx, ...props }, ref) => (
    <Box
      ref={ref}
      sx={mergeSx({ display: 'grid', gap: 2.5, px: 3, py: 3 }, sx)}
      {...props}
    >
      {children}
    </Box>
  )
);
DialogContent.displayName = 'DialogContent';

const DialogFooter = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ children, sx, ...props }, ref) => (
    <Box
      ref={ref}
      sx={mergeSx(
        {
          alignItems: { sm: 'center' },
          bgcolor: 'action.hover',
          borderTop: theme => `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: { sm: 'row', xs: 'column-reverse' },
          gap: 1,
          justifyContent: 'flex-end',
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
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  (props, ref) => (
    <Typography ref={ref} component='h2' variant='h6' {...props} />
  )
);
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  TypographyProps
>(({ sx, ...props }, ref) => (
  <Typography
    ref={ref}
    color='text.secondary'
    component='p'
    sx={mergeSx({ mt: 0.5 }, sx)}
    variant='body2'
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
};
