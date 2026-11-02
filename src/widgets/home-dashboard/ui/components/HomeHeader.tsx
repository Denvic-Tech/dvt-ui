import * as React from 'react';
import { Box, Typography } from '@mui/material';

import { useBuildVersion } from '@/features/profile/build-version-info';
import { UserMenu } from '@/features/profile/user-menu';

import type { ProjectReadSchema } from '@/shared/gatewayClient';

import type { HomeSection } from '../config/sections';
import {
  productTitleAccentSx,
  productTitleBrandSx,
  productTitleMetaRowSx,
  productTitleSx,
  productVersionSx,
} from '../styles/brand';
import { homeAppearSx } from '../styles/motion';

import { HomeSearch } from './HomeSearch';

type HomeHeaderProps = {
  onPickSection: (section: HomeSection) => void;
  recentProjects: ProjectReadSchema[];
  sections: HomeSection[];
};

export const HomeHeader = ({
  onPickSection,
  recentProjects,
  sections,
}: HomeHeaderProps) => {
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
    <Box
      component='header'
      sx={{
        ...homeAppearSx(0),
        display: 'flex',
        alignItems: 'center',
        gap: 2.5,
        flexWrap: 'wrap',
        position: 'relative',
        zIndex: 40,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'last baseline',
          gap: 1.5,
          minWidth: 0,
        }}
      >
        <Box
          component='img'
          src='/Denvic-logo.svg'
          alt=''
          sx={{ width: 35, height: 35, display: 'block', flexShrink: 0 }}
        />
        <Typography component='h1' sx={productTitleSx}>
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
      </Box>

      <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />

      <HomeSearch
        onPickSection={onPickSection}
        recentProjects={recentProjects}
        sections={sections}
      />

      <UserMenu />
    </Box>
  );
};
