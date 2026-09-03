import { Box, Typography, styled } from '@mui/material';
import { keyframes } from '@mui/material/styles';

const bounce = keyframes`
  0%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-6px);
  }
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

export const OverlayRoot = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 300,
  width: '100%',
  padding: '24px 12px',
  boxSizing: 'border-box',
}));

export const SuccessDialogContainer = styled(Box)(() => ({
  width: '100%',
  maxWidth: 384,
  padding: 8,
  textAlign: 'center',
  boxSizing: 'border-box',
}));

export const SuccessIconContainer = styled(Box)(() => ({
  width: 64,
  height: 64,
  borderRadius: 16,
  backgroundColor: '#d1fae5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 20px',
  '& .MuiSvgIcon-root': {
    fontSize: 32,
    color: '#059669',
  },
}));

export const SuccessTitle = styled(Typography)(() => ({
  fontSize: 18,
  fontWeight: 600,
  color: '#111827',
  marginBottom: 8,
}));

export const SuccessSubtitle = styled(Typography)(() => ({
  fontSize: 14,
  fontWeight: 400,
  color: '#059669',
  marginBottom: 16,
  lineHeight: 1.5,
}));

export const AnimatedDotsContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  marginBottom: 8,
}));

export const AnimatedDot = styled(Box, {
  shouldForwardProp: prop => prop !== 'delay',
})<{ delay?: number }>(({ delay = 0 }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: '#10b981',
  animation: `${bounce} 1s ease-in-out infinite`,
  animationDelay: `${delay}ms`,
}));

export const HintText = styled(Typography)(() => ({
  fontSize: 12,
  fontWeight: 400,
  color: '#9ca3af',
  lineHeight: 1.4,
}));

export const ErrorDialogContainer = styled(Box)(() => ({
  width: '100%',
  maxWidth: 640,
  boxSizing: 'border-box',
}));

export const ErrorDialogContent = styled(Box)(() => ({
  padding: 8,
  textAlign: 'center',
  boxSizing: 'border-box',
}));

export const ErrorIconContainer = styled(Box)(() => ({
  width: 64,
  height: 64,
  borderRadius: 16,
  backgroundColor: '#fee2e2',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 20px',
  '& .MuiSvgIcon-root': {
    fontSize: 32,
    color: '#dc2626',
  },
}));

export const ErrorTitle = styled(Typography)(() => ({
  fontSize: 18,
  fontWeight: 600,
  color: '#111827',
  marginBottom: 16,
}));

export const ErrorDetailsBox = styled(Box)(() => ({
  width: '100%',
  padding: 12,
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 12,
  marginBottom: 16,
  textAlign: 'left',
  minHeight: 148,
  maxHeight: 220,
  overflowY: 'auto',
  '@media (min-height: 900px)': {
    minHeight: 296,
    maxHeight: 440,
  },
  '&::-webkit-scrollbar': {
    width: 4,
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#fca5a5',
    borderRadius: 2,
  },
}));

export const ErrorDetailsToolbar = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  marginBottom: 8,
}));

export const ErrorDetailsCaption = styled(Typography)(() => ({
  fontSize: 11,
  fontWeight: 600,
  color: '#b91c1c',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}));

export const ErrorCopyButton = styled('button')(() => ({
  width: 20,
  height: 20,
  padding: 0,
  color: '#b91c1c',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 0,
  cursor: 'pointer',
  transition: 'color 150ms ease',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': {
    color: '#991b1b',
  },
  '& .MuiSvgIcon-root': {
    fontSize: 16,
  },
}));

export const ErrorDetailsContent = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
}));

export const ErrorDetailsIcon = styled(Box)(() => ({
  flexShrink: 0,
  marginTop: 2,
  '& .MuiSvgIcon-root': {
    fontSize: 16,
    color: '#ef4444',
  },
}));

export const ErrorDetailsText = styled(Typography)(() => ({
  fontSize: 12,
  fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontWeight: 400,
  color: '#b91c1c',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
}));

export const ErrorHint = styled(Typography)(() => ({
  fontSize: 14,
  fontWeight: 400,
  color: '#6b7280',
  lineHeight: 1.5,
}));

export const ErrorDialogFooter = styled(Box)(() => ({
  padding: '8px 0 0',
  display: 'flex',
  justifyContent: 'center',
}));

export const ErrorActionButton = styled('button')(() => ({
  padding: '10px 24px',
  fontSize: 14,
  fontWeight: 500,
  fontFamily: 'inherit',
  color: '#ffffff',
  backgroundColor: '#ef4444',
  border: 'none',
  borderRadius: 12,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#dc2626',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
}));

export const LoadingContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
  width: '100%',
  maxWidth: 384,
}));

export const SpinnerIconContainer = styled(Box)(() => ({
  width: 48,
  height: 48,
  borderRadius: 16,
  backgroundColor: '#e0e7ff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const SpinnerSvg = styled('svg')(() => ({
  width: 24,
  height: 24,
  color: '#6366f1',
  animation: `${spin} 1s linear infinite`,
  '& circle': {
    opacity: 0.25,
  },
  '& path': {
    opacity: 0.75,
  },
}));

export const LoadingText = styled(Typography)(() => ({
  fontSize: 14,
  fontWeight: 400,
  color: '#6b7280',
}));
