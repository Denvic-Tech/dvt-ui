import { Box, styled, Switch, Typography } from '@mui/material';

import { getDataTypeTone } from './dataTypeTone';

const monoFont =
  'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const paletteVars = {
  backgroundPaper: 'var(--mui-palette-background-paper)',
  divider: 'var(--mui-palette-divider)',
  textPrimary: 'var(--mui-palette-text-primary)',
  textPrimarySoft: 'rgba(var(--mui-palette-text-primaryChannel) / 0.78)',
  textSecondary: 'var(--mui-palette-text-secondary)',
  textSecondaryStrong: 'rgba(var(--mui-palette-text-secondaryChannel) / 0.88)',
  textSecondarySoft: 'rgba(var(--mui-palette-text-secondaryChannel) / 0.72)',
  textSecondaryMuted: 'rgba(var(--mui-palette-text-secondaryChannel) / 0.56)',
  textSecondaryFaint: 'rgba(var(--mui-palette-text-secondaryChannel) / 0.44)',
  surfaceInset: 'rgba(var(--mui-palette-text-secondaryChannel) / 0.08)',
  surfaceMuted: 'rgba(var(--mui-palette-text-secondaryChannel) / 0.06)',
  surfaceHover: 'rgba(var(--mui-palette-text-secondaryChannel) / 0.04)',
  textPrimaryShadowSoft: 'rgba(var(--mui-palette-text-primaryChannel) / 0.08)',
  textPrimaryShadowElevated:
    'rgba(var(--mui-palette-text-primaryChannel) / 0.14)',
  commonWhite: 'var(--mui-palette-common-white)',
};

export const SchemaCard = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
  background: 'transparent',
  border: 'none',
  borderRadius: 0,
  padding: 0,
});

export const SchemaHeader = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  marginBottom: 14,
});

export const SchemaHeaderIcon = styled('div')({
  width: 28,
  height: 28,
  borderRadius: 7,
  background: paletteVars.surfaceInset,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

export const SchemaHeaderTitleRow = styled('div')({
  display: 'flex',
  alignItems: 'baseline',
  gap: 6,
  flexWrap: 'wrap',
});

export const SchemaHeaderTitle = styled(Typography)({
  fontSize: 13.5,
  fontWeight: 700,
  color: paletteVars.textPrimary,
});

export const SchemaHeaderHint = styled(Typography)({
  fontSize: 12,
  color: paletteVars.textSecondary,
});

export const SegmentControl = styled('div')({
  display: 'inline-flex',
  alignSelf: 'flex-start',
  flex: '0 0 auto',
  width: 'fit-content',
  maxWidth: '100%',
  gap: 2,
  padding: 3,
  borderRadius: 9,
  background: paletteVars.surfaceInset,
  border: `1px solid ${paletteVars.divider}`,
  marginBottom: 16,
});

export const SegmentButton = styled('button', {
  shouldForwardProp: prop => prop !== 'active',
})<{ active: boolean }>(({ active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 14px',
  borderRadius: 7,
  border: 'none',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  background: active ? paletteVars.backgroundPaper : 'transparent',
  color: active ? '#4f46e5' : paletteVars.textSecondary,
  boxShadow: active ? `0 1px 3px ${paletteVars.textPrimaryShadowSoft}` : 'none',
  transition: 'all 150ms ease',
}));

export const FieldBlock = styled('div')({
  marginBottom: 16,
});

export const FieldLabel = styled(Typography)({
  fontSize: 12.5,
  fontWeight: 600,
  color: paletteVars.textSecondary,
  marginBottom: 2,
});

export const SelectShell = styled('div')({
  position: 'relative',
});

export const SelectElement = styled('select')({
  width: '100%',
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  padding: '9px 34px 9px 11px',
  borderRadius: 10,
  background: paletteVars.surfaceInset,
  border: `1px solid ${paletteVars.divider}`,
  color: paletteVars.textPrimary,
  fontSize: 13,
  fontFamily: monoFont,
  outline: 'none',
  transition: 'all 150ms ease',
  cursor: 'pointer',
  '&:focus': {
    borderColor: '#c7d2fe',
    boxShadow: '0 0 0 3px rgba(99,102,241,0.08)',
  },
  "&[aria-invalid='true']": {
    borderColor: '#ef4444',
    background: '#fef2f2',
    color: '#b91c1c',
  },
  "&[aria-invalid='true']:focus": {
    borderColor: '#dc2626',
    boxShadow: '0 0 0 3px rgba(239,68,68,0.12)',
  },
});

export const SelectChevron = styled('div')({
  position: 'absolute',
  right: 11,
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: paletteVars.textSecondary,
});

export const SectionTitleRow = styled('div')({
  display: 'flex',
  alignItems: 'baseline',
  gap: 4,
  flexWrap: 'wrap',
  marginBottom: 2,
});

export const SectionTitle = styled(Typography)({
  fontSize: 13,
  fontWeight: 600,
  color: paletteVars.textPrimary,
});

export const SectionHint = styled(Typography)({
  fontSize: 11,
  color: paletteVars.textSecondaryMuted,
});

export const ToolbarRow = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
  margin: '8px 0',
});

