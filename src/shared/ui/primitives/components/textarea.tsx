import * as React from 'react';
import TextField from '@mui/material/TextField';

import { mergeSx, textFieldControlSx } from './control-styles';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<typeof TextField>
>((props, ref) => (
  <TextField
    {...props}
    multiline
    minRows={4}
    fullWidth={props.fullWidth ?? true}
    size='small'
    variant='outlined'
    inputRef={ref}
    sx={mergeSx(textFieldControlSx, props.sx)}
  />
));
Textarea.displayName = 'Textarea';
