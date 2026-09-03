import { Stack, Typography } from '@mui/material';

import type { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

type {{component_input_type_name}} = Partial<Record<string, unknown>>;

export const {{component_name}} = ({
  nodeDefinition,
}: NodeModalExtensionProps<{{component_input_type_name}}>) => {
  return (
    <Stack gap={2}>
      <Typography variant='h6'>
        {nodeDefinition.display_name || nodeDefinition.name}
      </Typography>
      <Typography color='text.secondary'>
        Scaffolded modal extension. Replace this placeholder with the node-specific editor.
      </Typography>
    </Stack>
  );
};
