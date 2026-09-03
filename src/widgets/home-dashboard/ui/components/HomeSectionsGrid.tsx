import { Box, Typography } from '@mui/material';

import type { HomeSection } from '../types/home.ts';

import { HomeSectionCard } from './HomeSectionCard.tsx';

type HomeSectionsGridProps = {
  sections: HomeSection[];
};

export const HomeSectionsGrid = ({ sections }: HomeSectionsGridProps) => (
  <>
    <Typography
      component='h2'
      sx={{
        fontSize: 13.5,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'text.secondary',
      }}
    >
      Разделы
    </Typography>

    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          lg: 'repeat(2, minmax(0, 1fr))',
        },
        gap: 2,
      }}
    >
      {sections.map(section => (
        <HomeSectionCard
          key={section.id}
          description={section.description}
          icon={section.icon}
          items={section.items}
          title={section.title}
        />
      ))}
    </Box>
  </>
);
