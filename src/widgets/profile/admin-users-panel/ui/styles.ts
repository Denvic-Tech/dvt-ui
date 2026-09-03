import {
  Box,
  Dialog,
  FormControl,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, styled } from '@mui/material/styles';

type StatusBadgeVariant = 'verified' | 'unverified' | 'active' | 'blocked';
type RoleBadgeVariant = 'superadmin' | 'admin' | 'user' | 'unknown';
type ActionButtonVariant = 'default' | 'danger' | 'success';

export const PanelContainer = styled(Box)(() => ({
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  overflow: 'hidden',
}));

export const PanelHeader = styled(Box)(() => ({
  padding: '20px 24px',
  borderBottom: '1px solid #f3f4f6',
}));

export const HeaderTop = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 4,
  '@media (max-width: 900px)': {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
}));

export const HeaderCopy = styled(Box)(() => ({
  minWidth: 0,
}));

export const HeaderTitle = styled(Typography)(() => ({
  fontSize: 20,
  lineHeight: 1.2,
  fontWeight: 600,
  color: '#111827',
  marginBottom: 4,
}));

export const HeaderDescription = styled(Typography)(() => ({
  fontSize: 14,
  lineHeight: 1.5,
  color: '#6b7280',
}));

export const HeaderActions = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexShrink: 0,
  '@media (max-width: 900px)': {
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
}));

const headerButtonBase = {
  padding: '10px 16px',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.2,
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  whiteSpace: 'nowrap' as const,
  '& svg': {
    width: 18,
    height: 18,
    fontSize: 18,
  },
};

export const RefreshButton = styled('button')(() => ({
  ...headerButtonBase,
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  color: '#4b5563',
  '&:hover': {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
  },
}));

export const NewUserButton = styled('button')(() => ({
  ...headerButtonBase,
  backgroundColor: '#6366f1',
  border: 'none',
  color: '#ffffff',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  '&:hover': {
    backgroundColor: '#4f46e5',
  },
}));

export const SearchSection = styled(Box)(() => ({
  padding: '16px 24px',
  backgroundColor: '#f9fafb',
  borderBottom: '1px solid #f3f4f6',
}));

export const SearchSectionContent = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  '@media (max-width: 900px)': {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
}));

export const SearchInputWrapper = styled(Box)(() => ({
  position: 'relative',
  width: '100%',
  maxWidth: 420,
}));

export const SearchIcon = styled(Box)(() => ({
  position: 'absolute',
  left: 14,
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#9ca3af',
  pointerEvents: 'none',
  '& svg': {
    width: 18,
    height: 18,
    fontSize: 18,
  },
}));

export const SearchInput = styled('input')(() => ({
  width: '100%',
  height: 44,
  padding: '0 46px 0 42px',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  outline: 'none',
  fontSize: 14,
  fontFamily: 'inherit',
  color: '#111827',
  transition: 'all 150ms ease',
  '&::placeholder': {
    color: '#9ca3af',
  },
  '&:hover': {
    borderColor: '#d1d5db',
  },
  '&:focus': {
    borderColor: '#6366f1',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
}));

export const SearchClearButton = styled('button')(() => ({
  position: 'absolute',
  right: 10,
  top: '50%',
  transform: 'translateY(-50%)',
  width: 26,
  height: 26,
  border: 'none',
  borderRadius: 8,
  backgroundColor: 'transparent',
  color: '#9ca3af',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
  },
  '& svg': {
    width: 16,
    height: 16,
    fontSize: 16,
  },
}));

