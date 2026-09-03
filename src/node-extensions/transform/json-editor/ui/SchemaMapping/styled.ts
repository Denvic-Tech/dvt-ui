import { Box, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import { MONO_FONT_FAMILY } from './helpers';

export const MappingSurface = styled('section')(() => ({
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  backgroundColor: '#ffffff',
  overflow: 'hidden',
  minHeight: 'clamp(560px, 68vh, 760px)',
}));

export const MappingHeader = styled('div')(() => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  padding: 16,
  borderBottom: '1px solid #f3f4f6',
}));

export const HeaderCopy = styled('div')(() => ({
  minWidth: 0,
  flex: 1,
}));

export const HeaderTitle = styled(Typography)(() => ({
  fontSize: 15,
  fontWeight: 600,
  color: '#111827',
}));

export const HeaderDescription = styled(Typography)(() => ({
  marginTop: 4,
  fontSize: 12,
  color: '#6b7280',
}));

export const LayoutToggleWrap = styled('div')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: 4,
  backgroundColor: '#f8fafc',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  flexShrink: 0,
}));

export const HeaderActions = styled('div')(() => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-end',
  gap: 8,
  flexShrink: 0,
  flexWrap: 'wrap',
}));

export const LayoutGrid = styled('div')<{ layout: 'split' | 'tree' }>(
  ({ layout }) => ({
    display: 'grid',
    gridTemplateColumns:
      layout === 'split' ? 'minmax(0, 1fr) 340px' : 'minmax(0, 1fr)',
    flex: 1,
    minHeight: 0,
    '@media (max-width: 1100px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  })
);

export const TreeColumn = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: 16,
  minHeight: 0,
  minWidth: 0,
}));

export const TreeSection = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  flex: 1,
  minHeight: 0,
}));

export const TreeToolbarWrap = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: 8,
  border: '1px solid #f3f4f6',
  borderRadius: 10,
  backgroundColor: '#fafbfc',
}));

export const ToolbarDivider = styled('div')(() => ({
  width: 1,
  height: 18,
  backgroundColor: '#e5e7eb',
  flexShrink: 0,
}));

export const FilterChipsWrap = styled('div')(() => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 4,
  padding: 8,
  border: '1px solid #f3f4f6',
  borderRadius: 10,
  backgroundColor: '#fafbfc',
}));

export const FilterChipsLabel = styled('span')(() => ({
  padding: '4px 4px 4px 2px',
  alignSelf: 'center',
  color: '#6b7280',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 0.3,
  textTransform: 'uppercase',
}));

export const TreeScroll = styled('div')(() => ({
  border: '1px solid #f3f4f6',
  borderRadius: 10,
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  flex: 1,
  minHeight: 360,
  overflowY: 'auto',
  minWidth: 0,
}));

export const TreeEmptyState = styled('div')(() => ({
  padding: 30,
  textAlign: 'center',
  color: '#9ca3af',
  fontSize: 13,
}));

export const NodeRow = styled('div')<{ highlighted?: boolean }>(
  ({ highlighted = false }) => ({
    display: 'flex',
    alignItems: 'stretch',
    borderBottom: '1px solid #f3f4f6',
    backgroundColor: highlighted ? '#fef9c3' : '#ffffff',
    transition: 'background-color 500ms ease',
    '&:hover': {
      backgroundColor: highlighted ? '#fef9c3' : '#fafbfc',
    },
    '&:last-child': {
      borderBottom: 'none',
    },
  })
);

export const LeftRail = styled('div')<{ railColor?: string }>(
  ({ railColor = 'transparent' }) => ({
    width: 3,
    flexShrink: 0,
    backgroundColor: railColor,
    transition: 'background-color 150ms ease',
  })
);

export const RowBody = styled('div')<{ depth: number }>(({ depth }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flex: 1,
  minWidth: 0,
  padding: '8px 10px',
  paddingLeft: 10 + Math.min(depth, 6) * 14,
}));

export const ChevronSlot = styled('div')<{ interactive: boolean }>(
  ({ interactive }) => ({
    width: 14,
    height: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9ca3af',
    flexShrink: 0,
    cursor: interactive ? 'pointer' : 'default',
    '& svg': {
      width: 12,
      height: 12,
    },
  })
);

