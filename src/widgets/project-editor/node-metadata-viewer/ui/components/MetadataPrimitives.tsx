import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import type { ReactNode } from 'react';

import { formatValue } from '../lib/formatters.ts';

export interface MetadataMetric {
  label: string;
  value: string;
  caption?: string;
}

export interface MetadataItem {
  label: string;
  value: unknown;
  mono?: boolean;
}

type Tone = 'neutral' | 'info' | 'success' | 'warning';

const monoFontFamily =
  '"SFMono-Regular", "SF Mono", "Menlo", "Consolas", monospace';

const getToneStyles = (theme: Theme, tone: Tone) => {
  const palette = {
    neutral: {
      color: theme.palette.text.primary,
      background: alpha(theme.palette.common.white, 0.74),
      border: alpha(theme.palette.common.black, 0.08),
    },
    info: {
      color: theme.palette.info.dark,
      background: alpha(theme.palette.info.main, 0.12),
      border: alpha(theme.palette.info.main, 0.2),
    },
    success: {
      color: theme.palette.success.dark,
      background: alpha(theme.palette.success.main, 0.12),
      border: alpha(theme.palette.success.main, 0.2),
    },
    warning: {
      color: theme.palette.warning.dark,
      background: alpha(theme.palette.warning.main, 0.14),
      border: alpha(theme.palette.warning.main, 0.22),
    },
  } as const;

  return palette[tone];
};

export const MetadataPanelSurface = ({ children }: { children: ReactNode }) => (
  <Stack spacing={2.5}>{children}</Stack>
);

export const MetadataSection = ({
  actions,
  title,
  description,
  children,
}: {
  actions?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}) => (
  <Paper
    elevation={0}
    sx={theme => ({
      p: { xs: 2, md: 2.5 },
      borderRadius: '24px',
      border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
      background:
        theme.palette.mode === 'dark'
          ? `linear-gradient(180deg, ${alpha(theme.palette.common.white, 0.06)} 0%, ${alpha(theme.palette.common.white, 0.03)} 100%)`
          : 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.94) 100%)',
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
      backdropFilter: 'blur(16px)',
    })}
  >
    <Stack spacing={1.75}>
      <Stack
        direction='row'
        alignItems='flex-start'
        justifyContent='space-between'
        gap={1}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 16,
              lineHeight: 1.25,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              fontFamily:
                '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography
              color='text.secondary'
              sx={{ mt: 0.5, fontSize: 13, lineHeight: 1.5 }}
            >
              {description}
            </Typography>
          )}
        </Box>
        {actions ? <Box sx={{ flexShrink: 0 }}>{actions}</Box> : null}
      </Stack>
      {children}
    </Stack>
  </Paper>
);

export const MetadataMetricsGrid = ({
  metrics,
}: {
  metrics: MetadataMetric[];
}) => {
  if (metrics.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(4, minmax(0, 1fr))',
        },
        gap: 1.5,
      }}
    >
      {metrics.map(metric => (
        <Paper
          key={metric.label}
          elevation={0}
          sx={theme => ({
            p: 1.75,
            borderRadius: '20px',
            border: `1px solid ${alpha(theme.palette.common.black, 0.07)}`,
            background:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.06)
                : alpha(theme.palette.common.white, 0.78),
          })}
        >
          <Typography color='text.secondary' sx={{ fontSize: 11 }}>
            {metric.label}
          </Typography>
          <Typography
            sx={{
              mt: 0.5,
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              fontFamily:
                '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            {metric.value}
          </Typography>
          {metric.caption && (
            <Typography color='text.secondary' sx={{ mt: 0.75, fontSize: 12 }}>
              {metric.caption}
            </Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
};

export const MetadataKeyValueGrid = ({ items }: { items: MetadataItem[] }) => {
  const visibleItems = items.filter(
    ({ value }) => value != null && value !== ''
  );

  if (visibleItems.length === 0) {
    return (
      <Typography color='text.secondary' sx={{ fontSize: 13 }}>
        Дополнительные данные не пришли.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        gap: 1.5,
      }}
    >
      {visibleItems.map(item => (
        <Box
          key={item.label}
          sx={theme => ({
            p: 1.5,
            borderRadius: '18px',
            border: `1px solid ${alpha(theme.palette.common.black, 0.07)}`,
            background:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.04)
                : alpha(theme.palette.common.white, 0.74),
          })}
        >
          <Typography color='text.secondary' sx={{ fontSize: 11 }}>
            {item.label}
          </Typography>
          <Typography
            sx={{
              mt: 0.5,
              fontSize: 13,
              lineHeight: 1.5,
              fontFamily: item.mono ? monoFontFamily : 'inherit',
              whiteSpace: item.mono ? 'pre-wrap' : 'normal',
              wordBreak: 'break-word',
            }}
          >
            {formatValue(item.value)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export const MetadataPill = ({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: Tone;
}) => (
  <Chip
    label={label}
    size='small'
    sx={theme => {
      const toneStyles = getToneStyles(theme, tone);

      return {
        height: 26,
        borderRadius: '999px',
        fontWeight: 600,
        fontSize: 11,
        color: toneStyles.color,
        backgroundColor: toneStyles.background,
        border: `1px solid ${toneStyles.border}`,
        '& .MuiChip-label': {
          px: 1.2,
        },
      };
    }}
  />
);

export const MetadataJsonPreview = ({
  value,
  maxHeight = 420,
}: {
  value: unknown;
  maxHeight?: number;
}) => (
  <Box
    component='pre'
    sx={theme => ({
      m: 0,
      p: 2,
      maxHeight,
      overflow: 'auto',
      borderRadius: '20px',
      border: `1px solid ${alpha(theme.palette.common.black, 0.07)}`,
      background:
        theme.palette.mode === 'dark'
          ? alpha(theme.palette.common.black, 0.28)
          : 'rgba(244, 246, 248, 0.95)',
      color: theme.palette.text.primary,
      fontSize: 12,
      lineHeight: 1.6,
      fontFamily: monoFontFamily,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    })}
  >
    {JSON.stringify(value, null, 2)}
  </Box>
);