export const SearchButton = styled('button')(() => ({
  ...headerButtonBase,
  height: 44,
  padding: '10px 16px',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  color: '#4b5563',
  '&:hover': {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
}));

export const AlertSection = styled(Box)(() => ({
  padding: '16px 24px 0',
}));

export const TableSection = styled(Box)(() => ({
  backgroundColor: '#ffffff',
}));

export const StyledTableContainer = styled(TableContainer)(() => ({
  maxHeight: 620,
  '&::-webkit-scrollbar': {
    width: 6,
    height: 6,
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: '#d1d5db',
  },
}));

export const StyledTable = styled(Table)(() => ({
  minWidth: 840,
  borderCollapse: 'separate',
  borderSpacing: 0,
  '& .MuiTableCell-root': {
    borderBottom: '1px solid #f3f4f6',
  },
}));

export const StyledTableHead = styled(TableHead)(() => ({
  '& .MuiTableCell-root': {
    padding: '12px 24px',
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.2,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: '#6b7280',
    backgroundColor: '#ffffff',
    whiteSpace: 'nowrap',
  },
}));

export const StyledTableBody = styled(TableBody)(() => ({
  '& .MuiTableRow-root': {
    transition: 'background-color 150ms ease',
    '&:hover': {
      backgroundColor: '#f9fafb',
    },
  },
  '& .MuiTableRow-root.Mui-selected': {
    backgroundColor: alpha('#6366f1', 0.05),
  },
  '& .MuiTableRow-root.Mui-selected:hover': {
    backgroundColor: alpha('#6366f1', 0.08),
  },
  '& .MuiTableCell-root': {
    padding: '16px 24px',
    verticalAlign: 'middle',
  },
}));

export const HeadCell = styled(TableCell)(() => ({
  '&.MuiTableCell-root': {
    padding: '12px 24px',
  },
}));

export const BodyCell = styled(TableCell)(() => ({
  '&.MuiTableCell-root': {
    padding: '16px 24px',
  },
}));

export const ActionsHeadCell = styled(HeadCell)(() => ({
  '&.MuiTableCell-root': {
    textAlign: 'right',
  },
}));

export const ActionsBodyCell = styled(BodyCell)(() => ({
  '&.MuiTableCell-root': {
    textAlign: 'right',
  },
}));

export const HeaderSortLabel = styled(TableSortLabel)(() => ({
  '&.MuiTableSortLabel-root': {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  '&.Mui-active': {
    color: '#4b5563',
  },
  '& .MuiTableSortLabel-icon': {
    color: '#9ca3af !important',
  },
}));

export const UserCell = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
}));

export const UserAvatar = styled(Box)(() => ({
  width: 36,
  height: 36,
  flexShrink: 0,
  borderRadius: 10,
  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontSize: 14,
  fontWeight: 600,
}));

export const UserInfo = styled(Box)(() => ({
  minWidth: 0,
}));

export const UserEmailRow = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
  flexWrap: 'wrap',
}));

export const UserEmail = styled(Typography)(() => ({
  fontSize: 14,
  lineHeight: 1.35,
  fontWeight: 500,
  color: '#111827',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const YouBadge = styled('span')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 6px',
  borderRadius: 4,
  backgroundColor: '#eef2ff',
  color: '#6366f1',
  fontSize: 10,
  fontWeight: 600,
  lineHeight: 1.2,
}));

export const UserUsername = styled(Typography)(() => ({
  marginTop: 2,
  fontSize: 12,
  lineHeight: 1.35,
  color: '#6b7280',
}));

export const OrganizationText = styled(Typography)(() => ({
  fontSize: 14,
  lineHeight: 1.35,
  color: '#4b5563',
}));

export const StatusBadgesContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
}));

export const StatusBadge = styled('span', {
  shouldForwardProp: prop => prop !== 'badgeVariant',
})<{ badgeVariant: StatusBadgeVariant }>(({ badgeVariant }) => {
  const styles: Record<StatusBadgeVariant, { bg: string; color: string }> = {
    verified: { bg: '#d1fae5', color: '#059669' },
    unverified: { bg: '#fef3c7', color: '#d97706' },
    active: { bg: '#d1fae5', color: '#059669' },
    blocked: { bg: '#fee2e2', color: '#dc2626' },
  };

  const { bg, color } = styles[badgeVariant];

  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 10px',
    borderRadius: 12,
    backgroundColor: bg,
    color,
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
  };
});

export const RoleBadge = styled('span', {
  shouldForwardProp: prop => prop !== 'roleVariant',
})<{ roleVariant: RoleBadgeVariant }>(({ roleVariant }) => {
  const styles: Record<RoleBadgeVariant, { bg: string; color: string }> = {
    superadmin: { bg: '#f3e8ff', color: '#7c3aed' },
    admin: { bg: '#dbeafe', color: '#2563eb' },
    user: { bg: '#f3f4f6', color: '#6b7280' },
    unknown: { bg: '#f3f4f6', color: '#6b7280' },
  };

  const { bg, color } = styles[roleVariant];

  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 12px',
    borderRadius: 12,
    backgroundColor: bg,
    color,
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
  };
});

export const DateText = styled(Typography)(() => ({
  fontSize: 14,
  lineHeight: 1.35,
  color: '#6b7280',
  whiteSpace: 'nowrap',
}));

export const ActionsCell = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 4,
}));

export const ActionButton = styled('button', {
  shouldForwardProp: prop => prop !== 'actionVariant',
})<{ actionVariant?: ActionButtonVariant }>(({ actionVariant = 'default' }) => {
  const variants: Record<
    ActionButtonVariant,
    { hoverBg: string; hoverColor: string }
  > = {
    default: { hoverBg: '#eef2ff', hoverColor: '#6366f1' },
    danger: { hoverBg: '#fee2e2', hoverColor: '#dc2626' },
    success: { hoverBg: '#d1fae5', hoverColor: '#059669' },
  };

  const { hoverBg, hoverColor } = variants[actionVariant];

  return {
    width: 32,
    height: 32,
    padding: 0,
    border: 'none',
    borderRadius: 8,
    backgroundColor: 'transparent',
    color: '#9ca3af',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    '&:hover': {
      backgroundColor: hoverBg,
      color: hoverColor,
    },
    '&:disabled': {
      cursor: 'default',
      color: '#d1d5db',
      backgroundColor: 'transparent',
    },
    '& svg': {
      width: 16,
      height: 16,
      fontSize: 16,
    },
  };
});

