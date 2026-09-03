import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const shouldForwardStateProp = (prop: PropertyKey) =>
  ![
    'isActive',
    'isChecked',
    'isDropTarget',
    'isLast',
    'isProject',
    'isRunning',
    'isSelected',
    'statusColor',
    'statusColorHover',
  ].includes(String(prop));

export const ProjectsPageShell = styled(Box)(() => ({
  maxWidth: 1180,
  margin: '0 auto',
  width: '100%',
  height: '100%',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
}));

export const ProjectsPageRoot = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#ffffff',
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  flex: 1,
  minHeight: 0,
}));

export const ToolbarContainer = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 20px',
  borderBottom: '1px solid #f3f4f6',
  backgroundColor: '#ffffff',
  flexWrap: 'wrap',
}));

export const ToolbarSearchWrap = styled('div')(() => ({
  position: 'relative',
  flex: 1,
  minWidth: 220,
  maxWidth: 380,
}));

export const ToolbarSearchInput = styled('input')(() => ({
  width: '100%',
  padding: '9px 12px 9px 36px',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'all 150ms ease',
  '&:focus': {
    borderColor: '#d1d5db',
    boxShadow: 'none',
  },
  '&::placeholder': {
    color: '#9ca3af',
  },
}));

export const ToolbarSearchIcon = styled('span')(() => ({
  position: 'absolute',
  left: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#9ca3af',
  pointerEvents: 'none',
  display: 'flex',
}));

export const ToolbarDivider = styled('span')(() => ({
  width: 1,
  height: 24,
  backgroundColor: '#e5e7eb',
  flexShrink: 0,
  marginLeft: 'auto',
}));

export const ToolbarDropdownBtn = styled('button', {
  shouldForwardProp: shouldForwardStateProp,
})<{ isActive?: boolean }>(({ isActive }) => ({
  padding: '8px 12px',
  backgroundColor: isActive ? '#eef2ff' : '#ffffff',
  border: isActive ? '1px solid #c7d2fe' : '1px solid #e5e7eb',
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 500,
  color: isActive ? '#6366f1' : '#374151',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'inherit',
  transition: 'all 150ms ease',
  whiteSpace: 'nowrap',
  '&:hover': {
    backgroundColor: isActive ? '#eef2ff' : '#f9fafb',
  },
}));

export const ToolbarGhostBtn = styled('button')(() => ({
  padding: '8px 14px',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'inherit',
  transition: 'all 150ms ease',
  whiteSpace: 'nowrap',
  '&:hover': {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
  },
  '&:disabled': {
    cursor: 'not-allowed',
  },
}));

export const ToolbarPrimaryBtn = styled('button')(() => ({
  padding: '8px 16px',
  backgroundColor: '#6366f1',
  border: 'none',
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 600,
  color: '#ffffff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'inherit',
  transition: 'background-color 150ms ease',
  whiteSpace: 'nowrap',
  '&:hover': {
    backgroundColor: '#4f46e5',
  },
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.6,
  },
}));

export const ActionGate = styled('div', {
  shouldForwardProp: prop => prop !== 'disabled',
})<{ disabled?: boolean }>(({ disabled }) => ({
  display: 'inline-flex',
  ...(disabled && {
    cursor: 'not-allowed',
    '& > *': {
      opacity: 0.5,
      pointerEvents: 'none',
    },
  }),
}));

export const OrgBar = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 14px',
  background: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
  borderRadius: '16px 16px 0 0',
  '@media (max-width: 900px)': {
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
}));

export const OrgBarLabel = styled('span')(() => ({
  flexShrink: 0,
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: 0.7,
  color: '#94a3b8',
  textTransform: 'uppercase',
  '@media (max-width: 900px)': {
    width: '100%',
  },
}));

export const OrgBarControls = styled('div')(() => ({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}));

export const PillRow = styled('div')(() => ({
  position: 'relative',
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  overflow: 'hidden',
}));

export const MeasureLayer = styled('div')(() => ({
  position: 'absolute',
  left: -9999,
  top: -9999,
  visibility: 'hidden',
  pointerEvents: 'none',
  display: 'flex',
  gap: 8,
}));