export const PathPrimary = styled('div')(() => ({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}));

export const PathHeader = styled('div')(() => ({
  display: 'flex',
  alignItems: 'baseline',
  gap: 6,
  flexWrap: 'wrap',
  minWidth: 0,
}));

export const PathSegmentText = styled('span')(() => ({
  fontFamily: MONO_FONT_FAMILY,
  fontSize: 13,
  fontWeight: 600,
  color: '#111827',
}));

export const KindText = styled('span')(() => ({
  fontFamily: MONO_FONT_FAMILY,
  fontSize: 10,
  color: '#9ca3af',
}));

export const PathFullText = styled('div')(() => ({
  fontFamily: MONO_FONT_FAMILY,
  fontSize: 10,
  color: '#9ca3af',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
}));

export const ActionGroupsWrap = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
}));

export const ActionGroup = styled('div')<{ withDivider?: boolean }>(
  ({ withDivider = false }) => ({
    display: 'flex',
    gap: 3,
    ...(withDivider
      ? {
          paddingRight: 7,
          marginRight: 4,
          borderRight: '1px solid #e5e7eb',
        }
      : {
          paddingLeft: 4,
        }),
  })
);

export const SelectedWrap = styled('div')(() => ({
  padding: 12,
  border: '1px solid #f3f4f6',
  borderRadius: 10,
  backgroundColor: '#fafbfc',
}));

export const SelectedHeader = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  marginBottom: 8,
}));

export const SelectedLabel = styled('span')(() => ({
  color: '#6b7280',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 0.3,
  textTransform: 'uppercase',
}));

export const SelectedChipsRow = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}));

export const ChipIconBox = styled('span')<{ color: string }>(({ color }) => ({
  width: 22,
  height: 22,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: color,
  color: '#ffffff',
  flexShrink: 0,
  '& svg': {
    width: 11,
    height: 11,
  },
}));

export const ChipText = styled('div')(() => ({
  fontFamily: MONO_FONT_FAMILY,
  fontSize: 11,
  fontWeight: 600,
  color: '#374151',
}));

export const ChipExtraCount = styled('span')(() => ({
  padding: '1px 5px',
  borderRadius: 4,
  backgroundColor: 'rgba(0,0,0,0.08)',
  fontSize: 9,
  fontWeight: 700,
}));

export const SelectedItem = styled('button')<{
  borderColor: string;
  backgroundColor: string;
}>(({ borderColor, backgroundColor }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '7px 8px',
  borderRadius: 8,
  border: `1px solid ${borderColor}`,
  backgroundColor,
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'transform 150ms ease, background-color 150ms ease',
  '&:hover': {
    transform: 'translateY(-1px)',
  },
}));

export const SelectedItemContent = styled('div')(() => ({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
}));

export const SelectedItemPath = styled('div')(() => ({
  marginTop: 2,
  fontFamily: MONO_FONT_FAMILY,
  fontSize: 10,
  color: '#9ca3af',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const MappingPanelWrap = styled('aside')(() => ({
  width: 340,
  minWidth: 340,
  padding: 16,
  borderLeft: '1px solid #f3f4f6',
  backgroundColor: '#fafbfc',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  height: '100%',
  minHeight: 0,
  overflow: 'hidden',
  '@media (max-width: 1100px)': {
    width: '100%',
    minWidth: 0,
    borderLeft: 'none',
    borderTop: '1px solid #f3f4f6',
  },
}));

export const MappingPanelHeader = styled('div')(() => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
}));

export const MappingHeaderCopy = styled('div')(() => ({
  minWidth: 0,
}));

export const MappingTitle = styled(Typography)(() => ({
  fontSize: 13,
  fontWeight: 600,
  color: '#111827',
}));

export const MappingDescription = styled(Typography)(() => ({
  marginTop: 4,
  color: '#9ca3af',
  fontSize: 11,
}));

export const MappingList = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  flex: 1,
  height: 0,
  minHeight: 0,
  overflow: 'hidden',
  overflowX: 'hidden',
}));