export const LoadingState = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 24px',
  borderTop: '1px solid #f3f4f6',
}));

export const LoadingText = styled(Typography)(() => ({
  fontSize: 13,
  color: '#6b7280',
}));

export const EmptyStateCell = styled(TableCell)(() => ({
  '&.MuiTableCell-root': {
    padding: '28px 24px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
  },
}));

export const PaginationSection = styled(Box)(() => ({
  padding: '16px 24px',
  borderTop: '1px solid #f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  '@media (max-width: 900px)': {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
}));

export const PaginationInfo = styled(Typography)(() => ({
  fontSize: 14,
  color: '#6b7280',
}));

export const PaginationButtons = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 8,
}));

export const PaginationButton = styled('button')(() => ({
  minWidth: 64,
  padding: '6px 12px',
  border: 'none',
  borderRadius: 8,
  backgroundColor: 'transparent',
  color: '#6366f1',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.2,
  fontFamily: 'inherit',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#eef2ff',
  },
  '&:disabled': {
    backgroundColor: 'transparent',
    color: '#d1d5db',
    cursor: 'default',
  },
}));

export const StyledDialog = styled(Dialog)(() => ({
  '& .MuiDialog-paper': {
    width: '100%',
    maxWidth: 480,
    margin: 16,
    maxHeight: 'calc(100vh - 32px)',
    borderRadius: 16,
    border: '1px solid #f3f4f6',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(4px)',
  },
}));

export const ModalHeader = styled(Box)(() => ({
  padding: '20px 24px',
  borderBottom: '1px solid #f3f4f6',
}));

export const ModalTitle = styled(Typography)(() => ({
  fontSize: 18,
  fontWeight: 600,
  lineHeight: 1.25,
  color: '#111827',
  marginBottom: 4,
}));

export const ModalDescription = styled(Typography)(() => ({
  fontSize: 14,
  lineHeight: 1.5,
  color: '#6b7280',
}));

export const ModalContent = styled(Box)(() => ({
  padding: '20px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  overflowY: 'auto',
  minHeight: 0,
}));

export const FormField = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
}));

export const FieldLabel = styled('label')(() => ({
  display: 'flex',
  alignSelf: 'flex-start',
  alignItems: 'center',
  gap: 4,
  width: 'fit-content',
  marginBottom: 8,
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.3,
  color: '#374151',
}));

export const RequiredMark = styled('span')(() => ({
  color: '#ef4444',
}));

export const FieldHint = styled(Typography)(() => ({
  marginTop: 6,
  fontSize: 12,
  lineHeight: 1.4,
  color: '#9ca3af',
}));

export const FieldError = styled(Typography)(() => ({
  marginTop: 6,
  fontSize: 12,
  lineHeight: 1.4,
  color: '#dc2626',
}));

export const TextInput = styled(TextField)(() => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    fontSize: 14,
    color: '#111827',
    transition: 'all 150ms ease',
    '& fieldset': {
      borderColor: '#e5e7eb',
    },
    '&:hover fieldset': {
      borderColor: '#d1d5db',
    },
    '&.Mui-focused': {
      backgroundColor: '#ffffff',
      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#6366f1',
    },
    '&.Mui-error fieldset': {
      borderColor: '#ef4444',
    },
    '&.Mui-error.Mui-focused': {
      boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.12)',
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: '12px 16px',
    '&::placeholder': {
      color: '#9ca3af',
      opacity: 1,
    },
  },
  '& .MuiFormHelperText-root': {
    display: 'none',
  },
}));

export const SelectWrapper = styled(Box)(() => ({
  position: 'relative',
}));

