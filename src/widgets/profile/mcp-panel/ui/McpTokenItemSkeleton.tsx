import { Box, Skeleton } from '@mui/material';

const Bone = ({
  width,
  height,
  radius = 6,
}: {
  width: number;
  height: number;
  radius?: number;
}) => (
  <Skeleton
    variant='rounded'
    animation='wave'
    width={width}
    height={height}
    sx={{ flexShrink: 0, borderRadius: `${radius}px`, bgcolor: '#F1F3F8' }}
  />
);

type McpTokenItemSkeletonProps = {
  nameWidth: number;
  accessWidth: number;
};

// Repeats the geometry of McpTokenItem, so the list does not shift on load.
export const McpTokenItemSkeleton = ({
  nameWidth,
  accessWidth,
}: McpTokenItemSkeletonProps) => (
  <Box
    aria-hidden
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      boxSizing: 'border-box',
      height: 48,
      pl: 1.5,
      pr: 1,
      borderBottom: '1px solid #EEF0F4',
      '&:last-of-type': { borderBottom: 'none' },
    }}
  >
    <Bone width={24} height={24} radius={7} />
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
      }}
    >
      <Box sx={{ flex: '0 0 130px' }}>
        <Bone width={nameWidth} height={12} />
      </Box>
      <Bone width={accessWidth} height={10} />
    </Box>
    <Bone width={84} height={10} />
    <Box sx={{ width: 28, flexShrink: 0 }} />
  </Box>
);
