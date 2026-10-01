import { Box, TextField, Typography } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';

import { Chip } from './chip';
import { singleLineTextFieldControlSx } from './control-styles';

export type TokenOption = {
  value: string;
  label: string;
  description?: string;
  actionLabel?: string;
};
export function TokenCombobox({
  label,
  value,
  options,
  query,
  onQueryChange,
  onChange,
}: {
  label: string;
  value: TokenOption[];
  options: TokenOption[];
  query: string;
  onQueryChange: (value: string) => void;
  onChange: (value: TokenOption[]) => void;
}) {
  return (
    <Autocomplete
      multiple
      limitTags={3}
      filterSelectedOptions
      disableCloseOnSelect
      value={value}
      options={options}
      inputValue={query}
      filterOptions={items => items}
      getOptionKey={option => option.value}
      getOptionLabel={option => option.label}
      isOptionEqualToValue={(left, right) => left.value === right.value}
      onInputChange={(_, next, reason) => {
        if (reason !== 'reset') onQueryChange(next);
      }}
      onChange={(_, next) => {
        onChange(next);
        onQueryChange('');
      }}
      noOptionsText='Колонки не найдены'
      renderTags={(items, getTagProps) =>
        items.map((item, index) => {
          const { key, onDelete: _onDelete, ...props } = getTagProps({ index });
          return (
            <Chip
              key={key}
              {...props}
              onRemove={() =>
                onChange(value.filter(token => token.value !== item.value))
              }
            >
              {item.label}
            </Chip>
          );
        })
      }
      renderOption={(props, option) => {
        const { key, ...rest } = props;
        return (
          <li key={key} {...rest}>
            <Box>
              <Typography variant='body2'>
                {option.actionLabel ?? option.label}
              </Typography>
              {option.description && (
                <Typography variant='caption' color='text.secondary'>
                  {option.description}
                </Typography>
              )}
            </Box>
          </li>
        );
      }}
      renderInput={({ InputLabelProps: _labelProps, ...params }) => (
        <TextField
          {...params}
          size='small'
          sx={singleLineTextFieldControlSx}
          label={label}
          placeholder={
            value.length
              ? ''
              : 'Выберите колонки или введите паттерн (some_name_*)'
          }
        />
      )}
    />
  );
}