export const SelectInput = styled('select', {
  shouldForwardProp: prop => prop !== 'hasError',
})<{ hasError?: boolean }>(({ hasError = false }) => ({
  width: '100%',
  padding: '12px 40px 12px 16px',
  backgroundColor: '#f9fafb',
  border: `1px solid ${hasError ? '#ef4444' : '#e5e7eb'}`,
  borderRadius: 12,
  fontSize: 14,
  lineHeight: 1.4,
  fontFamily: 'inherit',
  color: '#111827',
  outline: 'none',
  appearance: 'none',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '&:hover': {
    borderColor: hasError ? '#ef4444' : '#d1d5db',
  },
  '&:focus': {
    backgroundColor: '#ffffff',
    borderColor: hasError ? '#ef4444' : '#6366f1',
    boxShadow: hasError
      ? '0 0 0 3px rgba(239, 68, 68, 0.12)'
      : '0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
  '&:disabled': {
    cursor: 'default',
    color: '#9ca3af',
    backgroundColor: '#f3f4f6',
  },
}));

export const DialogSelectControl = styled(FormControl)(() => ({
  width: '100%',
}));

export const DialogSelect = styled(Select)(() => ({
  borderRadius: 12,
  backgroundColor: '#f9fafb',
  fontSize: 14,
  color: '#111827',
  transition: 'all 150ms ease',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#e5e7eb',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#d1d5db',
  },
  '&.Mui-focused': {
    backgroundColor: '#ffffff',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#6366f1',
  },
  '&.Mui-error .MuiOutlinedInput-notchedOutline': {
    borderColor: '#ef4444',
  },
  '&.Mui-error.Mui-focused': {
    boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.12)',
  },
  '& .MuiSelect-select': {
    padding: '12px 40px 12px 16px',
    minHeight: 'unset',
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
  },
  '& .MuiSelect-icon': {
    right: 14,
    color: '#9ca3af',
    fontSize: 18,
  },
  '&.Mui-disabled': {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
  },
}));

export const DialogMenuItem = styled(MenuItem)(() => ({
  margin: '2px 6px',
  padding: '10px 12px',
  borderRadius: 10,
  fontSize: 14,
  lineHeight: 1.35,
  color: '#374151',
  transition: 'background-color 150ms ease, color 150ms ease',
  '&:hover': {
    backgroundColor: '#f9fafb',
  },
  '&.Mui-selected': {
    backgroundColor: '#eef2ff',
    color: '#4338ca',
  },
  '&.Mui-selected:hover': {
    backgroundColor: '#e0e7ff',
  },
  '&.Mui-disabled': {
    opacity: 1,
    color: '#9ca3af',
  },
}));

export const SelectIcon = styled(Box)(() => ({
  position: 'absolute',
  right: 16,
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  color: '#9ca3af',
  display: 'inline-flex',
  alignItems: 'center',
  '& svg': {
    width: 16,
    height: 16,
    fontSize: 16,
  },
}));

export const ToggleCard = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '14px 16px',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
}));

export const ToggleInfo = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
}));

export const ToggleLabel = styled(Typography)(() => ({
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.3,
  color: '#374151',
}));

export const ToggleDescription = styled(Typography)(() => ({
  marginTop: 2,
  fontSize: 12,
  lineHeight: 1.4,
  color: '#9ca3af',
}));

export const ToggleSwitch = styled('button', {
  shouldForwardProp: prop => prop !== 'isActive',
})<{ isActive?: boolean }>(({ isActive = false }) => ({
  position: 'relative',
  width: 48,
  height: 28,
  flexShrink: 0,
  border: 'none',
  borderRadius: 14,
  backgroundColor: isActive ? '#6366f1' : '#d1d5db',
  cursor: 'pointer',
  transition: 'background-color 200ms ease',
  '&:hover': {
    backgroundColor: isActive ? '#4f46e5' : '#9ca3af',
  },
  '&:disabled': {
    cursor: 'default',
    backgroundColor: isActive ? '#a5b4fc' : '#d1d5db',
  },
}));

export const ToggleThumb = styled('span', {
  shouldForwardProp: prop => prop !== 'isActive',
})<{ isActive?: boolean }>(({ isActive = false }) => ({
  position: 'absolute',
  top: 4,
  left: isActive ? 24 : 4,
  width: 20,
  height: 20,
  borderRadius: '50%',
  backgroundColor: '#ffffff',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  transition: 'left 200ms ease',
}));

export const ModalFooter = styled(Box)(() => ({
  padding: '16px 24px',
  backgroundColor: '#f9fafb',
  borderTop: '1px solid #f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 12,
}));

export const CancelButton = styled('button')(() => ({
  padding: '10px 16px',
  border: 'none',
  borderRadius: 12,
  backgroundColor: 'transparent',
  color: '#6b7280',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.2,
  fontFamily: 'inherit',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
}));

export const SaveButton = styled('button')(() => ({
  minWidth: 110,
  padding: '10px 20px',
  border: 'none',
  borderRadius: 12,
  backgroundColor: '#6366f1',
  color: '#ffffff',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.2,
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#4f46e5',
  },
  '&:disabled': {
    backgroundColor: '#e5e7eb',
    color: '#9ca3af',
    cursor: 'not-allowed',
  },
  '& .MuiCircularProgress-root': {
    color: 'inherit',
  },
}));
