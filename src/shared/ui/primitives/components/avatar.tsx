import * as React from 'react';
import MuiAvatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';

export const Avatar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof MuiAvatar>
>(({ sx, ...props }, ref) => (
  <MuiAvatar
    ref={ref}
    sx={{
      width: 40,
      height: 40,
      bgcolor: 'rgba(99, 102, 241, 0.12)',
      color: 'text.primary',
      fontSize: 13,
      fontWeight: 600,
      ...((sx as object) ?? {}),
    }}
    {...props}
  />
));
Avatar.displayName = 'Avatar';

export const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>((props, ref) => <Box ref={ref} component='img' sx={{ width: '100%', height: '100%', objectFit: 'cover' }} {...props} />);
AvatarImage.displayName = 'AvatarImage';

export const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>((props, ref) => <Box ref={ref} component='span' {...props} />);
AvatarFallback.displayName = 'AvatarFallback';
