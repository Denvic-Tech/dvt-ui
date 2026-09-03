import * as React from 'react';
import FormControl from '@mui/material/FormControl';
import MenuItem, { type MenuItemProps } from '@mui/material/MenuItem';
import SelectMui, { type SelectChangeEvent } from '@mui/material/Select';
import Typography from '@mui/material/Typography';

import { mergeSx, selectControlSx, selectMenuPaperSx } from './control-styles';

export interface SelectOption {
  disabled?: boolean;
  label: React.ReactNode;
  value: string;
}

export interface SelectProps extends Omit<
  React.ComponentProps<typeof SelectMui>,
  'defaultValue' | 'multiple' | 'onChange' | 'size' | 'value' | 'variant'
> {
  defaultValue?: string;
  onChange?: (value: string) => void;
  options?: readonly SelectOption[];
  placeholder?: React.ReactNode;
  value?: string;
}

const getLabelForValue = (
  options: readonly SelectOption[] | undefined,
  value: string
) => options?.find(option => option.value === value)?.label ?? value;

const Select = ({
  children,
  defaultValue,
  disabled,
  MenuProps,
  onChange,
  options,
  placeholder,
  value: valueProp,
  ...props
}: SelectProps) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue ?? ''
  );

  const value = valueProp ?? uncontrolledValue;

  const handleChange = (event: SelectChangeEvent<string>) => {
    const nextValue = event.target.value;

    if (valueProp === undefined) {
      setUncontrolledValue(nextValue);
    }

    onChange?.(nextValue);
  };

  return (
    <FormControl fullWidth size='small'>
      <SelectMui
        {...props}
        MenuProps={{
          ...MenuProps,
          PaperProps: {
            ...MenuProps?.PaperProps,
            sx: mergeSx(selectMenuPaperSx, MenuProps?.PaperProps?.sx),
          },
        }}
        displayEmpty
        renderValue={selected => {
          if (!selected) {
            return (
              <Typography color='text.secondary' component='span'>
                {placeholder ?? ''}
              </Typography>
            );
          }

          return getLabelForValue(options, selected);
        }}
        size='small'
        sx={mergeSx(selectControlSx, props.sx)}
        value={value}
        variant='outlined'
        {...(disabled !== undefined ? { disabled } : {})}
        onChange={handleChange}
      >
        {options
          ? options.map(option => (
              <MenuItem
                key={option.value}
                value={option.value}
                {...(option.disabled !== undefined
                  ? { disabled: option.disabled }
                  : {})}
              >
                {option.label}
              </MenuItem>
            ))
          : children}
      </SelectMui>
    </FormControl>
  );
};

const SelectItem = React.forwardRef<HTMLLIElement, MenuItemProps>(
  (props, ref) => <MenuItem ref={ref} {...props} />
);
SelectItem.displayName = 'SelectItem';

export { Select, SelectItem };