export const MappingGroupCard = styled('div')<{
  borderColor: string;
  hasItems?: boolean;
  open?: boolean;
}>(({ borderColor, hasItems = false, open = false }) => ({
  display: 'flex',
  flexDirection: 'column',
  border: `1px solid ${borderColor}`,
  borderRadius: 10,
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  minHeight: 0,
  ...(hasItems && open
    ? {
        flex: '1 1 0',
        minBlockSize: 104,
      }
    : {
        flex: '0 0 auto',
      }),
}));

export const MappingGroupHeader = styled('div')<{
  backgroundColor: string;
  borderColor: string;
  hasItems: boolean;
}>(({ backgroundColor, borderColor, hasItems }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  padding: '8px 12px',
  backgroundColor,
  borderBottom: hasItems ? `1px solid ${borderColor}` : 'none',
  minHeight: 40,
  flexShrink: 0,
}));

export const MappingGroupHeaderMain = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
  flex: 1,
}));

export const MappingGroupHeaderActions = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flexShrink: 0,
}));

export const ActionIconTile = styled('div')<{ color: string }>(({ color }) => ({
  width: 22,
  height: 22,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  backgroundColor: color,
  color: '#ffffff',
  '& svg': {
    width: 11,
    height: 11,
  },
}));

export const MappingFieldName = styled('span')<{ color: string }>(
  ({ color }) => ({
    fontFamily: MONO_FONT_FAMILY,
    fontSize: 12,
    fontWeight: 600,
    color,
  })
);

export const CountPill = styled('span')<{ color: string }>(({ color }) => ({
  minWidth: 18,
  padding: '2px 7px',
  borderRadius: 999,
  textAlign: 'center',
  fontSize: 10,
  fontWeight: 700,
  color: '#ffffff',
  backgroundColor: color,
}));

export const MappingGroupBody = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 0',
  gap: 4,
  padding: 8,
  height: 0,
  minHeight: 0,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
}));

export const PathListItem = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  gap: 6,
  padding: '5px 8px',
  minHeight: 42,
  borderRadius: 6,
  backgroundColor: '#fafbfc',
  transition: 'background-color 150ms ease',
  '&:hover': {
    backgroundColor: '#f3f4f6',
  },
}));

export const PathListButtonContent = styled('div')(() => ({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
}));

export const PathListSegment = styled('div')(() => ({
  fontFamily: MONO_FONT_FAMILY,
  fontSize: 11,
  fontWeight: 600,
  color: '#374151',
}));

export const PathListPath = styled('div')(() => ({
  fontFamily: MONO_FONT_FAMILY,
  fontSize: 10,
  color: '#9ca3af',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const TreeBranch = styled(Stack)(() => ({
  gap: 0,
}));

export const LinkButton = styled(Box)(() => ({
  display: 'inline-flex',
}));

export const HelpDialogBody = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}));

export const HelpLead = styled(Typography)(() => ({
  fontSize: 13,
  lineHeight: 1.6,
  color: '#374151',
}));

export const HelpSection = styled('section')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}));

export const HelpSectionTitle = styled(Typography)(() => ({
  fontSize: 13,
  fontWeight: 600,
  color: '#111827',
}));

export const HelpBulletList = styled('ul')(() => ({
  margin: 0,
  paddingLeft: 20,
  display: 'grid',
  gap: 6,
  listStyleType: 'disc',
  listStylePosition: 'outside',
  color: '#4b5563',
  fontSize: 13,
  lineHeight: 1.55,
  '& li::marker': {
    color: '#6b7280',
  },
}));

export const HelpActionList = styled('div')(() => ({
  display: 'grid',
  gap: 8,
}));

export const HelpActionCard = styled('div')(() => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: 10,
  border: '1px solid #f3f4f6',
  borderRadius: 10,
  backgroundColor: '#fafbfc',
}));

export const HelpActionPreview = styled('div')<{ color: string }>(
  ({ color }) => ({
    width: 30,
    height: 30,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: color,
    color: '#ffffff',
    '& svg': {
      width: 13,
      height: 13,
    },
  })
);

export const HelpActionCopy = styled('div')(() => ({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}));

export const HelpActionTitle = styled(Typography)(() => ({
  fontSize: 12,
  fontWeight: 600,
  color: '#111827',
}));

export const HelpActionDescription = styled(Typography)(() => ({
  fontSize: 12,
  lineHeight: 1.55,
  color: '#6b7280',
}));
