import React, { CSSProperties, useRef, useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  IconButton,
  TextField,
  TextFieldProps,
  Typography,
  TypographyProps,
} from '@mui/material';
import type { SxProps } from '@mui/material/styles';
import { Theme, useTheme } from '@mui/material/styles';

const DEFAULT_EDIT_MIN_WIDTH = 120;

const getTypographyStyle = (
  variant: TypographyProps['variant'],
  theme: Theme
): CSSProperties => {
  if (
    typeof variant === 'string' &&
    variant !== 'inherit' &&
    Object.prototype.hasOwnProperty.call(theme.typography, variant)
  ) {
    const style = theme.typography[variant];
    return typeof style === 'object' ? (style as CSSProperties) : {};
  }
  return {};
};

interface EditableTypographyProps extends Omit<
  TypographyProps,
  'onChange' | 'variant'
> {
  value: string;
  onChange: (value: string) => void;
  showButton?: boolean;
  typographyVariant?: TypographyProps['variant'];
  textFieldProps?: Omit<TextFieldProps, 'variant'>;
  textFieldVariant?: TextFieldProps['variant'];
  containerSx?: SxProps<Theme>;
}

export const EditableTypography: React.FC<EditableTypographyProps> = ({
  value,
  onChange,
  typographyVariant = 'body1',
  textFieldProps,
  textFieldVariant = 'standard',
  showButton = true,
  containerSx,
  ...typographyProps
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [width, setWidth] = useState<number | undefined>(undefined);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const typographyRef = useRef<HTMLSpanElement | null>(null);

  const theme = useTheme();

  const handleStartEdit = (
    event?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>
  ) => {
    event?.preventDefault();
    event?.stopPropagation();
    setDraft(value);

    if (textFieldProps?.fullWidth) {
      setWidth(undefined);
    } else if (typographyRef.current) {
      const rect = typographyRef.current.getBoundingClientRect();
      setWidth(Math.max(Math.ceil(rect.width) + 24, DEFAULT_EDIT_MIN_WIDTH));
    }

    setEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleFinishEdit = () => {
    setEditing(false);
    if (draft !== value) {
      onChange(draft);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !textFieldProps?.multiline) {
      handleFinishEdit();
    } else if (e.key === 'Escape') {
      setEditing(false);
    }
  };

  const typographyStyle = getTypographyStyle(typographyVariant, theme);
  const interactiveClassName = 'nodrag nopan';
  const textFieldStyle = textFieldProps?.fullWidth
    ? { width: '100%' }
    : { width: Math.max(width ?? 0, DEFAULT_EDIT_MIN_WIDTH) };

  return (
    <Box
      className={interactiveClassName}
      display='flex'
      alignItems={textFieldProps?.multiline ? 'flex-start' : 'center'}
      gap={1}
      sx={{ width: '100%', ...containerSx }}
    >
      {editing ? (
        <TextField
          className={interactiveClassName}
          inputRef={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={handleFinishEdit}
          onKeyDown={handleKeyDown}
          slotProps={{
            input: {
              style: {
                ...typographyStyle,
              },
            },
          }}
          variant={textFieldVariant}
          {...textFieldProps}
          style={textFieldStyle}
        />
      ) : (
        <>
          <Typography
            ref={typographyRef}
            variant={typographyVariant}
            {...typographyProps}
            onDoubleClick={handleStartEdit}
            style={{ display: 'inline-block' }}
            className={interactiveClassName}
          >
            {value || <i style={{ color: '#aaa' }}>—</i>}
          </Typography>

          {showButton && (
            <IconButton
              size='small'
              onClick={handleStartEdit}
              className={interactiveClassName}
            >
              <EditIcon fontSize='small' />
            </IconButton>
          )}
        </>
      )}
    </Box>
  );
};

export default EditableTypography;
