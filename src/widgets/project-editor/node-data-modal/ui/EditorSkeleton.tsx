import { Box, Grid2 as Grid, Skeleton, Stack } from '@mui/material';

export const EditorSkeleton = () => {
  return (
    <Box>
      <Stack spacing={2}>
        <Skeleton variant='rounded' height={64} />
        <Grid container spacing={2}>
          <Grid size={9}>
            <Skeleton variant='rounded' height={64} />
          </Grid>
          <Grid size={3}>
            <Skeleton variant='rounded' height={64} />
          </Grid>
        </Grid>
        <Skeleton variant='rounded' height={256} />
      </Stack>
    </Box>
  );
};

export default EditorSkeleton;
