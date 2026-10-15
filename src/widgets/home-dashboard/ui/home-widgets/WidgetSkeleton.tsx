import { Box } from '@mui/material';

import { Skeleton } from '@/shared/ui/primitives';

import { homeFadeInSx } from '../styles/motion';
import { hc } from '../styles/tokens';

export type WidgetSkeletonVariant = 'chart' | 'list' | 'compact-list';

const ROW_WIDTHS = [72, 54, 64, 46, 68, 58, 50, 62];

const Sk = ({
  height,
  radius = 5,
  width = '100%',
}: {
  height: number | string;
  radius?: number;
  width?: number | string;
}) => (
  <Skeleton
    variant='rounded'
    animation='wave'
    width={width}
    height={height}
    sx={{ borderRadius: `${radius}px`, flexShrink: 0, bgcolor: hc.rowLine }}
  />
);

export const WidgetSkeleton = ({
  variant,
}: {
  variant: WidgetSkeletonVariant;
}) => {
  if (variant === 'chart') {
    return (
      <Box aria-busy sx={homeFadeInSx}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <Sk width={44} height={22} radius={6} />
          <Sk width={110} height={9} />
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(24, 1fr)',
            gap: '3px',
            alignItems: 'end',
            height: 44,
            mt: 1.5,
          }}
        >
          {Array.from({ length: 24 }, (_, index) => (
            <Sk
              key={index}
              height={`${30 + ((index * 37) % 70)}%`}
              radius={2}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Sk width={30} height={7} />
          <Sk width={30} height={7} />
          <Sk width={30} height={7} />
        </Box>
      </Box>
    );
  }

  const twoLines = variant === 'list';

  return (
    <Box
      aria-busy
      sx={{ ...homeFadeInSx, display: 'flex', flexDirection: 'column' }}
    >
      {ROW_WIDTHS.map((width, index) => (
        <Box
          key={index}
          sx={{
            display: 'grid',
            gridTemplateColumns: '8px minmax(0, 1fr) auto',
            gap: 1.25,
            alignItems: 'center',
            py: twoLines ? 1 : 0.75,
          }}
        >
          <Sk width={7} height={7} radius={99} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Sk width={`${width}%`} height={9} />
            {twoLines ? <Sk width={`${width * 0.55}%`} height={7} /> : null}
          </Box>
          <Sk width={28} height={8} />
        </Box>
      ))}
    </Box>
  );
};