export const SearchField = styled('div')({
  position: 'relative',
  flex: '0 1 200px',
  minWidth: 180,
});

export const SearchIconWrap = styled('div')({
  position: 'absolute',
  left: 9,
  top: '50%',
  transform: 'translateY(-50%)',
  color: paletteVars.textSecondaryMuted,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
});

export const SearchInput = styled('input')({
  width: '100%',
  boxSizing: 'border-box',
  padding: '5px 9px 5px 30px',
  borderRadius: 8,
  background: paletteVars.surfaceInset,
  border: `1px solid ${paletteVars.divider}`,
  outline: 'none',
  fontSize: 12,
  color: paletteVars.textPrimary,
  transition: 'all 150ms ease',
  '&::placeholder': {
    color: paletteVars.textSecondaryMuted,
  },
  '&:focus': {
    borderColor: '#c7d2fe',
    boxShadow: '0 0 0 3px rgba(99,102,241,0.08)',
  },
});

export const CountLabel = styled(Typography)({
  fontSize: 11.5,
  fontWeight: 600,
  color: paletteVars.textSecondaryMuted,
});

export const ToolbarSpacer = styled('div')({
  flex: 1,
});

export const OutlineButton = styled('button')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 10px',
  borderRadius: 8,
  border: `1px solid ${paletteVars.divider}`,
  background: paletteVars.backgroundPaper,
  color: paletteVars.textSecondary,
  fontSize: 11.5,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  fontFamily: 'inherit',
  '&:hover': {
    background: paletteVars.surfaceInset,
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});

export const TintButton = styled('button')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 10px',
  borderRadius: 8,
  border: 'none',
  background: '#eef2ff',
  color: '#4f46e5',
  fontSize: 11.5,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  fontFamily: 'inherit',
  '&:hover': {
    background: '#e0e7ff',
  },
});

export const MappingSummaryCard = styled('div')({
  border: `1px solid ${paletteVars.divider}`,
  borderRadius: 16,
  background: paletteVars.backgroundPaper,
  overflow: 'hidden',
});

export const MappingSummaryEmpty = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 18,
  padding: '10px 16px',
});

export const MappingSummaryEmptyLeft = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  minWidth: 0,
});

export const MappingSummaryEmptyIcon = styled('div')({
  width: 42,
  height: 42,
  borderRadius: 12,
  background: '#eef2ff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6366f1',
  flexShrink: 0,
});

export const MappingSummaryEmptyTitle = styled(Typography)({
  fontSize: 13,
  fontWeight: 700,
  color: paletteVars.textPrimary,
  marginBottom: 2,
});

export const MappingSummaryEmptyText = styled(Typography)({
  fontSize: 12,
  lineHeight: 1.45,
  color: paletteVars.textSecondary,
});

export const MappingSummaryAction = styled('button')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '9px 18px',
  borderRadius: 12,
  border: 'none',
  background: '#6366f1',
  color: paletteVars.commonWhite,
  fontSize: 12.5,
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
  transition: 'all 150ms ease',
  '&:hover': {
    background: '#5458ee',
  },
});

export const MappingSummaryStats = styled('div')({
  display: 'grid',
  gridTemplateColumns: '140px 140px 1fr',
  gap: 0,
  borderBottom: `1px solid ${paletteVars.divider}`,
  background: paletteVars.backgroundPaper,
  '@media (max-width: 720px)': {
    gridTemplateColumns: '1fr 1fr',
  },
});

