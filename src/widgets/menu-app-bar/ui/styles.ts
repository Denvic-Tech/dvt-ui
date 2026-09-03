import {
  alpha,
  keyframes,
  type SxProps,
  type Theme,
} from '@mui/material/styles';

import { getControlRadiusValue } from '@/shared/ui/primitives/components/theme-style-helpers';

export type ProjectBadgeVariant =
  | 'default'
  | 'queued'
  | 'running'
  | 'success'
  | 'error'
  | 'cancel';

type ProjectBadgeTone = {
  backgroundColor: string;
  borderColor: string;
  color: string;
  dotColor: string;
};

const statusPulse = keyframes`
  0% {
    opacity: 0.72;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.12);
  }
  100% {
    opacity: 0.72;
    transform: scale(1);
  }
`;

const projectBadgeToneByVariant: Record<ProjectBadgeVariant, ProjectBadgeTone> =
  {
    default: {
      backgroundColor: '#f1f4f8',
      borderColor: '#e5e7eb',
      color: '#374151',
      dotColor: '#9ca3af',
    },
    queued: {
      backgroundColor: '#dbeafe',
      borderColor: '#bfdbfe',
      color: '#1d4ed8',
      dotColor: '#3b82f6',
    },
    running: {
      backgroundColor: '#dbeafe',
      borderColor: '#bfdbfe',
      color: '#1d4ed8',
      dotColor: '#3b82f6',
    },
    success: {
      backgroundColor: '#d1fae5',
      borderColor: '#a7f3d0',
      color: '#047857',
      dotColor: '#10b981',
    },
    error: {
      backgroundColor: '#fee2e2',
      borderColor: '#fecaca',
      color: '#b91c1c',
      dotColor: '#ef4444',
    },
    cancel: {
      backgroundColor: '#ffedd5',
      borderColor: '#fed7aa',
      color: '#9a3412',
      dotColor: '#f97316',
    },
  };

export const headerPanelSx: SxProps<Theme> = {
  minHeight: 56,
  px: 2,
  py: 1,
  border: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 2,
  overflow: 'hidden',
  boxShadow: theme =>
    `0 11px 26px ${alpha(
      theme.palette.common.black,
      theme.palette.mode === 'light' ? 0.038 : 0.9
    )}, 0 3px 10px ${alpha(
      theme.palette.common.black,
      theme.palette.mode === 'light' ? 0.024 : 0.55
    )}`,
};

export const headerNavSx: SxProps<Theme> = {
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'nowrap',
  overflow: 'hidden',
};

export const headerBrandGroupSx: SxProps<Theme> = {
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  flexWrap: 'nowrap',
  overflow: 'hidden',
  flexShrink: 0,
};

export const headerBrandButtonSx: SxProps<Theme> = {
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  flexWrap: 'nowrap',
  overflow: 'hidden',
  flexShrink: 0,
  p: 0,
  border: 0,
  backgroundColor: 'transparent',
  cursor: 'pointer',
  textAlign: 'left',
  font: 'inherit',
};

export const headerNavContentSx: SxProps<Theme> = {
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  flexWrap: 'nowrap',
  overflow: 'hidden',
};

export const headerBrandDividerSx: SxProps<Theme> = {
  width: '1px',
  height: '26px',
  mx: 2.1,
  flexShrink: 0,
  backgroundColor: theme =>
    alpha(
      theme.palette.mode === 'light' ? '#94a3b8' : theme.palette.common.white,
      theme.palette.mode === 'light' ? 0.28 : 0.18
    ),
};

export const headerActionsSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  flexShrink: 0,
};

export const avatarLinkSx: SxProps<Theme> = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '999px',
  textDecoration: 'none',
  color: 'inherit',
};

export const logoLinkSx: SxProps<Theme> = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: 10,
  textDecoration: 'none',
  color: 'inherit',
  overflow: 'hidden',
  flexShrink: 0,
};

export const logoImageSx: SxProps<Theme> = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  display: 'block',
};

export const avatarSx: SxProps<Theme> = {
  width: 32,
  height: 32,
  background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
  color: '#ffffff',
};

export const dividerSx: SxProps<Theme> = {
  mx: 0.75,
  height: 20,
  borderColor: theme => alpha(theme.palette.primary.main, 0.2),
};

export const productTitleSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 0.05,
  lineHeight: 1,
  color: 'text.primary',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

export const productTitleMetaRowSx: SxProps<Theme> = {
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: 0.75,
  minWidth: 0,
};