export const OrgPill = styled('button', {
  shouldForwardProp: prop =>
    !['active', 'orgColor', 'inactiveColor'].includes(String(prop)),
})<{ active?: boolean; orgColor: string; inactiveColor: string }>(
  ({ active, orgColor }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    minWidth: 0,
    padding: '5px 10px 5px 6px',
    borderRadius: 10,
    background: active ? '#ffffff' : 'transparent',
    border: `1.5px solid ${active ? orgColor : 'transparent'}`,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    fontFamily: 'inherit',
    '&:hover': {
      background: active ? '#ffffff' : '#f1f5f9',
      borderColor: active ? orgColor : 'transparent',
    },
  })
);

export const OrgLogo = styled('div', {
  shouldForwardProp: prop =>
    !['active', 'orgColor', 'inactiveColor', 'size'].includes(String(prop)),
})<{
  active?: boolean;
  orgColor: string;
  inactiveColor?: string;
  size?: number;
}>(({ active = true, orgColor, inactiveColor, size = 24 }) => ({
  width: active ? size : Math.max(size - 6, 16),
  height: active ? size : Math.max(size - 6, 16),
  flexShrink: 0,
  borderRadius: 6,
  background: active ? orgColor : 'transparent',
  border: `1.5px solid ${active ? orgColor : (inactiveColor ?? orgColor)}`,
  color: active ? '#ffffff' : (inactiveColor ?? orgColor),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: Math.round(size * 0.42),
  fontWeight: 700,
  letterSpacing: 0.2,
}));

export const OrgPillName = styled('span', {
  shouldForwardProp: prop =>
    !['active', 'inactiveColor'].includes(String(prop)),
})<{ active?: boolean; inactiveColor?: string }>(({ active }) => ({
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  color: active ? '#1e293b' : '#85919f',
}));

export const CountBadge = styled('span', {
  shouldForwardProp: prop =>
    !['active', 'inactiveColor', 'orgColor', 'activeBgColor'].includes(
      String(prop)
    ),
})<{
  active?: boolean;
  inactiveColor?: string;
  orgColor?: string;
  activeBgColor?: string;
}>(({ active = true, orgColor, activeBgColor }) => ({
  fontSize: active ? 11 : 10,
  fontWeight: 700,
  padding: active ? '1px 7px' : '1px 6px',
  borderRadius: 6,
  background: active ? (activeBgColor ?? '#f1f5f9') : '#e3eaf1',
  color: active ? (orgColor ?? '#94a3b8') : '#85919f',
  whiteSpace: 'nowrap',
}));

export const AllOrgsButton = styled('button', {
  shouldForwardProp: prop => prop !== 'open',
})<{ open?: boolean }>(({ open }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flexShrink: 0,
  padding: '7px 11px',
  borderRadius: 10,
  fontSize: 12.5,
  fontWeight: 600,
  cursor: 'pointer',
  color: open ? '#6366f1' : '#64748b',
  background: open ? '#eef2ff' : '#ffffff',
  border: `1.5px solid ${open ? '#c7d2fe' : '#e2e8f0'}`,
  transition: 'all 150ms ease',
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
}));

export const OrgPopoverWrap = styled('div')(() => ({
  position: 'relative',
  flexShrink: 0,
}));

export const OrgPopover = styled('div')(() => ({
  position: 'absolute',
  top: 'calc(100% + 8px)',
  right: 0,
  zIndex: 50,
  width: 300,
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  boxShadow: '0 14px 36px rgba(15,23,42,0.14)',
  overflow: 'hidden',
}));

export const OrgPopoverSearch = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  margin: 10,
  padding: '7px 10px',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  color: '#94a3b8',
}));

export const OrgPopoverSearchInput = styled('input')(() => ({
  width: '100%',
  minWidth: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: 13,
  fontFamily: 'inherit',
  color: '#1e293b',
  '&::placeholder': {
    color: '#94a3b8',
  },
}));

export const OrgPopoverList = styled('div')(() => ({
  maxHeight: 280,
  overflowY: 'auto',
  padding: 6,
  borderTop: '1px solid #e2e8f0',
}));

