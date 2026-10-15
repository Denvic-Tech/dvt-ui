import * as React from 'react';
import { Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { useBuildVersion } from '@/features/profile/build-version-info';

import type { ProjectReadSchema } from '@/shared/gatewayClient';
import { Avatar, Tooltip } from '@/shared/ui/primitives';

import type { HomeSection } from '../config/sections';
import { getDisplayInitial } from '../lib/user';
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
  displayName: string;
  onPickSection: (section: HomeSection) => void;
  recentProjects: ProjectReadSchema[];
  sections: HomeSection[];
};

export const HomeHeader = ({
  displayName,
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
        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}
      >
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

      <Tooltip title={`${displayName} · профиль`}>
        <Box
          component={RouterLink}
          to='/profile'
          aria-label='Открыть профиль'
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '999px',
            textDecoration: 'none',
            color: 'inherit',
            flexShrink: 0,
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
              color: '#ffffff',
            }}
          >
            {getDisplayInitial(displayName)}
          </Avatar>
        </Box>
      </Tooltip>
    </Box>
  );
};
