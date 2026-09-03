import { Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';

import { LiteralValueField } from '@/features/node/variable-policy';

import { getManualVariableLabelWithTarget } from '../../lib/helpers';
import type { ManualTargetDraft, ManualVariableDraft } from '../../lib/types';

type ManualVariablePolicyRowProps = {
  onPatch: (patch: Partial<ManualVariableDraft>) => void;
  row: ManualVariableDraft;
  target: ManualTargetDraft;
};

export const ManualVariablePolicyRow = ({
  onPatch,
  row,
  target,
}: ManualVariablePolicyRowProps) => {
  return (
    <Stack spacing={1}>
      <Stack spacing={0.25}>
        <Typography variant='body2' fontWeight={600}>
          {row.name}
        </Typography>
        <Typography variant='caption' color='text.secondary'>
          {getManualVariableLabelWithTarget({
            row,
            target,
          })}
        </Typography>
      </Stack>

      <FormControlLabel
        control={
          <Checkbox
            size='small'
            checked={row.nullable}
            onChange={event => onPatch({ nullable: event.target.checked })}
          />
        }
        label='nullable'
      />

      <LiteralValueField
        label='Default'
        value={row.default_literal}
        onChange={default_literal => onPatch({ default_literal })}
        helperText='Оставьте поле пустым, если default не нужен.'
        placeholder='Например: null, 0, "fallback", {"source":"db"}'
      />
    </Stack>
  );
};
