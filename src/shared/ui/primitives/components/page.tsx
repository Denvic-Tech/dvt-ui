import * as React from 'react';
import Box from '@mui/material/Box';

type PageSize = 'default' | 'full' | 'narrow' | 'wide';

const maxWidthBySize: Record<PageSize, string> = {
  default: '1680px',
  full: 'none',
  narrow: '1440px',
  wide: '1880px',
};

type PageProps = React.ComponentProps<typeof Box> & {
  size?: PageSize;
};

const Page = React.forwardRef<HTMLDivElement, PageProps>(
  ({ size = 'default', sx, ...props }, ref) => (
    <Box
      ref={ref}
      sx={{
        width: '100%',
        minHeight: '100%',
        maxWidth: maxWidthBySize[size],
        mx: size === 'full' ? 0 : 'auto',
        ...((sx as object) ?? {}),
      }}
      {...props}
    />
  )
);

Page.displayName = 'Page';

export { Page };
