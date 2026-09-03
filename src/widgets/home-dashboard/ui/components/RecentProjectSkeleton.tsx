import { Box, Stack } from '@mui/material';

import { Card, CardContent, Skeleton } from '@/shared/ui/primitives';

export const RecentProjectSkeleton = () => (
  <Card
    sx={{
      height: '100%',
      position: 'relative',
      borderRadius: '14px',
      boxShadow: '0 8px 18px -16px rgba(22, 24, 29, 0.12)',
    }}
  >
    <Skeleton
      sx={{
        position: 'absolute',
        top: 12,
        right: 12,
        width: 18,
        height: 18,
        borderRadius: '6px',
      }}
    />
    <CardContent sx={{ display: 'grid', gap: 1.25, p: 1.75 }}>
      <Stack direction='row' spacing={1.25} alignItems='center'>
        <Skeleton sx={{ width: 34, height: 34, borderRadius: '10px' }} />
        <Skeleton sx={{ width: 8, height: 8, borderRadius: '999px' }} />
      </Stack>
      <Box sx={{ minWidth: 0 }}>
        <Skeleton sx={{ width: '68%', height: 22 }} />
      </Box>
      <Stack direction='row' spacing={0.75} alignItems='center'>
        <Skeleton sx={{ width: 14, height: 14, borderRadius: '4px' }} />
        <Skeleton sx={{ width: 88, height: 18 }} />
      </Stack>
    </CardContent>
  </Card>
);
