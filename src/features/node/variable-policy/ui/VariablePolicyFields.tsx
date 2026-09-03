import { Checkbox, FormControlLabel, Stack } from '@mui/material';
import type { ReactNode } from 'react';

type VariablePolicyFieldsProps = {
  defaultEditor?: ReactNode | undefined;
  nullable: boolean;
  onNullableChange: (nextValue: boolean) => void;
};

export const VariablePolicyFields = ({
  defaultEditor,
  nullable,
  onNullableChange,
}: VariablePolicyFieldsProps) => {
  return (
    <Stack spacing={1}>
      <FormControlLabel
        control={
          <Checkbox
            size='small'
            checked={nullable}
            onChange={event => onNullableChange(event.target.checked)}
          />
        }
        label='nullable'
      />
      {defaultEditor}
    </Stack>
  );
};
