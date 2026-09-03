import React, { memo, useCallback, useMemo } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';

import { InputDefinitionModel } from '@/shared/gatewayClient';

interface LiteralNodeInputProps {
  nodeId: string;
  inputDefinition: InputDefinitionModel;
  currentValue: unknown;
  onChange: (value: unknown) => void;
}

const LiteralNodeInput: React.FC<LiteralNodeInputProps> = ({
  inputDefinition,
  currentValue,
  onChange,
}) => {
  const literalOptions = useMemo(
    () => (inputDefinition.options ?? []).map(option => String(option)),
    [inputDefinition.options]
  );

  const currentLiteralValue =
    typeof currentValue === 'string' ? currentValue : null;

  const isValidCurrentValue = useMemo(
    () =>
      currentLiteralValue !== null && literalOptions.includes(currentLiteralValue),
    [currentLiteralValue, literalOptions]
  );

  const defaultValue = useMemo(() => {
    if (!literalOptions.length || typeof inputDefinition.default !== 'string') {
      return null;
    }
    return literalOptions.includes(inputDefinition.default)
      ? inputDefinition.default
      : null;
  }, [inputDefinition.default, literalOptions]);

  const value = isValidCurrentValue ? currentLiteralValue : defaultValue;

  const handleChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string | null) => {
      onChange(newValue);
    },
    [onChange]
  );

  return (
    <Autocomplete<string, false, false, false>
      fullWidth
      options={literalOptions}
      value={value}
      onChange={handleChange}
      getOptionLabel={option => option}
      renderInput={(params: AutocompleteRenderInputParams) => {
        const { InputLabelProps, ...restParams } = params;
        return <TextField {...restParams} size='small' variant='outlined' />;
      }}
      size='small'
      sx={{ minWidth: 150 }}
    />
  );
};

export default memo(LiteralNodeInput);
