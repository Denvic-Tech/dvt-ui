import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

import { TokenListRowTile } from '@/shared/ui/token-list';

// Name, INN, status, created, menu.
export const ORGANIZATION_ROW_COLUMNS = 'minmax(0, 1fr) 130px 140px 150px 28px';

export const AlertSection = styled(Box)({
  paddingBottom: 16,
});

// Bluish for an active organization, grey for an inactive one.
export const OrganizationTile = styled(TokenListRowTile, {
  shouldForwardProp: prop => prop !== 'inactive',
})<{ inactive: boolean }>(({ inactive }) => ({
  backgroundColor: inactive ? '#F1F3F8' : '#EEF0FF',
  color: inactive ? '#9AA0AD' : '#5B5BEF',
}));

// The name and, after it in the same line, the description.
export const OrganizationNameLine = styled('div')({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'baseline',
  gap: 8,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
});

export const OrganizationName = styled('span', {
  shouldForwardProp: prop => prop !== 'inactive',
})<{ inactive: boolean }>(({ inactive }) => ({
  flex: 'none',
  maxWidth: '60%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  color: inactive ? '#6B7385' : '#1B1F2A',
  fontFamily:
    'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: 13,
  fontWeight: 500,
}));

export const OrganizationDescription = styled('span')({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  color: '#9AA0AD',
  fontSize: 13,
});

export const OrganizationInn = styled('span')({
  minWidth: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  color: '#4A5161',
  fontSize: 13,
  fontVariantNumeric: 'tabular-nums',
});

export const OrganizationInnLabel = styled('span')({
  marginRight: 6,
  color: '#9AA0AD',
});

export const OrganizationInnEmpty = styled('span')({
  color: '#C3C8D2',
});

export const OrganizationStatus = styled('span', {
  shouldForwardProp: prop => prop !== 'active',
})<{ active: boolean }>(({ active }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  whiteSpace: 'nowrap',
  color: active ? '#4A5161' : '#9AA0AD',
  fontSize: 13,
}));

export const OrganizationStatusDot = styled('span', {
  shouldForwardProp: prop => prop !== 'active',
})<{ active: boolean }>(({ active }) => ({
  width: 6,
  height: 6,
  flex: 'none',
  borderRadius: '50%',
  backgroundColor: active ? '#2BB673' : '#C3C8D2',
}));

export const OrganizationDate = styled('span')({
  whiteSpace: 'nowrap',
  color: '#6B7385',
  fontSize: 13,
  fontVariantNumeric: 'tabular-nums',
});