export const MappingSummaryStat = styled('div')({
  position: 'relative',
  padding: '14px 16px 12px',
  '&:first-of-type': {
    paddingRight: 20,
  },
  '&:nth-of-type(2)': {
    paddingLeft: 2,
  },
  '&:first-of-type::after': {
    content: '""',
    position: 'absolute',
    top: 20,
    bottom: 20,
    right: 20,
    width: 1,
    background: paletteVars.divider,
  },
});

export const MappingSummaryStatValue = styled(Typography)({
  fontSize: 22,
  lineHeight: 1,
  fontWeight: 700,
  color: paletteVars.textPrimary,
  marginBottom: 4,
});

export const MappingSummaryStatValueAccent = styled(MappingSummaryStatValue)({
  color: '#6366f1',
});

export const MappingSummaryStatLabel = styled(Typography)({
  fontSize: 11.5,
  fontWeight: 600,
  color: paletteVars.textSecondaryMuted,
  textTransform: 'lowercase',
});

export const MappingSummaryTopAction = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: 16,
  background: paletteVars.backgroundPaper,
});

export const MappingChangesHeader = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '7px 16px',
  borderBottom: `1px solid ${paletteVars.divider}`,
  background: paletteVars.surfaceMuted,
});

export const MappingChangesTitle = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
});

export const MappingChangesTitleText = styled(Typography)({
  fontSize: 11.5,
  fontWeight: 600,
  color: paletteVars.textSecondaryMuted,
  letterSpacing: 0.35,
});

export const MappingChangesCountBadge = styled('span')({
  minWidth: 18,
  height: 18,
  paddingInline: 6,
  borderRadius: 999,
  background: '#e8e8ff',
  color: '#6366f1',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 10,
  fontWeight: 700,
});

export const MappingChangesHint = styled(Typography)({
  fontSize: 11,
  color: paletteVars.textSecondaryFaint,
});

export const MappingChangesList = styled('div')({});

export const MappingChangeItem = styled('button')({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '8px 16px',
  border: 'none',
  borderBottom: `1px solid ${paletteVars.divider}`,
  background: paletteVars.backgroundPaper,
  textAlign: 'left',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 150ms ease',
  '&:last-child': {
    borderBottom: 'none',
  },
  '&:hover': {
    background: paletteVars.surfaceHover,
  },
});

export const MappingChangePrimary = styled('div')({
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flexWrap: 'wrap',
});

export const MappingChangeName = styled(Typography)({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 12.5,
  fontWeight: 600,
  color: paletteVars.textPrimary,
  fontFamily: monoFont,
});

export const MappingChangeOldName = styled(MappingChangeName)({
  color: paletteVars.textSecondaryMuted,
});

export const MappingChangeArrow = styled(Typography)({
  fontSize: 12,
  fontWeight: 700,
  color: '#6366f1',
  fontFamily: monoFont,
});

export const MappingChangeNewName = styled(MappingChangeName)({
  color: '#6366f1',
});

export const MappingChangeSecondary = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexShrink: 0,
});

export const MappingChangeMeta = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 8px',
  borderRadius: 999,
  background: '#eef2ff',
  color: '#6366f1',
  fontSize: 10.5,
  fontWeight: 700,
  fontFamily: monoFont,
});

export const MappingChangeMore = styled('button')({
  width: '100%',
  padding: '11px 16px',
  border: 'none',
  borderTop: `1px solid ${paletteVars.divider}`,
  background: paletteVars.backgroundPaper,
  color: '#6366f1',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
});

export const MAPPING_TABLE_COLUMNS =
  'minmax(0,1.15fr) minmax(0,1.2fr) minmax(0,1.05fr) minmax(112px,0.8fr) 74px minmax(112px,0.8fr)';

export const MappingTableContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  width: '100%',
  border: `1px solid ${paletteVars.divider}`,
  borderRadius: 10,
  overflow: 'hidden',
});

export const MappingTableHead = styled('div')({
  display: 'grid',
  gridTemplateColumns: MAPPING_TABLE_COLUMNS,
  gap: 8,
  padding: '7px 10px',
  alignItems: 'center',
  background: paletteVars.surfaceInset,
  borderBottom: `1px solid ${paletteVars.divider}`,
  fontSize: 9.5,
  fontWeight: 700,
  color: paletteVars.textSecondary,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  '& > :nth-of-type(5)': {
    textAlign: 'center',
    transform: 'translateX(-10px)',
  },
  '& > :nth-of-type(6)': {
    transform: 'translateX(-6px)',
  },
});

