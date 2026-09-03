import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ChevronRight } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

import { Panel, Tooltip } from '@/shared/ui/primitives';

import type { UIKitPageConfig } from '../model/page-config';

import {
  createUIKitNavIconSx,
  createUIKitNavItemSx,
  createUIKitSectionLinkSx,
} from './uikit-styles';

interface UIKitSidebarProps {
  pages: readonly UIKitPageConfig[];
}

const UIKIT_SIDEBAR_TOP_OFFSET = 80;
const UIKIT_SIDEBAR_BOTTOM_GAP = 16;

export const UIKitSidebar = ({ pages }: UIKitSidebarProps) => {
  const location = useLocation();

  return (
    <Box
      component='aside'
      sx={{
        alignSelf: 'start',
        height: `calc(100dvh - ${UIKIT_SIDEBAR_TOP_OFFSET + UIKIT_SIDEBAR_BOTTOM_GAP}px)`,
        maxHeight: `calc(100dvh - ${UIKIT_SIDEBAR_TOP_OFFSET + UIKIT_SIDEBAR_BOTTOM_GAP}px)`,
        minHeight: 0,
        position: 'sticky',
        top: 0,
      }}
    >
      <Panel
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', p: 2 }}>
          <Typography component='h1' sx={{ fontSize: 20, fontWeight: 600 }}>
            UI Kit
          </Typography>
          <Typography color='text.secondary' sx={{ fontSize: 13, mt: 0.5 }}>
            Секции и сценарии для desktop UI DVT.
          </Typography>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 1.5 }}>
          <Box sx={{ display: 'grid', gap: 1 }}>
            {pages.map(page => {
              const Icon = page.icon;
              const isActive = location.pathname === page.to;

              if (page.disabled) {
                return (
                  <Tooltip
                    key={page.key}
                    title='Эта подстраница пока не реализована.'
                  >
                    <Box sx={theme => createUIKitNavItemSx(false)(theme)}>
                      <Box sx={createUIKitNavIconSx(false)}>
                        <Icon size={18} />
                      </Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                        {page.label}
                      </Typography>
                    </Box>
                  </Tooltip>
                );
              }

              return (
                <Box key={page.key} sx={{ display: 'grid', gap: 0.5 }}>
                  <Box
                    component={NavLink}
                    end
                    sx={{ textDecoration: 'none' }}
                    to={page.to}
                  >
                    <Box sx={createUIKitNavItemSx(isActive)}>
                      <Box sx={createUIKitNavIconSx(isActive)}>
                        <Icon size={18} />
                      </Box>
                      <Box
                        sx={{
                          alignItems: 'center',
                          display: 'flex',
                          flex: 1,
                          gap: 1,
                          justifyContent: 'space-between',
                          minWidth: 0,
                        }}
                      >
                        <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                          {page.label}
                        </Typography>
                        <ChevronRight
                          size={16}
                          style={{
                            transform: isActive
                              ? 'rotate(90deg)'
                              : 'rotate(0deg)',
                            transition: 'transform 150ms ease',
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  {isActive ? (
                    <Box sx={{ display: 'grid', gap: 0.25, pl: 6.5 }}>
                      {page.sections.map(section => {
                        const isSectionActive =
                          location.hash === `#${section.id}`;

                        return (
                          <Box
                            key={section.id}
                            component={NavLink}
                            sx={createUIKitSectionLinkSx(isSectionActive)}
                            to={`${page.to}#${section.id}`}
                          >
                            {section.label}
                          </Box>
                        );
                      })}
                    </Box>
                  ) : null}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Panel>
    </Box>
  );
};
