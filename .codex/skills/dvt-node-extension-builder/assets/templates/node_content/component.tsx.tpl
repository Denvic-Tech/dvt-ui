import { Chip } from '@mui/material';

import type { NodeContentExtensionProps } from '@/app/providers/node-extensions/lib/types';

export const {{component_name}} = ({
  nodeDefinition,
}: NodeContentExtensionProps) => {
  return (
    <Chip
      size='small'
      variant='outlined'
      label={nodeDefinition.display_name || nodeDefinition.name}
    />
  );
};