export const MappingTableBody = styled('div')({
  flex: 1,
  width: '100%',
  minHeight: 0,
  overflow: 'hidden',
});

export const MappingRow = styled('div', {
  shouldForwardProp: prop =>
    prop !== 'checked' && prop !== 'last' && prop !== 'highlighted',
})<{ checked: boolean; last: boolean; highlighted?: boolean }>(
  ({ checked, last, highlighted = false }) => ({
    display: 'grid',
    position: 'relative',
    gridTemplateColumns: MAPPING_TABLE_COLUMNS,
    gap: 8,
    padding: '6px 10px',
    alignItems: 'center',
    borderBottom: last ? 'none' : `1px solid ${paletteVars.divider}`,
    background: highlighted
      ? '#eef2ff'
      : checked
        ? paletteVars.backgroundPaper
        : paletteVars.surfaceHover,
    transition: 'background-color 150ms ease',
    '&::before': highlighted
      ? {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: '#6366f1',
        }
      : undefined,
  })
);

export const SourceMeta = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  minWidth: 0,
});

export const SourceName = styled(Typography)({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 12.5,
  fontWeight: 600,
  fontFamily: monoFont,
  color: paletteVars.textPrimarySoft,
});

export const EffectiveColumnValue = styled('div', {
  shouldForwardProp: prop => prop !== 'loading' && prop !== 'flashing',
})<{ loading?: boolean; flashing?: boolean }>(({ loading, flashing }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  minWidth: 0,
  padding: '1px 4px 1px 8px',
  borderRadius: 5,
  color: loading ? '#6366f1' : paletteVars.textSecondaryStrong,
  animation: flashing ? 'schemaEffectiveValueFlash 950ms ease-out' : 'none',
  '@keyframes schemaEffectiveValueFlash': {
    '0%': {
      background: 'rgba(99,102,241,0.12)',
      boxShadow: '0 0 0 0 rgba(99,102,241,0.12)',
    },
    '100%': {
      background: 'rgba(99,102,241,0)',
      boxShadow: '0 0 0 7px rgba(99,102,241,0)',
    },
  },
}));

export const EffectiveColumnIcon = styled('span', {
  shouldForwardProp: prop => prop !== 'loading' && prop !== 'flashing',
})<{ loading?: boolean; flashing?: boolean }>(({ loading, flashing }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  color: loading || flashing ? '#6366f1' : paletteVars.textSecondaryMuted,
  transition: 'color 30ms linear',
}));

export const EffectiveColumnName = styled('span')({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 12.5,
  fontWeight: 600,
  fontFamily: monoFont,
  color: paletteVars.textPrimarySoft,
});

export const EffectiveColumnSkeleton = styled('span')({
  display: 'block',
  height: 13,
  maxWidth: '100%',
  borderRadius: 5,
  background: 'linear-gradient(100deg, #ecedf2 30%, #fafbff 50%, #ecedf2 70%)',
  backgroundSize: '220% 100%',
  animation: 'schemaEffectiveShimmer 1.25s ease-in-out infinite',
  '@keyframes schemaEffectiveShimmer': {
    '0%': {
      backgroundPosition: '120% 0',
    },
    '100%': {
      backgroundPosition: '-120% 0',
    },
  },
});

export const DtypeBadge = styled('span', {
  shouldForwardProp: prop => prop !== 'dtype',
})<{ dtype: string }>(({ dtype }) => {
  const tone = getDataTypeTone(dtype);
  return {
    display: 'inline-flex',
    padding: '2px 7px',
    borderRadius: 5,
    background: tone.background,
    color: tone.color,
    fontSize: 10,
    fontWeight: 700,
    fontFamily: monoFont,
    letterSpacing: 0.2,
    flexShrink: 0,
  };
});

export const ArrowCell = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: paletteVars.textSecondaryMuted,
});

export const TargetInput = styled('input')({
  width: '100%',
  boxSizing: 'border-box',
  padding: '6px 8px',
  borderRadius: 7,
  fontFamily: monoFont,
  fontSize: 12.5,
  fontWeight: 500,
  color: paletteVars.textPrimary,
  background: paletteVars.commonWhite,
  border: `1px solid ${paletteVars.divider}`,
  outline: 'none',
  '&:focus': {
    borderColor: '#c7d2fe',
    boxShadow: '0 0 0 3px rgba(99,102,241,0.08)',
  },
});

export const ChangedTargetInput = styled(TargetInput)({
  borderColor: '#8b90ff',
  background: '#eef0ff',
  color: '#6366f1',
});

