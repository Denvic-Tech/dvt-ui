import { Box, Typography } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';

import {
  getControlRadius,
  getRadius,
} from '@/shared/ui/primitives/components/theme-style-helpers';

export const ModalContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
});

export const Body = styled(Box, {
  shouldForwardProp: prop => prop !== 'presentationType',
})<{ presentationType: 'fluid' | 'centered' | 'workspace' }>(
  ({ presentationType }) => ({
    flex: 1,
    overflow: presentationType === 'workspace' ? 'hidden' : 'auto',
    minHeight: 0,
    padding: presentationType === 'workspace' ? 0 : '18px 20px 24px',
  })
);

const BODY_CONTENT_WIDTHS = {
  compact: 640,
  regular: 800,
  wide: 1040,
} as const;

export const BodyContent = styled(Box, {
  shouldForwardProp: prop =>
    prop !== 'presentationType' && prop !== 'contentWidth',
})<{
  presentationType: 'fluid' | 'centered' | 'workspace';
  contentWidth?: keyof typeof BODY_CONTENT_WIDTHS;
}>(({ presentationType, contentWidth = 'regular' }) => ({
  ...(presentationType === 'workspace' ? { height: '100%', minHeight: 0 } : {}),
  ...(presentationType === 'centered'
    ? {
        width: '100%',
        maxWidth: BODY_CONTENT_WIDTHS[contentWidth],
        margin: '0 auto',
      }
    : {}),
}));

export const AlertsContainer = styled(Box)({
  padding: '16px 20px 0',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  flexShrink: 0,
});

export const HeaderRoot = styled(Box)(({ theme }) => ({
  padding: '14px 20px',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  flexShrink: 0,
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: alpha(theme.palette.background.paper, 0.94),
}));

export const HeaderLeft = styled(Box)({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 14,
  flex: 1,
  minWidth: 0,
});

export const IconWrapper = styled(Box)(({ theme }) => ({
  width: 38,
  height: 38,
  borderRadius: getControlRadius(theme, 'sm'),
  background: alpha(theme.palette.primary.main, 0.08),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}));

export const TitleSection = styled(Box)({
  flex: 1,
  minWidth: 0,
});

export const TitleRow = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: theme.palette.text.primary,
}));

export const TitleText = styled('button')(({ theme }) => ({
  minWidth: 0,
  padding: 0,
  border: 0,
  backgroundColor: 'transparent',
  color: 'inherit',
  fontFamily: 'inherit',
  fontSize: '1rem',
  fontWeight: 600,
  lineHeight: 1.3,
  textAlign: 'left',
  cursor: 'text',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  '&:focus-visible': {
    outline: `2px solid ${alpha(theme.palette.primary.main, 0.24)}`,
    outlineOffset: 2,
  },
}));

export const TitleInputWrapper = styled(Box)({
  position: 'absolute',
  top: -2,
  left: -4,
  display: 'inline-grid',
  maxWidth: 'calc(100% + 4px)',
  '&::after': {
    content: 'attr(data-value)',
    gridArea: '1 / 1',
    visibility: 'hidden',
    whiteSpace: 'pre',
    fontFamily: 'inherit',
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.3,
    padding: '1px 4px',
  },
});

export const TitleInput = styled('input')(({ theme }) => ({
  gridArea: '1 / 1',
  appearance: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  color: theme.palette.text.primary,
  lineHeight: 1.3,
  backgroundColor: theme.palette.action.hover,
  border: 'none',
  borderRadius: 6,
  padding: '1px 4px',
  outline: 'none',
  boxSizing: 'border-box',
  width: 0,
  minWidth: '100%',
  maxWidth: '100%',
  height: '100%',
  fontFamily: 'inherit',
}));

export const Subtitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  lineHeight: 1.35,
}));

export const SubtitleRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginTop: 0,
  minWidth: 0,
});

export const SubtitleLinkButton = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: 0,
  border: 'none',
  backgroundColor: 'transparent',
  color: theme.palette.primary.main,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '0.75rem',
  fontWeight: 600,
  lineHeight: 1.4,
  whiteSpace: 'nowrap',
  transition: 'opacity 0.15s ease',
  '&:hover': {
    opacity: 0.78,
  },
}));

export const HeaderActions = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
});

export const CloseButton = styled('button')(({ theme }) => ({
  width: 36,
  height: 36,
  padding: 0,
  border: 'none',
  borderRadius: getRadius(theme),
  backgroundColor: alpha(theme.palette.background.paper, 0.84),
  color: theme.palette.text.secondary,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderRadius: getControlRadius(theme, 'sm'),
    color: theme.palette.text.primary,
  },
}));

export const CommentTriggerButton = styled('button', {
  shouldForwardProp: prop => prop !== 'filled',
})<{ filled: boolean }>(({ filled }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  height: 32,
  maxWidth: 240,
  padding: '0 10px',
  borderRadius: 9,
  fontSize: 12.5,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  background: filled ? '#eef2ff' : '#ffffff',
  color: filled ? '#6366f1' : '#64748b',
  border: `1px solid ${filled ? '#c7d2fe' : '#e2e8f0'}`,
  transition: 'all 150ms ease',
  '&:hover': {
    background: filled ? '#eef2ff' : '#f8fafc',
  },
}));

export const CommentTriggerPreview = styled('span')({
  flex: 1,
  minWidth: 0,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontWeight: 500,
  color: '#1e293b',
});

export const CommentTriggerBadge = styled('span')({
  flexShrink: 0,
  fontSize: 11,
  fontWeight: 700,
  padding: '1px 6px',
  borderRadius: 999,
  background: '#ffffff',
  color: '#6366f1',
  border: '1px solid #c7d2fe',
});

export const CommentModal = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 'calc(100vw - 48px)',
  maxWidth: 960,
  minHeight: 520,
  maxHeight: 'calc(100dvh - 48px)',
  background: '#ffffff',
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  boxShadow: '0 24px 64px rgba(15,23,42,0.28)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    width: 'calc(100vw - 24px)',
    minHeight: 'min(520px, calc(100dvh - 24px))',
    maxHeight: 'calc(100dvh - 24px)',
  },
}));

export const CommentModalHeader = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  padding: '14px 16px',
  borderBottom: '1px solid #e2e8f0',
});

export const CommentModalIcon = styled('div')({
  width: 30,
  height: 30,
  borderRadius: 8,
  background: '#eef2ff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

export const CommentModalTitle = styled(Typography)({
  fontSize: 14,
  fontWeight: 700,
  color: '#1e293b',
});

export const CommentModalSubtitle = styled(Typography)({
  fontSize: 11.5,
  color: '#94a3b8',
  lineHeight: 1.45,
});

export const CommentModalBody = styled('div')({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: 18,
  minHeight: 0,
  overflow: 'auto',
  '& > *': {
    flex: 1,
    minHeight: 0,
  },
});

export const CommentModalFooter = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px 16px',
  borderTop: '1px solid #e2e8f0',
  background: '#f8fafc',
});

export const CommentModalCloseButton = styled('button')({
  width: 32,
  height: 32,
  borderRadius: '50%',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  cursor: 'pointer',
  padding: 0,
  color: '#475569',
  transition: 'all 150ms ease',
  '&:hover': {
    background: '#f8fafc',
  },
});

export const FooterRoot = styled(Box)(({ theme }) => ({
  height: 66,
  padding: '0 20px',
  boxSizing: 'border-box',
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: alpha(theme.palette.background.paper, 0.94),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  flexShrink: 0,
  zIndex: 10,
}));

export const FooterActions = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginLeft: 'auto',
});
