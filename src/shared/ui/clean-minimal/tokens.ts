import { keyframes } from '@mui/material/styles';

/**
 * Токены стиля Clean Minimal для редакторов нод (макеты «Read Table DB V3»,
 * «Write DataFrame To DB V4»). Общие для расширений нод, поэтому живут в shared.
 */
export const FONT_FAMILY =
  'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
export const MONO_FONT_FAMILY =
  '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';

export const tokens = {
  text: '#1B1F2A',
  textSecondary: '#4A5161',
  textMuted: '#6B7385',
  textSubtle: '#9AA0AD',
  textDisabled: '#B4BAC6',
  textFaint: '#C3C8D2',
  iconDisabled: '#C9CEDA',
  accent: '#5B5BEF',
  accentStrong: '#4343D6',
  accentSoft: '#EEF0FF',
  accentHover: '#2F2FB8',
  accentRing: '#C9CDFB',
  iconMuted: '#8C93A3',
  border: '#E6E9F0',
  divider: '#EEF0F4',
  dividerSoft: '#F1F3F6',
  surface: '#FFFFFF',
  surfaceMuted: '#F5F6FA',
  hover: '#F8F9FB',
  hoverStrong: '#F1F3F8',
  boxDivider: '#E9EBF0',
  boxHover: '#EBEDF2',
  scrollThumb: '#DCE0E7',
  error: '#DC2626',
  errorText: '#B42318',
  tooltip: '#1B1F2A',
  tooltipShadow: '0 8px 24px -6px rgba(20, 24, 40, 0.3)',
  menuShadow:
    '0 12px 32px -8px rgba(20, 24, 40, 0.18), 0 2px 6px rgba(20, 24, 40, 0.06)',
  raisedShadow: '0 1px 2px rgba(20, 24, 40, 0.08)',
  focusRing: '0 0 0 3px #EEF0FF',
} as const;

export const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const shimmer = keyframes`
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
`;

export const scrollbarStyles = (trackColor: string = tokens.surface) => ({
  scrollbarGutter: 'stable',
  '&::-webkit-scrollbar': { width: 8, height: 8 },
  '&::-webkit-scrollbar-track': { background: 'transparent' },
  '&::-webkit-scrollbar-thumb': {
    background: tokens.scrollThumb,
    borderRadius: 8,
    border: `2px solid ${trackColor}`,
  },
  '&::-webkit-scrollbar-button': { display: 'none', width: 0, height: 0 },
  '@supports not selector(::-webkit-scrollbar)': {
    scrollbarWidth: 'thin',
    scrollbarColor: `${tokens.scrollThumb} transparent`,
  },
});
