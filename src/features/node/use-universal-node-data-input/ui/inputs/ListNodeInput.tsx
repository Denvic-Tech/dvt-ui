import React, { memo, useCallback } from 'react';
import { Autocomplete, Chip, TextField } from '@mui/material';

import { InputDefinitionModel } from '@/shared/gatewayClient';

interface ListNodeInputProps {
  nodeId: string;
  inputDefinition: InputDefinitionModel;
  currentValue: unknown[];
  onChange: (value: unknown[]) => void;
}

const ListNodeInput: React.FC<ListNodeInputProps> = ({
  inputDefinition,
  currentValue,
  onChange,
}) => {
  const defaultValue = Array.isArray(inputDefinition.default)
    ? inputDefinition.default
    : [];
  const value = Array.isArray(currentValue)
    ? currentValue.map(String)
    : defaultValue.map(String);

  const handleChange = useCallback(
    (
      _event: React.SyntheticEvent,
      newValue: (string | { inputValue: string })[]
    ) => {
      const stringValues = newValue
        .map(item => {
          if (typeof item === 'string') {
            return item.trim();
          }
          return item?.inputValue?.trim() ?? null;
        })
        .filter(item => item !== null && item !== '');

      onChange(Array.from(new Set(stringValues)) as string[]);
    },
    [onChange]
  );

  return (
    <Autocomplete
      multiple
      freeSolo
      fullWidth
      options={[]}
      value={value}
      onChange={handleChange}
      getOptionLabel={option =>
        typeof option === 'string' ? option : String(option)
      }
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip
            variant='outlined'
            label={String(option)}
            size='small'
            {...getTagProps({ index })}
            key={`${option}-${index}`}
          />
        ))
      }
      renderInput={params => {
        const { InputLabelProps, ...restParams } = params;
        return <TextField {...restParams} variant='outlined' size='small' />;
      }}
      size='small'
    />
  );
};

export default memo(ListNodeInput);
