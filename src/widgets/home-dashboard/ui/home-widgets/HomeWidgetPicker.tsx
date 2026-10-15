import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Box, ButtonBase, Drawer, useTheme } from '@mui/material';

import { getHomeCssVars, hc } from '../styles/tokens';

import type { HomeWidgetDefinition, HomeWidgetId } from './types';

type HomeWidgetPickerProps = {
  available: readonly HomeWidgetDefinition[];
  onClose: () => void;
  onToggle: (id: HomeWidgetId) => void;
  open: boolean;
  selectedIds: ReadonlySet<HomeWidgetId>;
};

/** Right-side panel to switch widgets on and off. */
export const HomeWidgetPicker = ({
  available,
  onClose,
  onToggle,
  open,
  selectedIds,
}: HomeWidgetPickerProps) => {
  const theme = useTheme();

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: { sx: { backgroundColor: 'rgba(23, 24, 28, 0.18)' } },
        paper: {
          sx: {
            ...getHomeCssVars(theme.palette.mode),
            top: 10,
            right: 10,
            bottom: 10,
            height: 'auto',
            width: 380,
            maxWidth: 'calc(100% - 20px)',
            borderRadius: '16px',
            border: `1px solid ${hc.line}`,
            backgroundColor: hc.card,
            backgroundImage: 'none',
            boxShadow: '0 30px 70px -30px rgba(23, 24, 28, 0.45)',
            color: hc.ink,
          },
        },
      }}
    >
      <Box
        component='header'
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.25,
          p: '20px 20px 14px',
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Box
            component='h2'
            sx={{
              m: 0,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: '-0.2px',
            }}
          >
            Виджеты на главной
          </Box>
          <Box sx={{ fontSize: 12.5, color: hc.ink3, mt: 0.375 }}>
            Выбрано {selectedIds.size} из {available.length}
          </Box>
        </Box>
        <ButtonBase
          disableRipple
          aria-label='Закрыть'
          onClick={onClose}
          sx={{
            width: 24,
            height: 24,
            borderRadius: '6px',
            color: hc.ink2,
            '&:hover': { backgroundColor: hc.brandSoft, color: hc.brand },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </ButtonBase>
      </Box>

      <Box
        role='list'
        sx={{
          px: 1.5,
          pb: 2.5,
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.75,
        }}
      >
        {available.map(widget => {
          const Icon = widget.icon;
          const on = selectedIds.has(widget.id);

          return (
            <ButtonBase
              key={widget.id}
              disableRipple
              role='switch'
              aria-checked={on}
              aria-label={widget.title}
              onClick={() => onToggle(widget.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.25,
                borderRadius: '11px',
                fontFamily: 'inherit',
                textAlign: 'left',
                transition: 'background-color .14s',
                '&:hover': { backgroundColor: hc.brandHover },
              }}
            >
              <Box
                component='span'
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  backgroundColor: on ? hc.brandSoft : hc.rowLine,
                  color: on ? hc.brand : hc.ink3,
                  transition: 'background-color .18s, color .18s',
                }}
              >
                <Icon sx={{ fontSize: 17 }} />
              </Box>
              <Box component='span' sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  component='span'
                  sx={{
                    display: 'block',
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: hc.ink,
                  }}
                >
                  {widget.title}
                </Box>
                <Box
                  component='span'
                  sx={{
                    display: 'block',
                    fontSize: 12,
                    color: hc.ink3,
                    mt: '1px',
                  }}
                >
                  {widget.description}
                </Box>
              </Box>
              <Box
                component='span'
                aria-hidden
                sx={{
                  width: 30,
                  height: 18,
                  borderRadius: '99px',
                  position: 'relative',
                  flexShrink: 0,
                  backgroundColor: on ? hc.brand : hc.line2,
                  transition: 'background-color .18s',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 2,
                    left: 2,
                    width: 14,
                    height: 14,
                    borderRadius: '99px',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                    transform: on ? 'translateX(12px)' : 'none',
                    transition: 'transform .2s cubic-bezier(.2,.8,.2,1)',
                  },
                }}
              />
            </ButtonBase>
          );
        })}
      </Box>
    </Drawer>
  );
};
