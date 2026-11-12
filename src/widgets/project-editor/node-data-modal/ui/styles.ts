import { Box, Typography } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';

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

/** Цвета шапки по макету настроек нод (Clean Minimal). */
const headerTokens = {
  text: '#1B1F2A',
  muted: '#6B7385',
  subtle: '#9AA0AD',
  accent: '#5B5BEF',
  border: '#E6E9F0',
  divider: '#EEF0F4',
  hover: '#F1F3F8',
  surface: '#FFFFFF',
} as const;

const HEADER_FONT_FAMILY =
  'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export const HeaderRoot = styled('header')({
  height: 44,
  flexShrink: 0,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '0 12px 0 16px',
  borderBottom: `1px solid ${headerTokens.divider}`,
  backgroundColor: headerTokens.surface,
  color: headerTokens.text,
  fontFamily: HEADER_FONT_FAMILY,
});

export const HeaderNodeIcon = styled('span')({
  width: 16,
  height: 16,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 6,
  // Иконка ноды — акцентного синего, кнопки справа остаются серыми.
  color: headerTokens.accent,
});

export const TitleRow = styled('div')({
  position: 'relative',
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
});

const titleFont = {
  fontFamily: 'inherit',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '20px',
} as const;

export const TitleText = styled('button')({
  ...titleFont,
  minWidth: 0,
  margin: 0,
  padding: 0,
  border: 0,
  backgroundColor: 'transparent',
  color: 'inherit',
  textAlign: 'left',
  cursor: 'text',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  '&:focus-visible': {
    outline: `2px solid ${alpha(headerTokens.accent, 0.32)}`,
    outlineOffset: 2,
    borderRadius: 4,
  },
});

export const TitleInputWrapper = styled('div')({
  position: 'absolute',
  top: -2,
  left: -4,
  display: 'inline-grid',
  maxWidth: 'calc(100% + 4px)',
  '&::after': {
    ...titleFont,
    content: 'attr(data-value)',
    gridArea: '1 / 1',
    visibility: 'hidden',
    whiteSpace: 'pre',
    padding: '2px 4px',
  },
});

export const TitleInput = styled('input')({
  ...titleFont,
  gridArea: '1 / 1',
  appearance: 'none',
  boxSizing: 'border-box',
  width: 0,
  minWidth: '100%',
  maxWidth: '100%',
  height: '100%',
  padding: '2px 4px',
  border: 'none',
  borderRadius: 6,
  outline: 'none',
  backgroundColor: headerTokens.hover,
  color: headerTokens.text,
});

/** Тип ноды рядом с названием — только если ноду переименовали. */
export const HeaderSecondary = styled('span')({
  minWidth: 0,
  flexShrink: 1000,
  marginLeft: 6,
  overflow: 'hidden',
  fontSize: 13,
  color: headerTokens.subtle,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const HeaderSpacer = styled('span')({
  flex: 1,
  minWidth: 8,
});

export const HeaderIconButton = styled('button')({
  position: 'relative',
  width: 28,
  height: 28,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: 'none',
  borderRadius: 8,
  backgroundColor: 'transparent',
  color: headerTokens.muted,
  cursor: 'pointer',
  transition: 'background-color .12s, color .12s',
  '&:hover': {
    backgroundColor: headerTokens.hover,
    color: headerTokens.text,
  },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${headerTokens.accent}`,
  },
});

/** Точка на кнопке комментария, когда комментарий заполнен. */
export const HeaderBadge = styled('span')({
  position: 'absolute',
  top: 4,
  right: 4,
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: headerTokens.accent,
  boxShadow: `0 0 0 2px ${headerTokens.surface}`,
});

export const HeaderDivider = styled('span')({
  width: 1,
  height: 16,
  flexShrink: 0,
  margin: '0 4px',
  backgroundColor: headerTokens.border,
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

/** Футер по макету настроек нод (Clean Minimal): 56 px, кнопки 36 px. */
export const FooterRoot = styled('footer')({
  height: 56,
  flexShrink: 0,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 12px 0 16px',
  borderTop: `1px solid ${headerTokens.divider}`,
  backgroundColor: headerTokens.surface,
  color: headerTokens.text,
  fontFamily: HEADER_FONT_FAMILY,
  zIndex: 10,
});

export const FooterActions = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginLeft: 'auto',
});

export const FooterButton = styled('button', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: 'primary' | 'secondary' }>(({ tone }) => ({
  height: 36,
  flexShrink: 0,
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: tone === 'primary' ? '0 18px' : '0 16px',
  border: tone === 'primary' ? 'none' : `1px solid ${headerTokens.border}`,
  borderRadius: 9,
  backgroundColor: tone === 'primary' ? headerTokens.accent : '#FFFFFF',
  color: tone === 'primary' ? '#FFFFFF' : headerTokens.text,
  fontFamily: 'inherit',
  fontSize: 13.5,
  fontWeight: tone === 'primary' ? 600 : 500,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  '& > svg': { flexShrink: 0 },
  '&:hover': {
    backgroundColor: tone === 'primary' ? '#4343D6' : '#F5F6FA',
  },
  '&:focus-visible': {
    outline: `2px solid ${alpha(headerTokens.accent, 0.4)}`,
    outlineOffset: 2,
  },
  '&:disabled, &:disabled:hover': {
    backgroundColor: tone === 'primary' ? '#E9ECF2' : '#FFFFFF',
    color: tone === 'primary' ? '#A3A9B6' : '#B4BAC6',
    cursor: 'default',
  },
}));

export const FooterHint = styled('span')({
  marginRight: 4,
  fontSize: 12,
  fontWeight: 500,
  lineHeight: 1.4,
  whiteSpace: 'nowrap',
  color: headerTokens.subtle,
  '& b': { fontWeight: 600 },
});
