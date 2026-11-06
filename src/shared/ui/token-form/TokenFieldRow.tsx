import * as React from 'react';
import { Box, InputBase, Typography } from '@mui/material';

import { fieldInputSx } from './styles';

type TokenFieldRowProps = {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
};

export const TokenFieldRow = ({
  label,
  htmlFor,
  children,
}: TokenFieldRowProps) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: '116px minmax(0, 1fr)',
      alignItems: 'start',
      columnGap: 2,
    }}
  >
    <Typography
      component={htmlFor ? 'label' : 'span'}
      {...(htmlFor ? { htmlFor } : {})}
      sx={{ color: '#4A5161', fontSize: 13, lineHeight: '38px' }}
    >
      {label}
    </Typography>
    <Box sx={{ minWidth: 0 }}>{children}</Box>
  </Box>
);

type TokenNameInputProps = {
  id: string;
  value: string;
  placeholder: string;
  autoFocus?: boolean;
  onChange: (value: string) => void;
};

export const TokenNameInput = ({
  id,
  value,
  placeholder,
  autoFocus = false,
  onChange,
}: TokenNameInputProps) => (
  <InputBase
    id={id}
    value={value}
    placeholder={placeholder}
    autoFocus={autoFocus}
    onChange={event => onChange(event.target.value)}
    inputProps={{ maxLength: 255 }}
    sx={fieldInputSx}
  />
);