export const OrgPopoverRow = styled('button', {
  shouldForwardProp: prop => !['active', 'orgColor'].includes(String(prop)),
})<{ active?: boolean; orgColor: string }>(({ active, orgColor }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  padding: '8px 10px',
  border: 'none',
  borderRadius: 8,
  background: active ? '#f8fafc' : 'transparent',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background 150ms ease',
  fontFamily: 'inherit',
  '&:hover': {
    background: '#f8fafc',
  },
  ...(active
    ? {
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 6,
          bottom: 6,
          width: 3,
          borderRadius: 999,
          background: orgColor,
        },
      }
    : {}),
}));

export const OrgPopoverRowText = styled('div')(() => ({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}));

export const OrgPopoverRowName = styled('div')(() => ({
  fontSize: 13,
  fontWeight: 600,
  color: '#1e293b',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const OrgPopoverRowMeta = styled('div')(() => ({
  fontSize: 11,
  fontWeight: 500,
  color: '#94a3b8',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const OrgPopoverEmpty = styled('div')(() => ({
  padding: '18px 14px',
  textAlign: 'center',
  fontSize: 13,
  color: '#94a3b8',
}));

export const ContentHeader = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px 8px',
  gap: 12,
  flexWrap: 'wrap',
}));

export const BreadcrumbNav = styled('nav')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 13,
  flexWrap: 'wrap',
}));

export const BreadcrumbButton = styled('button', {
  shouldForwardProp: shouldForwardStateProp,
})<{ isLast: boolean }>(({ isLast }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  backgroundColor: isLast ? '#eef2ff' : 'transparent',
  color: isLast ? '#6366f1' : '#6b7280',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: isLast ? 600 : 500,
  fontSize: 13,
  fontFamily: 'inherit',
  transition: 'background-color 100ms ease',
  '&:hover': isLast
    ? {}
    : {
        backgroundColor: '#f3f4f6',
        color: '#374151',
      },
}));

export const BreadcrumbSeparator = styled('span')(() => ({
  color: '#d1d5db',
  userSelect: 'none',
  fontSize: 13,
}));

export const ContentCounter = styled('span')(() => ({
  fontSize: 12,
  color: '#9ca3af',
  flexShrink: 0,
}));

export const ContentBody = styled('div')(() => ({
  padding: '0 20px 16px',
  minHeight: 0,
  overflowY: 'auto',
  flex: 1,
}));

export const SectionHeaderRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px 4px 8px',
  fontSize: 11,
  fontWeight: 700,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
}));

export const SectionCount = styled('span')(() => ({
  padding: '1px 6px',
  backgroundColor: '#f3f4f6',
  color: '#6b7280',
  fontSize: 10,
  fontWeight: 600,
  borderRadius: 6,
}));

export const RowsList = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  marginBottom: 8,
}));

export const FolderCard = styled('div', {
  shouldForwardProp: shouldForwardStateProp,
})<{ isDropTarget?: boolean; isSelected?: boolean }>(
  ({ isDropTarget, isSelected }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 10px',
    backgroundColor: isDropTarget
      ? '#eef2ff'
      : isSelected
        ? 'rgba(238, 242, 255, 0.45)'
        : '#ffffff',
    border: isDropTarget
      ? '1.5px dashed #6366f1'
      : isSelected
        ? '1px solid #c7d2fe'
        : '1px solid #f3f4f6',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'all 100ms ease',
    '&:hover': isDropTarget
      ? {}
      : {
          backgroundColor: '#f9fafb',
          borderColor: '#e5e7eb',
        },
  })
);

export const ProjectCard = styled('div', {
  shouldForwardProp: shouldForwardStateProp,
})<{ isSelected?: boolean }>(({ isSelected }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '8px 10px',
  backgroundColor: isSelected ? 'rgba(238, 242, 255, 0.45)' : '#ffffff',
  border: isSelected ? '1px solid #c7d2fe' : '1px solid #f3f4f6',
  borderRadius: 12,
  cursor: 'grab',
  transition: 'all 100ms ease',
  '&:hover': {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  '&:active': {
    cursor: 'grabbing',
  },
}));

