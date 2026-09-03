import * as React from 'react';
import { Box, Stack, Typography } from '@mui/material';

import { useBuildVersion } from '@/features/profile/build-version-info';

import { Skeleton } from '@/shared/ui/primitives';

import { getGreeting } from '../lib/date.ts';
import {
  productTitleAccentSx,
  productTitleBrandSx,
  productTitleMetaRowSx,
  productTitleSx,
  productVersionSx,
} from '../styles/brand.ts';

type HomeHeroProps = {
  displayName: string;
  greetingDate: Date;
  userLoading: boolean;
};

export const HomeHero = ({
  displayName,
  greetingDate,
  userLoading,
}: HomeHeroProps) => {
  const {
    versionInfo,
    isLoading: isVersionLoading,
    loadBuildVersion,
  } = useBuildVersion();
  const buildVersion = versionInfo?.version?.trim() ?? '';

  React.useEffect(() => {
    if (!buildVersion && !isVersionLoading) {
      void loadBuildVersion();
    }
  }, [buildVersion, isVersionLoading, loadBuildVersion]);

  return (
    <Stack spacing={3.25}>
      <Stack direction='row' spacing={1.5} alignItems='center'>
        <Box
          component='img'
          src='/DVT-logo.png'
          alt='DVT'
          sx={{
            width: 52,
            height: 52,
            borderRadius: '16px',
            flexShrink: 0,
            boxShadow: '0 12px 28px -18px rgba(91, 75, 255, 0.58)',
          }}
        />
        <Stack spacing={0.35} sx={{ minWidth: 0 }}>
          <Typography component='div' sx={productTitleSx}>
            <Box component='span' sx={productTitleBrandSx}>
              Denvic
            </Box>
            <Box component='span' sx={productTitleMetaRowSx}>
              <Box component='span' sx={productTitleAccentSx}>
                Visual Transformer
              </Box>
              {buildVersion ? (
                <Box component='span' sx={productVersionSx}>
                  {buildVersion}
                </Box>
              ) : null}
            </Box>
          </Typography>
        </Stack>
      </Stack>
      {userLoading ? (
        <Skeleton sx={{ width: 260, height: 42 }} />
      ) : (
        <Box>
          <Typography
            component='h1'
            sx={{
              fontSize: { xs: 30, md: 36 },
              fontWeight: 600,
              lineHeight: 1.02,
              letterSpacing: '-0.04em',
              color: 'text.primary',
            }}
          >
            {`${getGreeting(greetingDate)}, ${displayName}`}
          </Typography>
          <Typography
            sx={{
              mt: 0.6,
              fontSize: 15,
              color: 'text.secondary',
            }}
          >
            Всё рабочее пространство — в одном месте.
          </Typography>
        </Box>
      )}
    </Stack>
  );
};
