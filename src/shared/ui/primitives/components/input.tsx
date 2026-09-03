import * as React from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

import {
  mergeSx,
  singleLineTextFieldControlSx,
  textFieldControlSx,
} from './control-styles';

export interface InputProps extends Omit<
  React.ComponentProps<typeof TextField>,
  'variant' | 'size'
> {
  endAdornment?: React.ReactNode;
  shellClassName?: string;
  startAdornment?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      endAdornment,
      shellClassName,
      startAdornment,
      InputProps: inputProps,
      ...props
    },
    ref
  ) => {
    const mergedInputProps = {
      ...inputProps,
      ...(startAdornment
        ? {
            startAdornment: (
              <InputAdornment position='start'>{startAdornment}</InputAdornment>
            ),
          }
        : {}),
      ...(endAdornment
        ? {
            endAdornment: (
              <InputAdornment position='end'>{endAdornment}</InputAdornment>
            ),
          }
        : {}),
    };

    return (
      <TextField
        {...props}
        {...(shellClassName ? { className: shellClassName } : {})}
        InputProps={mergedInputProps}
        fullWidth={props.fullWidth ?? true}
        inputRef={ref}
        size='small'
        sx={mergeSx(
          props.multiline
            ? textFieldControlSx
            : mergeSx(textFieldControlSx, singleLineTextFieldControlSx),
          props.sx
        )}
        variant='outlined'
      />
    );
  }
);
Input.displayName = 'Input';