export const productTitleBrandSx: SxProps<Theme> = {
  fontWeight: 400,
  fontSize: 12,
  fontFamily:
    '"SF Pro Display", "Geist Variable", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
  letterSpacing: '0.01em',
};

export const productTitleAccentSx: SxProps<Theme> = {
  display: 'inline-block',
  fontWeight: 700,
  fontSize: 15,
  background:
    'linear-gradient(135deg, #2f7a4f 0%, #23856d 24%, #1e7f8d 52%, #256f9f 76%, #315f97 100%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
};

export const productVersionSx: SxProps<Theme> = {
  display: 'inline-block',
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.01em',
  color: 'text.secondary',
  opacity: 0.68,
};

export const chevronSx: SxProps<Theme> = {
  color: 'text.secondary',
  fontSize: 16,
  flexShrink: 0,
};

export const breadcrumbButtonSx: SxProps<Theme> = {
  minWidth: 0,
  minHeight: 26,
  px: 1.25,
  py: 0.25,
  flexShrink: 0,
  fontWeight: 400,
  borderRadius: `${getControlRadiusValue('xs')}px`,
  border: '1px solid transparent',
  borderColor: 'transparent',
  backgroundColor: theme =>
    theme.palette.mode === 'light'
      ? '#f1f4f8'
      : alpha(theme.palette.common.white, 0.04),
  transition:
    'color 140ms ease, background-color 140ms ease, border-color 140ms ease',
  color: theme =>
    theme.palette.mode === 'light' ? '#374151' : theme.palette.text.primary,
  '&:hover': {
    backgroundColor: theme =>
      theme.palette.mode === 'light'
        ? '#e9edf3'
        : alpha(theme.palette.common.white, 0.08),
    borderColor: 'transparent',
    color: theme =>
      theme.palette.mode === 'light' ? '#374151' : theme.palette.text.primary,
  },
  '& .MuiButton-startIcon': {
    mr: 0.45,
    color: 'inherit',
    '& .MuiSvgIcon-root': {
      fontSize: 14,
      color: 'inherit',
    },
  },
};

export const currentProjectSx: SxProps<Theme> = {
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  overflow: 'hidden',
};

export const projectStatusContentSx: SxProps<Theme> = {
  minWidth: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.75,
};

export const projectStatusLabelSx: SxProps<Theme> = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export const getProjectStatusButtonSx = ({
  variant,
  copied,
}: {
  variant: ProjectBadgeVariant;
  copied: boolean;
}): SxProps<Theme> => {
  const tone = projectBadgeToneByVariant[variant];

  return {
    minWidth: 0,
    minHeight: 26,
    px: 1.25,
    py: 0.25,
    fontWeight: 400,
    borderColor: 'transparent',
    backgroundColor: copied ? alpha(tone.dotColor, 0.14) : tone.backgroundColor,
    color: tone.color,
    boxShadow: 'none',
    '&:hover': {
      borderColor: 'transparent',
      backgroundColor: alpha(tone.dotColor, 0.14),
      boxShadow: 'none',
    },
    '&:focus-visible': {
      boxShadow: 'none',
    },
  };
};

export const getStatusDotSx = ({
  variant,
  blink,
}: {
  variant: ProjectBadgeVariant;
  blink: boolean;
}): SxProps<Theme> => ({
  width: 7,
  height: 7,
  borderRadius: '999px',
  flexShrink: 0,
  backgroundColor: projectBadgeToneByVariant[variant].dotColor,
  ...(blink
    ? {
        animation: `${statusPulse} 1.1s ease-in-out infinite`,
      }
    : {}),
});

export const branchBadgeSx: SxProps<Theme> = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
  px: 1,
  py: 0.375,
  borderRadius: '999px',
  fontSize: 11,
  fontWeight: 600,
  color: 'success.dark',
  backgroundColor: theme => alpha(theme.palette.success.main, 0.12),
  border: '1px solid',
  borderColor: theme => alpha(theme.palette.success.main, 0.22),
  flexShrink: 0,
};

export const branchDotSx: SxProps<Theme> = {
  width: 6,
  height: 6,
  borderRadius: '999px',
  flexShrink: 0,
  backgroundColor: 'success.main',
};

export const notificationBadgeSx: SxProps<Theme> = {
  '& .MuiBadge-badge': {
    minWidth: 16,
    height: 16,
    px: 0.5,
    borderRadius: '999px',
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 1,
    boxShadow: 'none',
  },
};
