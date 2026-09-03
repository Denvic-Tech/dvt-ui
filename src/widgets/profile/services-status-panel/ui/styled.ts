import Box from '@mui/material/Box';
import { keyframes, styled } from '@mui/material/styles';

import { Alert, Badge, Button, Card, Panel, Progress } from '@/shared/ui';

import { MONO_FONT_FAMILY } from './lib/formatters.ts';
import type { MetricSeverity } from './lib/severity.ts';

export const pulseOpacity = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

const NAME_COL = 'minmax(180px, 1.4fr)';
const STATUS_COL = '110px';
const TASK_COL = '160px';
const METRICS_COL = 'minmax(0, 2.5fr)';
const CHEVRON_COL = '14px';
const COMPACT_ROW_MEDIA = '@media (max-width: 1280px)';

export const ROW_COLUMNS = `${NAME_COL} ${STATUS_COL} ${TASK_COL} ${METRICS_COL} ${CHEVRON_COL}`;

export const PanelCard = styled(Card)(() => ({
  width: '100%',
  borderRadius: 16,
  borderColor: '#e5e7eb',
  background: '#ffffff',
  boxShadow: 'none',
}));

export const PanelInner = styled('div')(() => ({
  display: 'grid',
  gap: 18,
  padding: 20,
}));

export const HeaderWrap = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
}));

export const HeaderContent = styled('div')(() => ({
  minWidth: 0,
}));

export const HeaderTitleRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
}));

export const HeaderTitle = styled('h2')(() => ({
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  lineHeight: 1.2,
  color: '#111827',
}));

export const HeaderDescription = styled('p')(() => ({
  margin: '6px 0 0',
  fontSize: 12,
  lineHeight: 1.5,
  color: '#6b7280',
}));

export const VersionBadge = styled(Badge)(() => ({
  gap: 4,
  minHeight: 18,
  padding: '2px 7px',
  borderRadius: 6,
  backgroundColor: '#eef2ff',
  border: '1px solid #c7d2fe',
  color: '#4f46e5',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 0,
  fontFamily: MONO_FONT_FAMILY,
  '& svg': {
    width: 10,
    height: 10,
  },
}));

export const HeaderActions = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 6,
  flexWrap: 'wrap',
  [theme.breakpoints.down('md')]: {
    justifyContent: 'flex-start',
  },
}));

export const AutoReloadActionButton = styled(Button, {
  shouldForwardProp: prop => prop !== 'active',
})<{ active?: boolean }>(({ active = false }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 32,
  padding: '6px 11px',
  borderRadius: 8,
  borderColor: active ? '#c7d2fe' : '#e5e7eb',
  backgroundColor: active ? '#eef2ff' : '#ffffff',
  color: active ? '#4f46e5' : '#6b7280',
  boxShadow: 'none',
  fontSize: 12,
  fontWeight: 500,
  '&:hover': {
    borderColor: active ? '#a5b4fc' : '#d1d5db',
    backgroundColor: active ? '#e0e7ff' : '#f9fafb',
    boxShadow: 'none',
  },
}));

export const AutoReloadDot = styled('span', {
  shouldForwardProp: prop => prop !== 'active',
})<{ active?: boolean }>(({ active = false }) => ({
  width: 6,
  height: 6,
  borderRadius: 999,
  backgroundColor: active ? '#4f46e5' : '#9ca3af',
  animation: active ? `${pulseOpacity} 2s ease-in-out infinite` : 'none',
}));

export const RefreshActionButton = styled(Button)(() => ({
  minHeight: 32,
  padding: '6px 11px',
  borderRadius: 8,
  borderColor: '#e5e7eb',
  backgroundColor: '#ffffff',
  color: '#6b7280',
  boxShadow: 'none',
  fontSize: 12,
  fontWeight: 500,
  '&:hover': {
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    color: '#111827',
    boxShadow: 'none',
  },
  '& .MuiButton-startIcon > *:nth-of-type(1)': {
    fontSize: 13,
  },
}));

export const SectionsStack = styled('div')(() => ({
  display: 'grid',
  gap: 18,
}));

export const SectionWrap = styled('section')(() => ({
  display: 'grid',
  gap: 8,
}));

export const SectionHeader = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 4,
}));

export const SectionIconWrap = styled('span')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6b7280',
  '& svg': {
    width: 14,
    height: 14,
  },
}));

export const SectionTitle = styled('h3')(() => ({
  margin: 0,
  fontSize: 13,
  fontWeight: 600,
  color: '#111827',
}));

export const SectionCount = styled(Badge)(() => ({
  minHeight: 18,
  padding: '1px 7px',
  borderRadius: 999,
  border: 'none',
  backgroundColor: '#f3f4f6',
  color: '#6b7280',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 0,
}));

export const SectionSummary = styled('div')(() => ({
  marginLeft: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  color: '#dc2626',
  fontSize: 10,
  fontWeight: 500,
  fontVariantNumeric: 'tabular-nums',
}));

export const SectionSummaryDot = styled('span')(() => ({
  width: 5,
  height: 5,
  borderRadius: 999,
  backgroundColor: '#dc2626',
}));

