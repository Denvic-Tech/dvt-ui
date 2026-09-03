import { Stack, Typography } from '@mui/material';

import type { NodeInputDefinitionProps } from '@/app/providers/node-extensions/lib/types';

export const {{component_name}} = ({
  inputDefinition,
}: NodeInputDefinitionProps) => {
  return (
    <Stack gap={1}>
      <Typography fontWeight={600}>
        {inputDefinition.display_name || inputDefinition.attr_name}
      </Typography>
      <Typography color='text.secondary' variant='body2'>
        Scaffolded input-definition extension. Replace this placeholder with the custom input UI.
      </Typography>
    </Stack>
  );
};
