import { styled } from '@mui/material/styles';

import { shimmer, spin, tokens } from './tokens';

export const IconButtonBase = styled('button', {
  shouldForwardProp: prop => prop !== 'active',
})<{ active?: boolean }>(({ active = false }) => ({
  width: 28,
  height: 28,
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: 'none',
  borderRadius: 8,
  backgroundColor: active ? tokens.accentSoft : 'transparent',
  color: active ? tokens.accentStrong : tokens.textMuted,
  cursor: 'pointer',
  transition: 'background-color .12s, color .12s',
  '&:hover': {
    backgroundColor: active ? tokens.accentSoft : tokens.hoverStrong,
    color: active ? tokens.accentStrong : tokens.text,
  },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${tokens.accent}`,
  },
  '&:disabled, &:disabled:hover': {
    backgroundColor: 'transparent',
    color: tokens.iconDisabled,
    cursor: 'default',
  },
}));

export const SearchField = styled('label')({
  minWidth: 0,
  height: 32,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 4px 0 8px',
  borderRadius: 8,
  backgroundColor: tokens.surfaceMuted,
  color: tokens.textSubtle,
  cursor: 'text',
  '&:focus-within': {
    backgroundColor: tokens.surface,
    boxShadow: `inset 0 0 0 1px ${tokens.accent}, ${tokens.focusRing}`,
  },
  '& input': {
    flex: 1,
    minWidth: 0,
    padding: 0,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: tokens.text,
    fontSize: 13,
    '&::placeholder': { color: tokens.textSubtle, opacity: 1 },
  },
});

export const SearchLead = styled('span')({
  width: 24,
  height: 24,
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: -4,
});

export const Spinner = styled('span', {
  shouldForwardProp: prop => prop !== 'size',
})<{ size?: number }>(({ size = 11 }) => ({
  width: size,
  height: size,
  flex: 'none',
  boxSizing: 'border-box',
  borderRadius: '50%',
  border: `${size >= 16 ? 2 : 1.6}px solid ${tokens.scrollThumb}`,
  borderTopColor: tokens.accent,
  animation: `${spin} .7s linear infinite`,
}));

export const SkeletonBar = styled('span')({
  display: 'block',
  height: 8,
  borderRadius: 4,
  background: 'linear-gradient(90deg, #F1F3F6 0%, #E8EBF0 50%, #F1F3F6 100%)',
  backgroundSize: '200% 100%',
  animation: `${shimmer} 1.2s ease-in-out infinite`,
});

export const LinkButton = styled('button')({
  height: 26,
  flex: 'none',
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: tokens.textMuted,
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'color .12s',
  '&:hover': { color: tokens.accentStrong },
  '&:focus-visible': { outline: 'none', color: tokens.accentStrong },
  '&:disabled, &:disabled:hover': {
    color: tokens.textFaint,
    cursor: 'default',
  },
});

/** Переключатель вкладок: серая подложка 32px с пилюлями (`SegmentButton`). */
export const Segmented = styled('div')({
  height: 32,
  boxSizing: 'border-box',
  display: 'inline-flex',
  flex: 'none',
  padding: 4,
  borderRadius: 8,
  backgroundColor: tokens.surfaceMuted,
});

/** Пилюля 24px: вместе с отступом подложки 4px даёт те же 32px. */
export const SegmentButton = styled('button')({
  height: 24,
  padding: '0 10px',
  border: 'none',
  borderRadius: 5,
  background: 'transparent',
  color: tokens.textMuted,
  fontSize: 12.5,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'color .12s, background-color .12s',
  '&:hover': { color: tokens.text },
  '&[aria-selected="true"]': {
    backgroundColor: tokens.surface,
    color: tokens.text,
    boxShadow: tokens.raisedShadow,
  },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `inset 0 0 0 1px ${tokens.accent}`,
  },
  '&:disabled, &:disabled:hover': {
    color: tokens.textDisabled,
    cursor: 'default',
  },
});

export const MutedText = styled('div')({
  padding: 8,
  fontSize: 12.5,
  color: tokens.textSubtle,
});