export const CellSelectShell = styled('div')({
  position: 'relative',
  minWidth: 0,
});

export const CellSelect = styled('select')({
  width: '100%',
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  minWidth: 0,
  padding: '6px 28px 6px 8px',
  borderRadius: 7,
  background: paletteVars.commonWhite,
  border: `1px solid ${paletteVars.divider}`,
  cursor: 'pointer',
  fontFamily: monoFont,
  fontSize: 12,
  color: paletteVars.textPrimary,
  outline: 'none',
  '&:focus': {
    borderColor: '#c7d2fe',
    boxShadow: '0 0 0 3px rgba(99,102,241,0.08)',
  },
});

export const ChangedCellSelect = styled(CellSelect)({
  borderColor: '#8b90ff',
  background: '#eef0ff',
  color: '#6366f1',
});

export const CellSelectChevron = styled('div')({
  position: 'absolute',
  right: 8,
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  color: paletteVars.textSecondary,
  display: 'flex',
  alignItems: 'center',
});

export const NullSwitchCell = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 34,
  transform: 'translateX(2px)',
});

export const ChangedNullSwitchCell = styled(NullSwitchCell)({});

export const SchemaRoleCell = styled('div')({
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flexWrap: 'wrap',
  transform: 'translateX(8px)',
});

export const SchemaRolePlaceholder = styled(Typography)({
  fontSize: 11.5,
  fontWeight: 600,
  color: paletteVars.textSecondaryFaint,
});

export const SchemaRoleBadge = styled('span', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: 'primary' | 'success' | 'warning' | 'neutral' }>(({ tone }) => {
  const toneMap = {
    primary: {
      background: '#e7efff',
      color: '#3155d1',
    },
    success: {
      background: '#e8f7ec',
      color: '#2f8f4e',
    },
    warning: {
      background: '#fff3d8',
      color: '#9a6400',
    },
    neutral: {
      background: paletteVars.surfaceInset,
      color: paletteVars.textSecondaryStrong,
    },
  } as const;

  return {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 20,
    padding: '2px 7px',
    borderRadius: 5,
    background: toneMap[tone].background,
    color: toneMap[tone].color,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    fontFamily: monoFont,
  };
});

export const NullableSwitch = styled(Switch)({
  width: 34,
  height: 20,
  padding: 0,
  display: 'flex',
  '& .MuiSwitch-switchBase': {
    padding: 2,
    transitionDuration: '150ms',
    '&.Mui-checked': {
      transform: 'translateX(14px)',
      color: paletteVars.commonWhite,
      '& + .MuiSwitch-track': {
        backgroundColor: '#6366f1',
        opacity: 1,
        borderColor: '#6366f1',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    width: 16,
    height: 16,
    boxShadow: 'none',
  },
  '& .MuiSwitch-track': {
    borderRadius: 10,
    backgroundColor: paletteVars.divider,
    opacity: 1,
    border: `1px solid ${paletteVars.divider}`,
    transition: 'all 150ms ease',
  },
});

export const ChangedNullableSwitch = styled(NullableSwitch)({
  '& .MuiSwitch-switchBase': {
    '&.Mui-checked': {
      '& + .MuiSwitch-track': {
        backgroundColor: '#f59e0b',
        borderColor: '#f59e0b',
      },
    },
  },
  '& .MuiSwitch-track': {
    backgroundColor: '#ffe4b8',
    borderColor: '#ffd08a',
  },
});

export const MappingNote = styled('div')({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 6,
  marginTop: 7,
  fontSize: 11,
  color: paletteVars.textSecondaryMuted,
});

export const ErrorList = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginBottom: 14,
});

export const MultiFieldBlock = styled('div')({
  marginBottom: 12,
});

export const WarningBanner = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  padding: '10px 12px',
  borderRadius: 9,
  background: '#fef3c7',
  marginBottom: 16,
  fontSize: 12,
  color: '#92400e',
});

export const PreviewHeader = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 8,
});

export const PreviewTitle = styled(Typography)({
  fontSize: 13,
  fontWeight: 600,
  color: paletteVars.textSecondary,
});

export const TextActionRow = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
});

export const TextActionButton = styled('button', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone?: 'primary' | 'muted' }>(({ tone = 'muted' }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: 0,
  border: 'none',
  background: 'transparent',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 1,
  color: tone === 'primary' ? '#6366f1' : paletteVars.textSecondary,
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 150ms ease',
  '& svg': {
    display: 'block',
    flexShrink: 0,
  },
  '&:disabled': {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
}));

