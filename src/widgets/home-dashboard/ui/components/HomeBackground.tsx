import { Box } from '@mui/material';

import { backgroundBlobSx, homeBackgroundBlobs } from '../styles/animations.ts';

export const HomeBackground = () => (
  <Box
    aria-hidden
    sx={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
    }}
  >
    <Box
      sx={backgroundBlobSx(
        homeBackgroundBlobs.floatA,
        '28s',
        'radial-gradient(circle at center, rgba(91, 75, 255, 0.34) 0%, rgba(91, 75, 255, 0) 70%)',
        {
          width: '42vw',
          height: '42vw',
          top: '-12vh',
          left: '5vw',
        }
      )}
    />
    <Box
      sx={backgroundBlobSx(
        homeBackgroundBlobs.floatB,
        '32s',
        'radial-gradient(circle at center, rgba(139, 123, 255, 0.26) 0%, rgba(139, 123, 255, 0) 70%)',
        {
          width: '36vw',
          height: '36vw',
          top: '4vh',
          right: '-5vw',
        }
      )}
    />
    <Box
      sx={backgroundBlobSx(
        homeBackgroundBlobs.floatC,
        '30s',
        'radial-gradient(circle at center, rgba(106, 166, 255, 0.24) 0%, rgba(106, 166, 255, 0) 70%)',
        {
          width: '46vw',
          height: '46vw',
          bottom: '-20vh',
          left: '26vw',
        }
      )}
    />
  </Box>
);