export const FolderIconBox = styled('span')(() => ({
  width: 36,
  height: 36,
  backgroundColor: '#fef3c7',
  color: '#d97706',
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}));

export const ProjectIconBox = styled('span')(() => ({
  width: 36,
  height: 36,
  backgroundColor: '#eef2ff',
  color: '#6366f1',
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  fontSize: 15,
  fontWeight: 700,
  lineHeight: 1,
  textTransform: 'uppercase',
}));

export const ItemContent = styled('div')(() => ({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  minHeight: 36,
}));

export const ItemTitle = styled('button', {
  shouldForwardProp: shouldForwardStateProp,
})<{ isProject?: boolean }>(({ isProject }) => ({
  display: 'block',
  width: 'fit-content',
  maxWidth: '100%',
  padding: 0,
  background: 'transparent',
  border: 'none',
  fontSize: 14,
  fontWeight: isProject ? 500 : 600,
  color: isProject ? '#6366f1' : '#111827',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'left',
  '&:hover': isProject
    ? {
        color: '#4f46e5',
        textDecoration: 'underline',
      }
    : {},
}));

export const ItemMeta = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 0,
  fontSize: 11,
  color: '#9ca3af',
  lineHeight: 1.35,
  minWidth: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  '& > span': {
    display: 'block',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '& > span[data-meta="author"]': {
    flexShrink: 1,
    fontWeight: 500,
    color: '#6b7280',
  },
  '& > span[data-meta="separator"]': {
    flexShrink: 0,
    margin: '0 6px',
  },
}));

export const FolderChildCount = styled('span')(() => ({
  fontSize: 11,
  color: '#9ca3af',
  fontWeight: 500,
  flexShrink: 0,
}));

export const RowActionButton = styled('button')(() => ({
  width: 28,
  height: 28,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 6,
  color: '#9ca3af',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
}));

export const RunCircleSm = styled('button', {
  shouldForwardProp: shouldForwardStateProp,
})<{
  statusColor: string;
  statusColorHover: string;
  isRunning?: boolean;
}>(({ statusColor, statusColorHover, isRunning }) => ({
  width: 22,
  height: 22,
  borderRadius: '50%',
  backgroundColor: statusColor,
  border: 'none',
  color: '#ffffff',
  fontSize: 10,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'all 150ms ease',
  position: 'relative',
  fontFamily: 'inherit',
  padding: 0,
  animation: isRunning ? 'projectsPulse 1.5s ease-in-out infinite' : 'none',
  '&:hover': {
    backgroundColor: statusColorHover,
  },
  '@keyframes projectsPulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.6 },
  },
}));

export const RunCirclesRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flexShrink: 0,
  minWidth: 'max-content',
}));

export const RunCirclePlaceholder = styled('span')(() => ({
  width: 22,
  height: 22,
  borderRadius: '50%',
  backgroundColor: '#e5e7eb',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#dbe1e8',
  },
}));

export const NoRunsHint = styled('span')(() => ({
  fontSize: 11,
  color: '#9ca3af',
  fontStyle: 'italic',
  flexShrink: 0,
}));

export const PaginationContainer = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '14px 20px',
  borderTop: '1px solid #f3f4f6',
  backgroundColor: '#fafbfc',
  flexWrap: 'wrap',
}));

export const PaginationLeft = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
}));

export const PageSizeWrap = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}));

export const PageSizeControl = styled('div')(() => ({
  position: 'relative',
  display: 'inline-flex',
}));

export const PageSizeLabel = styled('span')(() => ({
  fontSize: 12,
  color: '#6b7280',
}));

export const PageSizeButton = styled('button')(() => ({
  padding: '6px 10px',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  color: '#111827',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'inherit',
  minWidth: 60,
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
  },
}));

export const PageSizePopup = styled('div')(() => ({
  position: 'absolute',
  bottom: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  marginBottom: 4,
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
  zIndex: 30,
  padding: 4,
  overflow: 'hidden',
  minWidth: 80,
}));