export const DDLPreviewBox = styled('div')({
  padding: '12px 14px',
  borderRadius: 9,
  background: '#f0f4ff',
  border: '1px solid #c7d2fe',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12.5,
  color: '#4f46e5',
});

export const PreviewCode = styled('pre')({
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  fontSize: 12,
  lineHeight: 1.6,
  fontFamily: monoFont,
  color: paletteVars.textPrimarySoft,
});

export const SqlTextArea = styled('textarea')({
  width: '100%',
  minHeight: 360,
  boxSizing: 'border-box',
  padding: '12px 14px',
  borderRadius: 10,
  background: paletteVars.surfaceInset,
  border: `1px solid ${paletteVars.divider}`,
  outline: 'none',
  resize: 'vertical',
  fontFamily: monoFont,
  fontSize: 12.5,
  color: paletteVars.textPrimary,
  lineHeight: 1.6,
  '&:focus': {
    borderColor: '#c7d2fe',
    boxShadow: '0 0 0 3px rgba(99,102,241,0.08)',
  },
});

export const InlineInfoText = styled(Typography)({
  fontSize: 12,
  color: paletteVars.textSecondary,
});

export const BulkMenuContainer = styled('div')({
  width: 280,
  background: paletteVars.backgroundPaper,
  border: `1px solid ${paletteVars.divider}`,
  borderRadius: 10,
  boxShadow: `0 10px 28px ${paletteVars.textPrimaryShadowElevated}`,
  overflow: 'hidden',
  padding: 4,
});

export const BulkMenuSectionTitle = styled(Typography)({
  padding: '6px 10px 4px',
  fontSize: 9.5,
  fontWeight: 700,
  color: paletteVars.textSecondaryMuted,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
});

export const BulkMenuItem = styled('button')({
  width: '100%',
  textAlign: 'left',
  padding: '7px 10px',
  border: 'none',
  borderRadius: 7,
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 150ms ease',
  '&:hover': {
    background: paletteVars.surfaceInset,
  },
  '&:disabled': {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
});

export const BulkMenuItemTitle = styled(Typography)({
  fontSize: 12.5,
  fontWeight: 600,
  color: paletteVars.textPrimary,
});

export const BulkMenuItemHint = styled(Typography)({
  marginTop: 2,
  fontSize: 11,
  color: paletteVars.textSecondaryMuted,
});

export const BulkMenuDivider = styled('div')({
  height: 1,
  background: paletteVars.divider,
  margin: '4px 0',
});

export const DialogContentShell = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  width: '100%',
  height: '100%',
  minHeight: 0,
  paddingTop: 4,
});

export const MappingModalHeader = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 18,
  paddingRight: 0,
});

export const MappingModalHeaderLeft = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  minWidth: 0,
});

export const MappingModalHeaderIcon = styled('div')({
  width: 42,
  height: 42,
  borderRadius: 12,
  background: '#eef2ff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6366f1',
  flexShrink: 0,
});

export const MappingModalTitleGroup = styled('div')({
  minWidth: 0,
});

export const MappingModalTitle = styled(Typography)({
  fontSize: 15,
  fontWeight: 700,
  color: paletteVars.textPrimary,
  lineHeight: 1.2,
});

export const MappingModalSubtitle = styled(Typography)({
  fontSize: 12,
  color: paletteVars.textSecondaryMuted,
  marginTop: 2,
});

export const MappingModalStats = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 28,
  flexShrink: 0,
});

export const MappingModalStat = styled('div')({
  textAlign: 'right',
});

export const MappingModalStatValue = styled(Typography)({
  fontSize: 18,
  fontWeight: 700,
  color: paletteVars.textPrimary,
  lineHeight: 1.1,
});

export const MappingModalStatLabel = styled(Typography)({
  fontSize: 10.5,
  fontWeight: 700,
  color: paletteVars.textSecondaryFaint,
  textTransform: 'uppercase',
  marginTop: 3,
});

export const AdvancedPanel = styled('div')({
  marginTop: 16,
  borderTop: `1px solid ${paletteVars.divider}`,
  paddingTop: 16,
});

export const AdvancedToggle = styled('button')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: 0,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  color: paletteVars.textSecondary,
  fontFamily: 'inherit',
});