export const RowsStack = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}));

export const EmptyStatePanel = styled(Panel)(() => ({
  borderRadius: 10,
  borderStyle: 'dashed',
  borderColor: '#d1d5db',
  background: '#fafbfc',
  boxShadow: 'none',
  color: '#6b7280',
  fontSize: 13,
  lineHeight: 1.5,
  padding: 14,
}));

export const RowWrap = styled(Card, {
  shouldForwardProp: prop => prop !== 'offline',
})<{ offline?: boolean }>(({ offline = false }) => ({
  borderRadius: 10,
  borderColor: offline ? '#f3f4f6' : '#e5e7eb',
  background: '#ffffff',
  boxShadow: 'none',
  overflow: 'hidden',
}));

export const RowButton = styled('button', {
  shouldForwardProp: prop => prop !== 'offline',
})<{ offline?: boolean }>(({ offline = false, theme }) => ({
  width: '100%',
  display: 'grid',
  gridTemplateColumns: ROW_COLUMNS,
  gap: 12,
  alignItems: 'center',
  padding: '10px 14px',
  border: 'none',
  background: '#ffffff',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'inherit',
  color: 'inherit',
  '&:hover': {
    backgroundColor: offline ? '#ffffff' : '#fafbfc',
  },
  '&:focus-visible': {
    outline: '2px solid #c7d2fe',
    outlineOffset: '-2px',
  },
  [COMPACT_ROW_MEDIA]: {
    gridTemplateColumns: 'minmax(0, 1fr) auto 14px',
    gridTemplateAreas: `
      "name status chevron"
      "task task chevron"
      "metrics metrics metrics"
    `,
    columnGap: 10,
    rowGap: 8,
    alignItems: 'start',
    padding: '10px 12px',
  },
}));

export const NameSlot = styled('div')(({ theme }) => ({
  minWidth: 0,
  [COMPACT_ROW_MEDIA]: {
    gridArea: 'name',
  },
}));

export const NameText = styled('span', {
  shouldForwardProp: prop => prop !== 'offline',
})<{ offline?: boolean }>(({ offline = false }) => ({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 13,
  fontWeight: 600,
  color: offline ? '#9ca3af' : '#111827',
}));

export const StatusSlot = styled('div')(({ theme }) => ({
  [COMPACT_ROW_MEDIA]: {
    gridArea: 'status',
    justifySelf: 'start',
  },
}));

export const StatusBadgeRoot = styled(Badge, {
  shouldForwardProp: prop => prop !== 'variantState',
})<{ variantState: 'online' | 'offline' }>(({ variantState }) => ({
  justifyContent: 'flex-start',
  gap: 4,
  minHeight: 20,
  padding: '2px 8px',
  borderRadius: 999,
  border: 'none',
  letterSpacing: 0,
  fontSize: 10,
  fontWeight: 600,
  backgroundColor: variantState === 'online' ? '#d1fae5' : '#f3f4f6',
  color: variantState === 'online' ? '#059669' : '#6b7280',
  '& svg': {
    width: 10,
    height: 10,
  },
}));

export const OfflineDot = styled('span')(() => ({
  width: 6,
  height: 6,
  borderRadius: 999,
  backgroundColor: '#9ca3af',
}));

export const TaskSlot = styled('div')(({ theme }) => ({
  minWidth: 0,
  [COMPACT_ROW_MEDIA]: {
    gridArea: 'task',
  },
}));

export const TaskPillRoot = styled(Badge)(() => ({
  justifyContent: 'flex-start',
  gap: 5,
  minHeight: 20,
  padding: '2px 8px',
  borderRadius: 999,
  border: '1px solid #ddd6fe',
  backgroundColor: '#f5f3ff',
  color: '#7c3aed',
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: 0,
}));

export const TaskPulseDot = styled('span')(() => ({
  width: 5,
  height: 5,
  borderRadius: 999,
  backgroundColor: '#8b5cf6',
  animation: `${pulseOpacity} 1.5s ease-in-out infinite`,
}));

export const TaskRamValue = styled('span')(() => ({
  fontFamily: MONO_FONT_FAMILY,
  fontWeight: 600,
  color: '#5b21b6',
  fontVariantNumeric: 'tabular-nums',
}));

export const MainInfoSlot = styled('div')(({ theme }) => ({
  minWidth: 0,
  [COMPACT_ROW_MEDIA]: {
    gridArea: 'metrics',
  },
}));

export const MetricsGrid = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 12,
  minWidth: 0,
  [COMPACT_ROW_MEDIA]: {
    gridTemplateColumns: '1fr',
    gap: 6,
  },
}));

export const MetricWrap = styled('div')(({ theme }) => ({
  minWidth: 0,
  [COMPACT_ROW_MEDIA]: {
    display: 'grid',
    gap: 2,
  },
}));

export const MetricTopRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 6,
  marginBottom: 3,
  [COMPACT_ROW_MEDIA]: {
    marginBottom: 0,
  },
}));

export const MetricLabel = styled('span')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
  minWidth: 0,
  fontSize: 9,
  fontWeight: 600,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: 0.3,
  whiteSpace: 'nowrap',
  '& svg': {
    width: 9,
    height: 9,
  },
  [COMPACT_ROW_MEDIA]: {
    fontSize: 8,
  },
}));