export const PageSizeOption = styled('button', {
  shouldForwardProp: shouldForwardStateProp,
})<{ isActive: boolean }>(({ isActive }) => ({
  width: '100%',
  padding: '8px 12px',
  backgroundColor: isActive ? '#eef2ff' : 'transparent',
  border: 'none',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 500,
  color: isActive ? '#6366f1' : '#111827',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'inherit',
  '&:hover': isActive ? {} : { backgroundColor: '#f9fafb' },
}));

export const PaginationDivider = styled('span')(() => ({
  width: 1,
  height: 16,
  backgroundColor: '#e5e7eb',
}));

export const PaginationSummary = styled('span')(() => ({
  fontSize: 12,
  color: '#6b7280',
  '& > b': {
    color: '#111827',
    fontWeight: 600,
  },
}));

export const PageNavWrap = styled('nav')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
}));

export const PageNavIconBtn = styled('button')(() => ({
  width: 32,
  height: 32,
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  color: '#6b7280',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 150ms ease',
  fontFamily: 'inherit',
  '&:hover:not(:disabled)': {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
  },
  '&:disabled': {
    color: '#d1d5db',
    cursor: 'not-allowed',
  },
}));

export const PageNumberBtn = styled('button', {
  shouldForwardProp: shouldForwardStateProp,
})<{ isActive: boolean }>(({ isActive }) => ({
  minWidth: 32,
  height: 32,
  padding: '0 8px',
  backgroundColor: isActive ? '#6366f1' : '#ffffff',
  border: isActive ? '1px solid #6366f1' : '1px solid #e5e7eb',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: isActive ? 700 : 500,
  color: isActive ? '#ffffff' : '#374151',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 100ms ease',
  '&:hover': isActive
    ? {}
    : {
        backgroundColor: '#f9fafb',
        borderColor: '#d1d5db',
      },
}));

export const PageEllipsis = styled('span')(() => ({
  padding: '0 4px',
  color: '#9ca3af',
  fontSize: 13,
  userSelect: 'none',
}));

export const EmptyStateContainer = styled('div')(() => ({
  padding: '64px 16px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
}));

export const EmptyStateIcon = styled('div')(() => ({
  width: 56,
  height: 56,
  backgroundColor: '#f3f4f6',
  color: '#9ca3af',
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const EmptyStateText = styled('div')(() => ({
  fontSize: 14,
  color: '#6b7280',
  fontWeight: 500,
}));

export const Checkbox = styled('button', {
  shouldForwardProp: shouldForwardStateProp,
})<{ isChecked?: boolean }>(({ isChecked }) => ({
  width: 20,
  height: 20,
  padding: 0,
  borderRadius: 6,
  border: '2px solid',
  borderColor: isChecked ? '#6366f1' : '#d1d5db',
  backgroundColor: isChecked ? '#6366f1' : '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'all 150ms ease',
  fontFamily: 'inherit',
  '&:hover': {
    borderColor: isChecked ? '#4f46e5' : '#a5b4fc',
  },
  '& svg': {
    width: 12,
    height: 12,
    color: '#ffffff',
  },
}));

export const FloatingBar = styled(Box)(() => ({
  position: 'fixed',
  bottom: 24,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1000,
  padding: 8,
  backgroundColor: '#111827',
  borderRadius: 16,
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
}));

export const FloatingBarCount = styled(Box)(() => ({
  padding: '8px 16px',
  fontSize: 14,
  fontWeight: 500,
  color: '#ffffff',
  borderRight: '1px solid #374151',
}));

export const FloatingBarButton = styled('button')(() => ({
  padding: '8px 16px',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 500,
  color: '#d1d5db',
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#1f2937',
    color: '#ffffff',
  },
  '& svg': {
    width: 16,
    height: 16,
  },
}));

export const FloatingBarDeleteButton = styled(FloatingBarButton)(() => ({
  color: '#f87171',
  '&:hover': {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#fca5a5',
  },
}));

export const FloatingBarCloseButton = styled('button')(() => ({
  padding: 8,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 12,
  cursor: 'pointer',
  color: '#6b7280',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 150ms ease',
  marginLeft: 4,
  fontFamily: 'inherit',
  '&:hover': {
    backgroundColor: '#1f2937',
    color: '#ffffff',
  },
  '& svg': {
    width: 20,
    height: 20,
  },
}));
