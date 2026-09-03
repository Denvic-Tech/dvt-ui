import { useEffect } from 'react';
import Box from '@mui/material/Box';
import { useLocation } from 'react-router-dom';

import type { UIKitPageConfig } from '../model/page-config';

import { UIKitSection } from './UIKitShowcase';

interface UIKitPageRendererProps {
  page: UIKitPageConfig;
}

export const UIKitPageRenderer = ({ page }: UIKitPageRendererProps) => {
  const location = useLocation();

  useEffect(() => {
    const sectionId = location.hash.slice(1);

    if (!sectionId) {
      return;
    }

    const sectionElement = document.getElementById(sectionId);

    if (
      !sectionElement ||
      typeof sectionElement.scrollIntoView !== 'function'
    ) {
      return;
    }

    sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash, location.pathname]);

  return (
    <Box sx={{ display: 'grid', gap: 4 }}>
      {page.lead ? <page.lead /> : null}
      {page.sections.map(section => (
        <UIKitSection
          key={section.id}
          description={section.description}
          id={section.id}
          title={section.label}
        >
          <section.component />
        </UIKitSection>
      ))}
    </Box>
  );
};