export const MetricValue = styled('span', {
  shouldForwardProp: prop => prop !== 'severity',
})<{ severity: MetricSeverity }>(({ severity, theme }) => ({
  fontFamily: MONO_FONT_FAMILY,
  fontSize: 12,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
  color:
    severity === 'critical'
      ? '#dc2626'
      : severity === 'warning'
        ? '#b45309'
        : '#059669',
  [COMPACT_ROW_MEDIA]: {
    fontSize: 11,
  },
}));

export const MetricProgress = styled(Progress, {
  shouldForwardProp: prop => prop !== 'severity',
})<{ severity: MetricSeverity }>(({ severity, theme }) => ({
  height: 3,
  borderRadius: 2,
  backgroundColor: '#f3f4f6',
  marginBottom: 2,
  '& .MuiLinearProgress-bar': {
    borderRadius: 2,
    backgroundColor:
      severity === 'critical'
        ? '#ef4444'
        : severity === 'warning'
          ? '#f59e0b'
          : '#10b981',
  },
  [COMPACT_ROW_MEDIA]: {
    marginBottom: 0,
  },
}));

export const MetricSub = styled('div')(({ theme }) => ({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 9,
  color: '#9ca3af',
  fontFamily: MONO_FONT_FAMILY,
  fontVariantNumeric: 'tabular-nums',
  [COMPACT_ROW_MEDIA]: {
    display: 'none',
  },
}));

export const OfflineInfoRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
  color: '#9ca3af',
  fontSize: 11,
  [COMPACT_ROW_MEDIA]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
}));

export const OfflineInfoMain = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  minWidth: 0,
  '& svg': {
    width: 11,
    height: 11,
    flexShrink: 0,
  },
  [COMPACT_ROW_MEDIA]: {
    flexWrap: 'wrap',
  },
}));

export const OfflineInfoTime = styled('span')(() => ({
  fontFamily: MONO_FONT_FAMILY,
  fontWeight: 600,
  color: '#6b7280',
  fontVariantNumeric: 'tabular-nums',
}));

export const OfflineInfoSince = styled('span')(({ theme }) => ({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontFamily: MONO_FONT_FAMILY,
  fontSize: 10,
  color: '#d1d5db',
  fontVariantNumeric: 'tabular-nums',
  [COMPACT_ROW_MEDIA]: {
    whiteSpace: 'normal',
    overflow: 'visible',
    textOverflow: 'clip',
  },
}));

export const OfflineInfoFallback = styled('span')(() => ({
  fontSize: 11,
  color: '#9ca3af',
  fontStyle: 'italic',
}));

export const ChevronSlot = styled('span')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#9ca3af',
  '& svg': {
    width: 14,
    height: 14,
    strokeWidth: 2,
  },
  [COMPACT_ROW_MEDIA]: {
    gridArea: 'chevron',
    alignSelf: 'start',
    justifySelf: 'end',
  },
}));

export const ExpandedOnline = styled('div')(() => ({
  padding: '12px 14px 14px',
  borderTop: '1px solid #f3f4f6',
  backgroundColor: '#ffffff',
}));

export const ExpandedOffline = styled('div')(() => ({
  padding: '12px 14px 14px',
  borderTop: '1px solid #f3f4f6',
  backgroundColor: '#ffffff',
}));

export const DetailsGrid = styled('div')(() => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 10,
}));

export const DetailFieldWrap = styled('div')(() => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  minWidth: 0,
}));

export const DetailIconWrap = styled('span')(() => ({
  width: 26,
  height: 26,
  flexShrink: 0,
  borderRadius: 6,
  backgroundColor: '#f3f4f6',
  color: '#6b7280',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& svg': {
    width: 11,
    height: 11,
  },
}));

export const DetailBody = styled('div')(() => ({
  minWidth: 0,
}));

export const DetailLabel = styled('div')(() => ({
  fontSize: 9,
  fontWeight: 600,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: 0.3,
}));

export const DetailValue = styled('div', {
  shouldForwardProp: prop => prop !== 'mono',
})<{ mono?: boolean }>(({ mono = false }) => ({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 11,
  fontWeight: 500,
  color: '#374151',
  ...(mono
    ? {
        fontFamily: MONO_FONT_FAMILY,
        fontVariantNumeric: 'tabular-nums',
      }
    : null),
}));

export const OfflineAlert = styled(Alert)(() => ({
  alignItems: 'center',
  marginBottom: 12,
  borderRadius: 8,
  borderColor: '#fecaca',
  backgroundColor: '#fef2f2',
  color: '#991b1b',
  '& .MuiAlert-icon': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#991b1b',
    marginRight: 10,
    padding: 0,
    marginTop: 0,
    alignSelf: 'center',
  },
  '& .MuiAlert-message': {
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
}));

export const LoadingState = styled(Box)(() => ({
  display: 'grid',
  placeItems: 'center',
  gap: 8,
  padding: '24px 0 8px',
  color: '#6b7280',
  fontSize: 13,
}));
