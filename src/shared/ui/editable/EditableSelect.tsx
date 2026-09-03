import React, { useState, useRef } from 'react';
import { CSSProperties } from 'react';

import {
  Box,
  Typography,
  IconButton,
  MenuItem,
  Select,
  TypographyProps,
  SelectProps,
  useTheme,
  SelectChangeEvent,
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import { Theme } from '@mui/material/styles';

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

interface EditableSelectProps
  extends Omit<TypographyProps, 'onChange' | 'variant'> {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  typographyVariant?: TypographyProps['variant'];
  selectProps?: Omit<SelectProps<string>, 'value' | 'onChange'>;
}

export const EditableSelect: React.FC<EditableSelectProps> = ({
  value,
  onChange,
  options,
  typographyVariant = 'body1',
  selectProps,
  ...typographyProps
}) => {
  const [editing, setEditing] = useState(false);
  const theme = useTheme();
  const selectRef = useRef<HTMLSelectElement | null>(null);

  const handleStartEdit = () => {
    setEditing(true);
    setTimeout(() => {
      selectRef.current?.focus();
    }, 0);
  };

  const handleFinishEdit = () => {
    setEditing(false);
  };

  const handleChange = (event: SelectChangeEvent) => {
    const newValue = event.target.value;
    onChange(newValue);
    handleFinishEdit();
  };

  const typographyStyle = getTypographyStyle(typographyVariant, theme);

  return (
    <Box display='flex' alignItems='center' gap={1} width='100%'>
      {editing ? (
        <Select
          value={value}
          onChange={handleChange}
          onBlur={handleFinishEdit}
          inputProps={{
            ref: selectRef,
            style: typographyStyle,
          }}
          variant='standard'
          fullWidth
          {...selectProps}
        >
          {options.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      ) : (
        <>
          <Typography variant={typographyVariant} {...typographyProps}>
            {options.find(o => o.value === value)?.label || value}
          </Typography>
          <IconButton size='small' onClick={handleStartEdit}>
            <EditIcon fontSize='small' />
          </IconButton>
        </>
      )}
    </Box>
  );
};

export default EditableSelect;
