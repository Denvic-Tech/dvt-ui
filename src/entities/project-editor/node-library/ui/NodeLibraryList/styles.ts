import { Chip } from '@mui/material';
import { styled } from '@mui/material/styles';

export const NodeListContainer = styled('div')(() => ({
  padding: '0 8px 12px',
}));

export const CategoryGroup = styled('div')(() => ({
  marginBottom: 1,
}));

const categoryHeaderBaseStyles = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  padding: '10px 12px 4px',
} as const;

export const CategoryHeader = styled('button')(() => ({
  ...categoryHeaderBaseStyles,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  textAlign: 'left',
  color: '#6b7280',
}));

export const CategoryHeaderStatic = styled('div')(() => ({
  ...categoryHeaderBaseStyles,
  color: '#6b7280',
}));

export const CategoryHeaderMain = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  minWidth: 0,
  marginLeft: -6,
}));

export const CategoryChevron = styled('div')(() => ({
  width: 20,
  height: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6b7280',
  flexShrink: 0,
  opacity: 0.62,
  transition: 'transform 150ms ease',

  '& svg': {
    width: 20,
    height: 20,
  },
}));

export const CategoryMarker = styled('span')(() => ({
  width: 5,
  height: 5,
  borderRadius: 2,
  backgroundColor: 'var(--node-library-category-color, currentColor)',
  flexShrink: 0,
  marginRight: 3,
  opacity: 0.54,
}));

export const CategoryTitle = styled('span')(() => ({
  fontSize: 11,
  fontWeight: 650,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#6b7280',
  opacity: 0.82,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

export const CategoryCount = styled('span')(() => ({
  minWidth: 24,
  height: 20,
  padding: '0 7px',
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 11,
  fontWeight: 700,
  lineHeight: 1,
  backgroundColor: 'rgba(107, 114, 128, 0.09)',
  color: '#6b7280',
  flexShrink: 0,
  opacity: 0.52,
}));

export const NodeItem = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '8px 12px',
  borderRadius: 10,
  cursor: 'grab',
  userSelect: 'none',
  transition: 'all 150ms ease',
  position: 'relative',

  '&:hover': {
    backgroundColor: '#f3f4f6',
  },

  '&:active': {
    cursor: 'grabbing',
    transform: 'scale(0.98)',
    backgroundColor: '#f3f4f6',
  },

  '&[data-draggable="false"]': {
    cursor: 'default',
  },

  '&[data-draggable="false"][data-selectable="true"]': {
    cursor: 'pointer',
  },

  '&[data-deprecated="true"]': {
    opacity: 0.54,
  },
}));

export const NodeItemRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}));

export const NodeMain = styled('div')(() => ({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}));

export const NodeTitleRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
}));

export const NodeLibraryIcon = styled('div')(() => ({
  width: 26,
  height: 26,
  borderRadius: 8,
  backgroundColor: '#f3f4f6',
  color: '#9ca3af',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}));

export const NodeLibraryIconAccent = styled('span')(() => ({
  width: 8,
  height: 8,
  borderRadius: 2,
  backgroundColor: 'currentColor',
  display: 'block',
  flexShrink: 0,
}));

export const NodeIcon = styled('div')(() => ({
  width: 26,
  height: 26,
  borderRadius: 6,
  backgroundColor: '#f3f4f6',
  color: '#9ca3af',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  fontSize: 12,
  lineHeight: 1,

  '& svg': {
    width: 16,
    height: 16,
  },

  '&[data-deprecated="true"]': {
    opacity: 0.4,
  },
}));

export const NodeName = styled('span')(() => ({
  flex: 1,
  minWidth: 0,
  fontSize: 13,
  fontWeight: 500,
  color: '#111827',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  transition: 'color 150ms ease',

  [`${NodeItem}:hover &`]: {
    color: '#111827',
  },

  '&[data-deprecated="true"]': {
    textDecoration: 'line-through',
    textDecorationThickness: '1px',
    opacity: 0.46,
  },
}));

export const NodeActionSlot = styled('div')(() => ({
  minWidth: 22,
  minHeight: 22,
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  flexShrink: 0,
}));

export const PinnedNodeCategory = styled('span')(() => ({
  maxWidth: 112,
  fontSize: 11,
  fontWeight: 500,
  lineHeight: 1.2,
  color: '#111827',
  opacity: 0.34,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  textAlign: 'right',
}));

export const NodeAction = styled('button')(() => ({
  width: 22,
  height: 22,
  minWidth: 22,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: 999,
  background: 'transparent',
  color: '#111827',
  transition:
    'opacity 150ms ease, color 150ms ease, background-color 150ms ease',
  cursor: 'pointer',
  padding: 0,
  position: 'relative',
  zIndex: 1,

  '&[data-active="true"]': {
    opacity: 0.58,
  },

  '&:hover': {
    backgroundColor: 'rgba(209, 164, 63, 0.12)',
    color: '#d1a43f',
  },

  '& svg': {
    width: 17,
    height: 17,
  },
}));

export const TagsRow = styled('div')(() => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
}));

export const DeprecatedBadge = styled('span')(() => ({
  height: 18,
  padding: '0 6px',
  borderRadius: 6,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  backgroundColor: '#fef3c7',
  color: '#b45309',
  border: '1px solid #fde68a',
}));

export const TagChip = styled(Chip)(() => ({
  height: 20,
  fontSize: 10,
  borderRadius: 10,
  backgroundColor: '#f9fafb',
  color: '#6b7280',
  border: '1px solid #f3f4f6',

  '& .MuiChip-label': {
    padding: '0 6px',
  },
}));

export const EmptyState = styled('div')(() => ({
  padding: '24px 16px',
  textAlign: 'center',
  color: '#9ca3af',
  fontSize: 13,
}));
