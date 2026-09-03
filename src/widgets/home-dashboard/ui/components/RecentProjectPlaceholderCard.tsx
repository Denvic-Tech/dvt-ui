import { alpha } from '@mui/material';

import { Card } from '@/shared/ui/primitives';

export const RecentProjectPlaceholderCard = () => (
  <Card
    sx={{
      height: '100%',
      borderRadius: '14px',
      border: theme => `1px dashed ${alpha(theme.palette.primary.main, 0.14)}`,
      background:
        'linear-gradient(180deg, rgba(255, 255, 255, 0.34) 0%, rgba(255, 255, 255, 0.24) 100%)',
      boxShadow: 'none',
    }}
  />
);
