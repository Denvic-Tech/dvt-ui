import { Box, Skeleton } from '@mui/material';

import { RowMain, RowRoot } from './styled';

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

type TokenListRowSkeletonProps = {
  nameWidth: number;
  detailsWidth: number;
  nameColumnWidth?: number;
};

// Repeats the geometry of TokenListRow, so the list does not shift on load.
export const TokenListRowSkeleton = ({
  nameWidth,
  detailsWidth,
  nameColumnWidth,
}: TokenListRowSkeletonProps) => (
  <RowRoot aria-hidden dimmed={false} sx={{ alignItems: 'center' }}>
    <Bone width={24} height={24} radius={7} />
    <RowMain sx={{ alignItems: 'center' }}>
      <Box sx={nameColumnWidth ? { flex: `0 0 ${nameColumnWidth}px` } : {}}>
        <Bone width={nameWidth} height={12} />
      </Box>
      <Bone width={detailsWidth} height={10} />
    </RowMain>
    <Bone width={84} height={10} />
    <Box sx={{ width: 28, flexShrink: 0 }} />
  </RowRoot>
);
