import { ButtonBase, styled } from '@mui/material';

import { TokenListBox } from '@/shared/ui/token-list';

const FONT_FAMILY =
  'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const DIVIDER = '1px solid #EEF0F4';

export const ServicesStack = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  fontFamily: FONT_FAMILY,
  color: '#1B1F2A',
});

export const ServicesBox = styled(TokenListBox)({
  '& > * + *': { borderTop: DIVIDER },
});

export const UpdatedText = styled('span')({
  fontFamily: FONT_FAMILY,
  fontSize: 12.5,
  color: '#9AA0AD',
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
});

export const RefreshButton = styled(ButtonBase)({
  width: 28,
  height: 28,
  borderRadius: 8,
  color: '#6B7385',
  flexShrink: 0,
  transition: 'background-color .12s, color .12s',
  '&:hover': { backgroundColor: '#F1F3F8', color: '#1B1F2A' },
  '&.Mui-focusVisible': { outline: '2px solid #C7C9FF' },
});

const ROW_COLUMNS = 'minmax(0, 1fr) 96px 96px 96px 140px 16px';

export const ServiceRowButton = styled(ButtonBase)({
  display: 'grid',
  gridTemplateColumns: ROW_COLUMNS,
  columnGap: 12,
  alignItems: 'center',
  width: '100%',
  height: 48,
  boxSizing: 'border-box',
  padding: '0 12px 0 16px',
  fontFamily: FONT_FAMILY,
  color: 'inherit',
  textAlign: 'left',
  '&.Mui-focusVisible': {
    outline: '2px solid #C7C9FF',
    outlineOffset: -2,
  },
});

export const ServiceRowSkeletonRoot = styled('div')({
  display: 'grid',
  gridTemplateColumns: ROW_COLUMNS,
  columnGap: 12,
  alignItems: 'center',
  height: 48,
  boxSizing: 'border-box',
  padding: '0 12px 0 16px',
});

export const ServiceNameCell = styled('span')({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0,
  whiteSpace: 'nowrap',
});

export const ServiceDot = styled('span')({
  width: 6,
  height: 6,
  borderRadius: '50%',
  flexShrink: 0,
});

export const ServiceName = styled('span')({
  flexShrink: 0,
  fontSize: 13,
  fontWeight: 500,
  lineHeight: '20px',
});

export const ServiceHost = styled('span', {
  shouldForwardProp: prop => prop !== 'visible',
})<{ visible: boolean }>(({ visible }) => ({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontSize: 13,
  color: '#9AA0AD',
  opacity: visible ? 1 : 0,
  transition: 'opacity .15s',
}));

export const ServiceMetric = styled('span')({
  display: 'flex',
  alignItems: 'baseline',
  gap: 6,
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
});

export const ServiceMetricLabel = styled('span')({
  fontSize: 12,
  color: '#9AA0AD',
});

export const ServiceMetricValue = styled('span')({
  fontSize: 13,
  fontWeight: 600,
});

export const ServiceUptime = styled('span')({
  fontSize: 13,
  textAlign: 'right',
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
});

export const ServiceChevron = styled('span', {
  shouldForwardProp: prop => prop !== 'expanded',
})<{ expanded: boolean }>(({ expanded }) => ({
  display: 'flex',
  color: '#C3C8D2',
  transform: expanded ? 'rotate(180deg)' : 'none',
  transition: 'transform .15s',
}));

// Padding instead of margins: margins would escape the Collapse wrapper and
// make the animation jump at the end.
export const ServiceDetailsRoot = styled('div')({
  padding: '0 16px 18px',
});

export const ServiceDetailsGrid = styled('div')({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: '18px 24px',
  paddingTop: 16,
  borderTop: '1px solid #F3F4F7',
});

export const ServiceDetail = styled('div')({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  minWidth: 0,
});

export const ServiceDetailIcon = styled('span')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  flexShrink: 0,
  borderRadius: 10,
  backgroundColor: '#F5F6FA',
  color: '#6B7385',
});

// Two lines exactly as tall as the icon tile: 16 + 2 + 18 = 36.
export const ServiceDetailText = styled('span')({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  height: 36,
  minWidth: 0,
});

export const ServiceDetailLabel = styled('span')({
  fontSize: 12,
  lineHeight: '16px',
  color: '#9AA0AD',
  whiteSpace: 'nowrap',
});

export const ServiceDetailValue = styled('span')({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '-0.01em',
  lineHeight: '18px',
  color: '#1B1F2A',
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
});

export const ShowAllButton = styled(ButtonBase)({
  width: '100%',
  height: 40,
  fontFamily: FONT_FAMILY,
  fontSize: 13,
  fontWeight: 500,
  color: '#6B7385',
  transition: 'color .12s',
  '&:hover': { color: '#4343D6' },
  '&.Mui-focusVisible': { color: '#4343D6' },
});
