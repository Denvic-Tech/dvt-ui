import { Stack, Typography } from '@mui/material';

import type { NodeModalStepperExtensionProps } from '@/app/providers/node-extensions/lib/types';

type {{component_input_type_name}} = Partial<Record<string, unknown>>;
type {{component_shared_state_name}} = {
  initialized: boolean;
};

export const {{component_name}} = ({
  nodeDefinition,
}: NodeModalStepperExtensionProps<
  {{component_input_type_name}},
  {{component_shared_state_name}}
>) => {
  return (
    <Stack gap={2}>
      <Typography variant='h6'>
        {nodeDefinition.display_name || nodeDefinition.name}
      </Typography>
      <Typography color='text.secondary'>
        Scaffolded modal stepper extension. Replace this placeholder with the first step UI.
      </Typography>
    </Stack>
  );
};
