import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { Box, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/primitives';

import type { HomeSection } from '../types/home.ts';

type HomeSectionCardProps = Omit<HomeSection, 'id'>;

export const HomeSectionCard = ({
  description,
  icon,
  items,
  title,
}: HomeSectionCardProps) => (
  <Card
    sx={{
      height: '100%',
      borderRadius: '14px',
      boxShadow: '0 8px 18px -16px rgba(22, 24, 29, 0.12)',
    }}
  >
    <CardHeader
      sx={{
        px: 2,
        pt: 2,
        pb: 1.5,
      }}
    >
      <Stack direction='row' spacing={1.5} alignItems='center'>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '9px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'linear-gradient(135deg, rgba(91, 75, 255, 0.14) 0%, rgba(106, 166, 255, 0.16) 100%)',
            color: 'primary.main',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <CardTitle sx={{ fontSize: 15 }}>{title}</CardTitle>
          <CardDescription
            sx={{
              fontSize: 11.5,
              lineHeight: 1.35,
              display: '-webkit-box',
              overflow: 'hidden',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
            }}
          >
            {description}
          </CardDescription>
        </Box>
      </Stack>
    </CardHeader>
    <CardContent sx={{ display: 'grid', gap: 0.75, px: 2, pb: 1.5, pt: 0 }}>
      {items.map(item => {
        const sharedContent = (
          <>
            <Box
              sx={{
                width: 28,
                display: 'flex',
                justifyContent: 'flex-start',
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '7px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(15, 23, 42, 0.04)',
                  color: item.disabled ? 'text.disabled' : 'text.secondary',
                }}
              >
                {item.icon}
              </Box>
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  lineHeight: 1.2,
                  color: item.disabled ? 'text.disabled' : 'text.primary',
                }}
              >
                {item.label}
              </Typography>
              <Typography
                sx={{
                  mt: 0,
                  fontSize: 11.5,
                  lineHeight: 1.35,
                  display: '-webkit-box',
                  overflow: 'hidden',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 1,
                  color: item.disabled ? 'text.disabled' : 'text.secondary',
                }}
              >
                {item.description}
              </Typography>
            </Box>
            {!item.disabled ? (
              <Box
                sx={{
                  ml: 'auto',
                  width: 16,
                  flexShrink: 0,
                  display: 'inline-flex',
                  justifyContent: 'flex-end',
                  color: 'primary.main',
                }}
              >
                <ChevronRightRoundedIcon
                  className='home-section-item-arrow'
                  sx={{
                    fontSize: 16,
                    opacity: 0,
                    transform: 'translateX(-3px)',
                    transition: 'opacity 140ms ease, transform 140ms ease',
                  }}
                />
              </Box>
            ) : null}
          </>
        );

        const interactiveSx = {
          display: 'flex',
          alignSelf: 'stretch',
          alignItems: 'center',
          gap: 1.5,
          boxSizing: 'border-box',
          mx: -1.5,
          px: 1.5,
          py: 0.9,
          borderRadius: '12px',
          position: 'relative',
          isolation: 'isolate',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 6,
            bottom: 0,
            left: 6,
            borderRadius: '12px',
            backgroundColor: 'transparent',
            transition: 'background-color 140ms ease',
            zIndex: 0,
          },
          '& > *': {
            position: 'relative',
            zIndex: 1,
          },
          '&:hover::before': {
            backgroundColor: 'rgba(15, 23, 42, 0.04)',
          },
          '&:hover .home-section-item-arrow': {
            opacity: 1,
            transform: 'translateX(0)',
          },
        } as const;

        if (item.disabled) {
          return (
            <Box
              key={item.key}
              sx={{
                display: 'flex',
                alignSelf: 'stretch',
                alignItems: 'center',
                gap: 1.5,
                boxSizing: 'border-box',
                mx: -1.5,
                px: 1.5,
                py: 0.9,
                borderRadius: '12px',
                opacity: 0.64,
                bgcolor: 'rgba(148, 163, 184, 0.05)',
              }}
            >
              {sharedContent}
            </Box>
          );
        }

        if (item.to) {
          return (
            <Box
              key={item.key}
              component={RouterLink}
              to={item.to}
              sx={{
                ...interactiveSx,
                textDecoration: 'none',
              }}
            >
              {sharedContent}
            </Box>
          );
        }

        return (
          <Box
            key={item.key}
            component='button'
            type='button'
            onClick={item.onClick}
            sx={{
              ...interactiveSx,
              border: 0,
              bgcolor: 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            {sharedContent}
          </Box>
        );
      })}
    </CardContent>
  </Card>
);
