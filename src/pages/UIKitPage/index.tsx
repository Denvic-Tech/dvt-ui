import Box from '@mui/material/Box';
import { Navigate, Route, Routes } from 'react-router-dom';

import { Page, TooltipProvider } from '@/shared/ui/primitives';

import { defaultUIKitPage, uikitPageConfigs } from './model/page-config';
import { UIKitPageRenderer } from './ui/UIKitPageRenderer';
import { UIKitSidebar } from './ui/UIKitSidebar';

const getRoutePath = (to: string) => {
  const segments = to.split('/');
  return segments[segments.length - 1] ?? '';
};

export default function UIKitPage() {
  return (
    <TooltipProvider>
      <Page size='full'>
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            minHeight: '100%',
            alignItems: 'start',
            gridTemplateColumns: '280px minmax(0, 1fr)',
          }}
        >
          <UIKitSidebar pages={uikitPageConfigs} />

          <Box component='main' sx={{ minWidth: 0, pb: 2 }}>
            <Box sx={{ marginInline: 'auto', maxWidth: 1520, width: '100%' }}>
              <Routes>
                <Route
                  index
                  element={
                    <Navigate replace to={getRoutePath(defaultUIKitPage.to)} />
                  }
                />
                {uikitPageConfigs.map(page => (
                  <Route
                    key={page.key}
                    path={getRoutePath(page.to)}
                    element={<UIKitPageRenderer page={page} />}
                  />
                ))}
                <Route
                  path='*'
                  element={
                    <Navigate replace to={getRoutePath(defaultUIKitPage.to)} />
                  }
                />
              </Routes>
            </Box>
          </Box>
        </Box>
      </Page>
    </TooltipProvider>
  );
}
