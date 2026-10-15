import { Box } from '@mui/material';
import type * as React from 'react';
import { Link as RouterLink } from 'react-router-dom';

import type { HomeSection } from '../config/sections';
import { hc, homeEllipsisSx } from '../styles/tokens';

type SectionLinkProps = {
  onPick: (section: HomeSection) => void;
  section: HomeSection;
  variant: 'card' | 'menu';
};

/** Navigation row for a home section; `soon` sections render inert. */
export const SectionLink = ({ onPick, section, variant }: SectionLinkProps) => {
  const Icon = section.icon;
  const isCard = variant === 'card';
  const { to } = section;

  const content: React.ReactNode = (
    <>
      {isCard ? (
        <Box component='span' className='home-section-icon' sx={cardIconSx}>
          <Icon sx={{ fontSize: 15 }} />
        </Box>
      ) : (
        <Icon sx={{ fontSize: 16, color: hc.ink3, flexShrink: 0 }} />
      )}
      <Box component='span' sx={{ ...homeEllipsisSx, flex: 1, minWidth: 0 }}>
        {section.label}
      </Box>
      {section.soon ? (
        <Box component='span' sx={{ fontSize: 11, color: hc.ink3 }}>
          скоро
        </Box>
      ) : null}
    </>
  );

  const sx = {
    display: 'flex',
    alignItems: 'center',
    gap: 1.25,
    px: 1,
    py: isCard ? '5px' : '7px',
    borderRadius: '9px',
    fontSize: 13,
    color: hc.ink,
    textDecoration: 'none',
    transition: 'background-color .14s, color .14s',
  } as const;

  if (section.soon || !to) {
    return (
      <Box
        aria-disabled
        title='Раздел появится позже'
        sx={{ ...sx, opacity: 0.45, cursor: 'default' }}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      component={RouterLink}
      to={to}
      onClick={() => onPick(section)}
      sx={{
        ...sx,
        '&:hover, &:focus-visible': {
          backgroundColor: hc.brandHover,
          color: hc.ink,
          outline: 'none',
        },
        '&:hover .home-section-icon, &:focus-visible .home-section-icon': {
          backgroundColor: hc.brandSoftHover,
          color: hc.brand,
        },
      }}
    >
      {content}
    </Box>
  );
};

const cardIconSx = {
  width: 24,
  height: 24,
  borderRadius: '6px',
  backgroundColor: hc.brandIconBg,
  color: hc.brandIcon,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'background-color .18s, color .18s',
} as const;
