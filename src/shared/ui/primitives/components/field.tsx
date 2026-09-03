import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

import { mergeSx } from './control-styles.ts';
import { Label } from './label.tsx';

export interface FieldProps extends React.ComponentProps<typeof Box> {
  children: ReactNode;
  contentSx?: SxProps<Theme>;
  description?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  label?: ReactNode;
  required?: boolean;
}

export const Field = ({
  children,
  contentSx,
  description,
  error,
  htmlFor,
  label,
  required,
  sx,
  ...props
}: FieldProps) => (
  <Box sx={mergeSx({ display: 'grid', gap: 1.25, width: '100%' }, sx)} {...props}>
    {label ? (
      <Label {...(htmlFor ? { htmlFor } : {})}>
        {label}
        {required ? (
          <Box component='span' sx={{ color: 'error.main', ml: 0.5 }}>
            *
          </Box>
        ) : null}
      </Label>
    ) : null}
    <Box sx={mergeSx({ display: 'grid', gap: 1 }, contentSx)}>
      {children}
      {error ? (
        <Typography sx={{ color: 'error.main', fontSize: 12, fontWeight: 500 }}>
          {error}
        </Typography>
      ) : description ? (
        <Typography
          sx={{ color: 'text.secondary', fontSize: 12, lineHeight: 1.6 }}
        >
          {description}
        </Typography>
      ) : null}
    </Box>
  </Box>
);
