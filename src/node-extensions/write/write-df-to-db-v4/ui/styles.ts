import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { alpha, Box, styled, Typography } from '@mui/material';

const TABLE_CONTROL_HEIGHT = 42;
const uniformElevationShadow = '0 2px 8px rgba(15, 23, 42, 0.08)';
const refreshSpin = {
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
};

export const AccordionContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 0,
});

export const AccordionItem = styled(Box, {
  shouldForwardProp: prop => prop !== 'hasError',
})<{ hasError?: boolean }>(({ theme, hasError }) => ({
  border: `1px solid ${
    hasError ? theme.palette.error.main : theme.palette.divider
  }`,
  borderRadius: 8,
  overflow: 'visible',
  backgroundColor: theme.palette.background.paper,
  transition: 'border-color 0.2s ease',
}));

export const AccordionHeader = styled('button', {
  shouldForwardProp: prop => prop !== 'isOpen',
})<{ isOpen?: boolean }>(({ theme, isOpen }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  border: 'none',
  borderRadius: isOpen ? '8px 8px 0 0' : '8px',
  backgroundColor: isOpen
    ? theme.palette.background.paper
    : alpha(theme.palette.grey[50], 0.8),
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontFamily: 'inherit',
  '&:hover': {
    backgroundColor: isOpen
      ? alpha(theme.palette.grey[50], 0.5)
      : alpha(theme.palette.grey[100], 0.6),
  },
}));

export const AccordionHeaderLeft = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
});

export const AccordionIcon = styled(Box, {
  shouldForwardProp: prop => prop !== 'isOpen' && prop !== 'hasError',
})<{
  isOpen?: boolean;
  hasError?: boolean;
}>(({ theme, isOpen, hasError }) => ({
  width: 32,
  height: 32,
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: hasError
    ? alpha(theme.palette.error.main, 0.1)
    : isOpen
      ? alpha(theme.palette.primary.main, 0.1)
      : theme.palette.grey[100],
  color: hasError
    ? theme.palette.error.main
    : isOpen
      ? theme.palette.primary.main
      : theme.palette.text.secondary,
  transition: 'all 0.2s ease',
}));

export const AccordionTitle = styled(Typography, {
  shouldForwardProp: prop => prop !== 'isOpen',
})<{ isOpen?: boolean }>(({ theme, isOpen }) => ({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: isOpen ? theme.palette.text.primary : theme.palette.text.secondary,
}));

export const CollapsedValue = styled(Typography, {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone?: 'info' | 'warning' }>(({ theme, tone = 'info' }) => ({
  fontSize: '0.75rem',
  color:
    tone === 'warning'
      ? theme.palette.warning.main
      : theme.palette.primary.main,
  fontWeight: 500,
  marginLeft: 'auto',
  marginRight: 12,
  maxWidth: 250,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  padding: '2px 10px',
  backgroundColor:
    tone === 'warning'
      ? alpha(theme.palette.warning.main, 0.12)
      : alpha(theme.palette.primary.main, 0.08),
  borderRadius: 12,
}));

export const AccordionChevron = styled(KeyboardArrowDownIcon, {
  shouldForwardProp: prop => prop !== 'isOpen',
})<{
  isOpen?: boolean;
}>(({ theme, isOpen }) => ({
  fontSize: 20,
  color: theme.palette.text.secondary,
  opacity: 0.5,
  transition: 'transform 0.2s ease',
  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
  flexShrink: 0,
}));

export const AccordionContent = styled(Box)(({ theme }) => ({
  padding: 16,
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  borderRadius: '0 0 8px 8px',
}));

export const FieldGroup = styled(Box)({
  marginBottom: 16,
  '&:last-child': {
    marginBottom: 0,
  },
});

export const FieldLabel = styled('div')(({ theme }) => ({
  ...theme.typography.body2,
  fontSize: '0.75rem',
  fontWeight: 500,
  color: theme.palette.text.secondary,
  marginBottom: 6,
}));

export const ConnectionInput = styled(Box)({
  display: 'flex',
  gap: 8,
});

export const StyledInput = styled('input')(({ theme }) => ({
  flex: 1,
  padding: '10px 12px',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 8,
  fontSize: '0.8125rem',
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  backgroundColor: theme.palette.grey[50],
  color: theme.palette.text.primary,
  outline: 'none',
  '&:focus': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.background.paper,
  },
  '&:disabled': {
    color: theme.palette.text.secondary,
  },
}));

export const RefreshButton = styled('button', {
  shouldForwardProp: prop => prop !== 'loading',
})<{ loading?: boolean }>(({ theme, loading }) => ({
  padding: '10px 12px',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 8,
  backgroundColor: theme.palette.background.paper,
  cursor: 'pointer',
  color: theme.palette.text.secondary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  transform: 'translateY(0)',
  boxShadow: 'none',
  '@keyframes refreshSpin': refreshSpin,
  '& svg': {
    transition: 'transform 0.2s ease',
    animation: loading ? 'refreshSpin 0.9s linear infinite' : 'none',
  },
  '&:hover': {
    backgroundColor: theme.palette.grey[50],
    borderColor: loading
      ? alpha(theme.palette.primary.main, 0.35)
      : theme.palette.grey[300],
    color: theme.palette.primary.main,
    transform: 'translateY(-1px)',
    boxShadow: uniformElevationShadow,
  },
  '&:active': {
    transform: 'translateY(0) scale(0.98)',
    boxShadow: uniformElevationShadow,
  },
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  ...(loading && {
    borderColor: alpha(theme.palette.primary.main, 0.35),
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    color: theme.palette.primary.main,
  }),
}));

export const SQLToolbar = styled(Box)(() => ({
  padding: '8px 16px',
  backgroundColor: '#ffffff',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
  margin: '-16px -16px 4px -16px',
}));

export const ToolbarHint = styled(Typography)(() => ({
  fontSize: 12,
  fontWeight: 400,
  color: '#6b7280',
}));

export const ToolbarActions = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
}));

export const ToolbarButton = styled('button')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  fontSize: 12,
  fontWeight: 500,
  fontFamily: 'inherit',
  color: '#4b5563',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '@keyframes spin': refreshSpin,
  '&:hover': {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
  '&:active': {
    backgroundColor: '#e5e7eb',
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  '& .MuiSvgIcon-root': {
    fontSize: 14,
  },
  '&.refreshing .MuiSvgIcon-root': {
    animation: 'spin 1s linear infinite',
  },
}));

export const StatusBadge = styled(Box, {
  shouldForwardProp: prop => prop !== 'connected',
})<{ connected?: boolean }>(({ theme, connected }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px',
  borderRadius: 8,
  backgroundColor: connected
    ? alpha(theme.palette.success.main, 0.08)
    : alpha(theme.palette.warning.main, 0.08),
  border: `1px solid ${
    connected
      ? alpha(theme.palette.success.main, 0.2)
      : alpha(theme.palette.warning.main, 0.2)
  }`,
}));

export const RadioCardsContainer = styled(Box)(() => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
  marginBottom: 12,
}));

export const RadioCard = styled('button', {
  shouldForwardProp: prop => prop !== 'selected',
})<{ selected?: boolean }>(({ selected }) => ({
  padding: 12,
  borderRadius: 12,
  border: '2px solid',
  borderColor: selected ? '#6366f1' : '#e5e7eb',
  backgroundColor: selected ? 'rgba(99, 102, 241, 0.05)' : '#ffffff',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'all 150ms ease',
  '&:hover': {
    borderColor: selected ? '#6366f1' : '#d1d5db',
  },
}));

export const RadioCardHeader = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 4,
}));

export const RadioIndicator = styled(Box, {
  shouldForwardProp: prop => prop !== 'selected',
})<{ selected?: boolean }>(({ selected }) => ({
  width: 16,
  height: 16,
  borderRadius: '50%',
  border: '2px solid',
  borderColor: selected ? '#6366f1' : '#d1d5db',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 150ms ease',
  '&::after': {
    content: '""',
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: selected ? '#6366f1' : 'transparent',
    transition: 'all 150ms ease',
  },
}));

export const RadioCardTitle = styled(Typography, {
  shouldForwardProp: prop => prop !== 'selected',
})<{ selected?: boolean }>(({ selected }) => ({
  fontSize: 13,
  fontWeight: 500,
  color: selected ? '#4f46e5' : '#374151',
}));

export const RadioCardDescription = styled(Typography)(() => ({
  fontSize: 11,
  fontWeight: 400,
  color: '#9ca3af',
  marginLeft: 24,
}));

export const CreateTableInput = styled('input')(() => ({
  flex: 1,
  height: TABLE_CONTROL_HEIGHT,
  boxSizing: 'border-box',
  padding: '10px 12px',
  fontSize: 13,
  fontFamily: 'inherit',
  color: '#374151',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  outline: 'none',
  transition: 'all 150ms ease',
  '&::placeholder': {
    color: '#9ca3af',
  },
  '&:hover': {
    borderColor: '#d1d5db',
  },
  '&:focus': {
    borderColor: '#a5b4fc',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
}));

export const SaveButton = styled('button')(() => ({
  height: TABLE_CONTROL_HEIGHT,
  boxSizing: 'border-box',
  padding: '10px 16px',
  fontSize: 13,
  fontWeight: 500,
  color: '#ffffff',
  backgroundColor: '#6366f1',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#4f46e5',
  },
  '&:disabled': {
    backgroundColor: '#d1d5db',
    cursor: 'not-allowed',
  },
}));

export const CreateTableRow = styled(Box)(() => ({
  display: 'flex',
  gap: 12,
}));

export const SelectedTableBox = styled(Box)(({ theme }) => ({
  minHeight: TABLE_CONTROL_HEIGHT,
  boxSizing: 'border-box',
  padding: '5px 12px',
  display: 'flex',
  alignItems: 'center',
  backgroundColor: alpha(theme.palette.primary.main, 0.06),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
  borderRadius: 8,
}));

export const TableBrowserContainer = styled(Box)(() => ({
  overflow: 'hidden',
  height: 360,
  display: 'flex',
  flexDirection: 'column',
}));

export const SchemaLabel = styled(Typography)(() => ({
  fontSize: 12,
  fontWeight: 500,
  color: '#6b7280',
  marginBottom: 6,
}));

export const SchemaSegmentedControl = styled(Box)(() => ({
  display: 'flex',
  gap: 4,
  padding: 4,
  backgroundColor: '#f3f4f6',
  borderRadius: 12,
  marginBottom: 12,
}));

export const SchemaSegmentButton = styled('button', {
  shouldForwardProp: prop => prop !== 'selected',
})<{ selected?: boolean }>(({ selected }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '8px 12px',
  fontSize: 12,
  fontWeight: 500,
  fontFamily: 'inherit',
  color: selected ? '#374151' : '#6b7280',
  backgroundColor: selected ? '#ffffff' : 'transparent',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  boxShadow: selected ? '0 2px 8px rgba(15, 23, 42, 0.08)' : 'none',
  '&:hover': {
    color: '#374151',
  },
  '& .MuiSvgIcon-root': {
    fontSize: 16,
  },
}));

export const SchemaListContainer = styled(Box)(() => ({
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  overflow: 'hidden',
}));

export const SchemaSearchContainer = styled(Box)(() => ({
  padding: 12,
  borderBottom: '1px solid #f3f4f6',
  backgroundColor: '#f9fafb',
}));

export const SchemaSearchInputWrapper = styled(Box)(() => ({
  position: 'relative',
}));

export const SchemaSearchIcon = styled(Box)(() => ({
  position: 'absolute',
  left: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#9ca3af',
  display: 'flex',
  alignItems: 'center',
  '& .MuiSvgIcon-root': {
    fontSize: 16,
  },
}));

export const SchemaSearchInput = styled('input')(() => ({
  width: '100%',
  padding: '8px 12px 8px 36px',
  fontSize: 13,
  fontFamily: 'inherit',
  color: '#374151',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  outline: 'none',
  transition: 'all 150ms ease',
  '&::placeholder': {
    color: '#9ca3af',
  },
  '&:hover': {
    borderColor: '#d1d5db',
  },
  '&:focus': {
    borderColor: '#a5b4fc',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
}));

export const SchemaList = styled(Box)(() => ({
  maxHeight: 224,
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    width: 6,
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#e5e7eb',
    borderRadius: 3,
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: '#d1d5db',
  },
}));

export const SchemaItem = styled('button', {
  shouldForwardProp: prop => prop !== 'selected',
})<{ selected?: boolean }>(({ selected }) => ({
  width: '100%',
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: selected ? '#eef2ff' : 'transparent',
  border: 'none',
  borderBottom: '1px solid #f3f4f6',
  cursor: 'pointer',
  transition: 'background-color 100ms ease',
  textAlign: 'left',
  fontFamily: 'inherit',
  '&:hover': {
    backgroundColor: selected ? '#eef2ff' : '#f9fafb',
  },
  '&:last-child': {
    borderBottom: 'none',
  },
}));

export const SchemaItemLeft = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
}));

export const SchemaItemIcon = styled(Box, {
  shouldForwardProp: prop => prop !== 'selected',
})<{ selected?: boolean }>(({ selected }) => ({
  color: selected ? '#6366f1' : '#9ca3af',
  display: 'flex',
  alignItems: 'center',
  '& .MuiSvgIcon-root': {
    fontSize: 18,
  },
}));

export const SchemaItemName = styled(Typography, {
  shouldForwardProp: prop => prop !== 'selected',
})<{ selected?: boolean }>(({ selected }) => ({
  fontSize: 13,
  fontWeight: 500,
  color: selected ? '#4f46e5' : '#374151',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const SchemaItemRight = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginLeft: 8,
}));

export const SchemaTableCount = styled(Typography)(() => ({
  fontSize: 12,
  fontWeight: 400,
  color: '#9ca3af',
}));

export const SchemaRowIndicator = styled(Box, {
  shouldForwardProp: prop => prop !== 'selected',
})<{ selected?: boolean }>(({ selected }) => ({
  width: 16,
  height: 16,
  borderRadius: '50%',
  border: '2px solid',
  borderColor: selected ? '#6366f1' : '#d1d5db',
  backgroundColor: selected ? '#6366f1' : 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 150ms ease',
  '&::after': {
    content: '""',
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: selected ? '#ffffff' : 'transparent',
  },
}));

export const SchemaCreateInputRow = styled(Box)(() => ({
  display: 'flex',
  gap: 8,
  marginTop: 16,
}));

export const SchemaCreateInput = styled('input')(() => ({
  flex: 1,
  padding: '10px 12px',
  fontSize: 13,
  fontFamily: 'inherit',
  color: '#374151',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  outline: 'none',
  transition: 'all 150ms ease',
  '&::placeholder': {
    color: '#9ca3af',
  },
  '&:hover': {
    borderColor: '#d1d5db',
  },
  '&:focus': {
    borderColor: '#a5b4fc',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
}));

export const SchemaCreateSaveButton = styled('button')(() => ({
  padding: '10px 16px',
  fontSize: 13,
  fontWeight: 500,
  fontFamily: 'inherit',
  color: '#ffffff',
  backgroundColor: '#6366f1',
  border: 'none',
  borderRadius: 12,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  whiteSpace: 'nowrap',
  '&:hover': {
    backgroundColor: '#4f46e5',
  },
  '&:disabled': {
    backgroundColor: '#d1d5db',
    cursor: 'not-allowed',
  },
}));

export const WriteModeLabel = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 8,
}));

export const WriteModeTitle = styled(Typography)(() => ({
  fontSize: 12,
  fontWeight: 500,
  color: '#6b7280',
}));

export const WriteModeTooltipIcon = styled(Box)(() => ({
  width: 16,
  height: 16,
  borderRadius: '50%',
  backgroundColor: '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'help',
  '& span': {
    fontSize: 10,
    fontWeight: 500,
    color: '#9ca3af',
    lineHeight: 1,
  },
}));

export const SegmentedControl = styled(Box)(() => ({
  display: 'flex',
  padding: 4,
  backgroundColor: '#f3f4f6',
  borderRadius: 12,
  gap: 4,
}));

export const SegmentButton = styled('button', {
  shouldForwardProp: prop => prop !== 'selected',
})<{ selected?: boolean }>(({ selected }) => ({
  flex: 1,
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 500,
  fontFamily: 'inherit',
  color: selected ? '#1f2937' : '#6b7280',
  backgroundColor: selected ? '#ffffff' : 'transparent',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  boxShadow: selected ? '0 2px 8px rgba(15, 23, 42, 0.08)' : 'none',
  '&:hover': {
    color: selected ? '#1f2937' : '#374151',
  },
  '&:disabled': {
    color: '#9ca3af',
    backgroundColor: 'transparent',
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  '&:disabled:hover': {
    color: '#9ca3af',
  },
}));

export const SqlErrorBlockContainer = styled(Box)(() => ({
  width: '100%',
}));

export const SqlErrorBanner = styled(Box)(() => ({
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 12,
  padding: 16,
}));

export const SqlErrorBannerContent = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
}));

export const SqlErrorIconContainer = styled(Box)(() => ({
  width: 32,
  height: 32,
  borderRadius: 8,
  backgroundColor: '#fee2e2',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  '& .MuiSvgIcon-root': {
    fontSize: 16,
    color: '#dc2626',
  },
}));

export const SqlErrorBannerTextContainer = styled(Box)(() => ({
  flex: 1,
  minWidth: 0,
}));

export const SqlErrorTitle = styled(Typography)(() => ({
  fontSize: 14,
  fontWeight: 600,
  color: '#991b1b',
  marginBottom: 2,
}));

export const SqlErrorSummary = styled(Typography)(() => ({
  fontSize: 12,
  fontWeight: 400,
  fontFamily:
    '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  color: '#dc2626',
}));

export const SqlErrorActionsRow = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginTop: 12,
}));

export const SqlErrorToggleDetailsButton = styled('button')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: 0,
  fontSize: 12,
  fontWeight: 500,
  fontFamily: 'inherit',
  color: '#b91c1c',
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  transition: 'color 150ms ease',
  '&:hover': {
    color: '#991b1b',
  },
  '& .toggle-icon': {
    width: 14,
    height: 14,
    transition: 'transform 200ms ease',
  },
  '&.expanded .toggle-icon': {
    transform: 'rotate(180deg)',
  },
}));

export const SqlErrorCloseButton = styled('button')(() => ({
  padding: 4,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  color: '#f87171',
  transition: 'all 150ms ease',
  flexShrink: 0,
  '&:hover': {
    color: '#dc2626',
    backgroundColor: '#fee2e2',
  },
  '& .MuiSvgIcon-root': {
    fontSize: 16,
  },
}));

export const SqlErrorBannerActions = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  marginLeft: 'auto',
  flexShrink: 0,
  alignSelf: 'flex-start',
}));

export const SqlErrorDetailsContainer = styled(Box)(() => ({
  marginTop: 8,
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  overflow: 'hidden',
}));

export const SqlErrorDetailsHeader = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '12px 16px',
  borderBottom: '1px solid #f3f4f6',
  backgroundColor: '#f9fafb',
}));

export const SqlErrorDetailsHeaderTitle = styled(Typography)(() => ({
  fontSize: 10,
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}));

export const SqlErrorDetailsCopyButton = styled('button')(() => ({
  width: 28,
  height: 28,
  padding: 0,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  color: '#6b7280',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 150ms ease',
  '&:hover': {
    color: '#374151',
    backgroundColor: 'transparent',
  },
  '& .MuiSvgIcon-root': {
    fontSize: 16,
  },
}));

export const SqlErrorDetailsContent = styled(Box)(() => ({
  padding: 16,
  maxHeight: 240,
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    width: 6,
  },
  '&::-webkit-scrollbar-track': {
    background: '#f9fafb',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#e5e7eb',
    borderRadius: 3,
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: '#d1d5db',
  },
}));

export const SqlErrorMessageText = styled('pre')(() => ({
  fontSize: 12,
  fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
  fontWeight: 400,
  color: '#b91c1c',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  margin: 0,
  lineHeight: 1.7,
}));

export const MsRoot = styled(Box)(() => ({
  position: 'relative',
}));

export const MsTrigger = styled(Box)(() => ({
  padding: '7px 11px',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  cursor: 'pointer',
  minHeight: 36,
  transition: 'all 150ms ease',
  '&:hover': {
    borderColor: '#cbd5e1',
  },
  '&:focus-within': {
    borderColor: '#c7d2fe',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.08)',
  },
}));

export const MsChipsContainer = styled(Box)(() => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 5,
  flex: 1,
  minWidth: 0,
}));

export const MsSelectedChip = styled(Box)(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 7px 3px 5px',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  minWidth: 0,
}));

export const MsChipOrder = styled('span')(() => ({
  fontSize: 9,
  fontWeight: 700,
  color: '#94a3b8',
  fontFamily:
    '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  flexShrink: 0,
}));

export const MsChipLabel = styled('span')(() => ({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 11.5,
  fontWeight: 600,
  color: '#1e293b',
  fontFamily:
    '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
}));

export const MsChipRemoveButton = styled('button')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: '#94a3b8',
  transition: 'color 150ms ease',
  '&:hover': {
    color: '#64748b',
  },
  '& svg': {
    width: 9,
    height: 9,
  },
}));

export const MsTriggerPlaceholder = styled(Typography)(() => ({
  fontSize: 12,
  color: '#94a3b8',
}));

export const MsTriggerArrow = styled('svg')(() => ({
  width: 16,
  height: 16,
  color: '#64748b',
  flexShrink: 0,
  transition: 'transform 150ms ease',
}));

export const MsDropdownContainer = styled(Box)(() => ({
  position: 'fixed',
  zIndex: 1300,
  maxHeight: 340,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#ffffff',
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  boxShadow: '0 10px 28px rgba(15, 23, 42, 0.14)',
  overflow: 'hidden',
}));

export const MsSearchContainer = styled(Box)(() => ({
  padding: 8,
  borderBottom: '1px solid #eef2f7',
}));

export const MsSearchInputWrapper = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '7px 9px',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
}));

export const MsSearchIcon = styled('svg')(() => ({
  width: 14,
  height: 14,
  color: '#94a3b8',
  flexShrink: 0,
}));

export const MsSearchInput = styled('input')(() => ({
  flex: 1,
  backgroundColor: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: 12,
  fontFamily: 'inherit',
  color: '#1e293b',
  '&::placeholder': {
    color: '#94a3b8',
  },
}));

export const MsColumnList = styled(Box)(() => ({
  maxHeight: 256,
  overflowY: 'auto',
  padding: 4,
  '&::-webkit-scrollbar': {
    width: 4,
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#e2e8f0',
    borderRadius: 2,
  },
}));

export const MsColumnItem = styled('button', {
  shouldForwardProp: prop => prop !== 'isSelected',
})<{ isSelected?: boolean }>(({ isSelected }) => ({
  width: '100%',
  padding: '8px 10px',
  borderRadius: 7,
  border: 'none',
  backgroundColor: isSelected ? '#eef2ff' : 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  transition: 'all 150ms ease',
  fontFamily: 'inherit',
  '&:hover': {
    backgroundColor: isSelected ? '#eef2ff' : '#f8fafc',
  },
}));

export const MsCheckbox = styled(Box, {
  shouldForwardProp: prop => prop !== 'isChecked',
})<{ isChecked?: boolean }>(({ isChecked }) => ({
  width: 16,
  height: 16,
  borderRadius: 5,
  border: '1.5px solid',
  borderColor: isChecked ? '#6366f1' : '#e2e8f0',
  backgroundColor: isChecked ? '#6366f1' : '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 150ms ease',
  flexShrink: 0,
}));

export const MsCheckIcon = styled('svg')(() => ({
  width: 9,
  height: 9,
  color: '#ffffff',
}));

export const MsColumnName = styled(Typography, {
  shouldForwardProp: prop => prop !== 'isSelected',
})<{ isSelected?: boolean }>(({ isSelected }) => ({
  flex: 1,
  minWidth: 0,
  fontSize: 11.5,
  fontWeight: 600,
  color: isSelected ? '#4f46e5' : '#1e293b',
  textAlign: 'left',
  fontFamily:
    '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const MsTypeBadge = styled('span', {
  shouldForwardProp: prop => prop !== 'dataType',
})<{ dataType: string }>(({ dataType }) => {
  const colors: Record<string, { bg: string; text: string }> = {
    int64: { bg: '#d1fae5', text: '#047857' },
    int: { bg: '#d1fae5', text: '#047857' },
    integer: { bg: '#d1fae5', text: '#047857' },
    float64: { bg: '#f3e8ff', text: '#8b5cf6' },
    float: { bg: '#f3e8ff', text: '#8b5cf6' },
    double: { bg: '#f3e8ff', text: '#8b5cf6' },
    object: { bg: '#fef3c7', text: '#92400e' },
    datetime: { bg: '#fef3c7', text: '#92400e' },
    date: { bg: '#fef3c7', text: '#92400e' },
    timestamp: { bg: '#fef3c7', text: '#92400e' },
    boolean: { bg: '#fce7f3', text: '#be185d' },
    bool: { bg: '#fce7f3', text: '#be185d' },
  };

  const typeKey = dataType?.toLowerCase() || 'default';
  const color = colors[typeKey] || { bg: '#f8fafc', text: '#64748b' };

  return {
    padding: '2px 7px',
    borderRadius: 5,
    fontSize: 10,
    fontWeight: 700,
    backgroundColor: color.bg,
    color: color.text,
    fontFamily:
      '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    flexShrink: 0,
  };
});

export const MsDropdownFooter = styled(Box)(() => ({
  padding: '8px 12px',
  borderTop: '1px solid #eef2f7',
  backgroundColor: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

export const MsSelectedCount = styled(Typography)(() => ({
  fontSize: 11.5,
  fontWeight: 600,
  color: '#94a3b8',
}));

export const MsClearButton = styled('button')(() => ({
  padding: 0,
  backgroundColor: 'transparent',
  border: 'none',
  fontSize: 11.5,
  fontWeight: 600,
  color: '#6366f1',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'color 150ms ease',
  '&:hover': {
    color: '#4f46e5',
  },
}));

export const SectionContainer = styled(Box)(() => ({
  backgroundColor: '#ffffff',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
}));

export const SectionHeader = styled(Box)(() => ({
  padding: '12px 16px',
  backgroundColor: '#f9fafb',
  borderBottom: '1px solid #f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

export const SectionHeaderLeft = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}));

export const SectionIcon = styled('svg')(() => ({
  width: 16,
  height: 16,
  color: '#6b7280',
}));

export const SectionTitle = styled(Typography)(() => ({
  fontSize: 14,
  fontWeight: 600,
  color: '#374151',
}));

export const SectionCounter = styled('span')(() => ({
  padding: '2px 6px',
  backgroundColor: '#e5e7eb',
  color: '#6b7280',
  fontSize: 10,
  fontWeight: 600,
  borderRadius: 4,
}));

export const AddButton = styled('button')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: 0,
  backgroundColor: 'transparent',
  border: 'none',
  fontSize: 12,
  fontWeight: 500,
  color: '#6366f1',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'color 150ms ease',
  '&:hover': {
    color: '#4f46e5',
  },
  '& svg': {
    width: 12,
    height: 12,
  },
}));

export const RowsContainer = styled(Box)(() => ({
  '& > *:not(:last-child)': {
    borderBottom: '1px solid #f3f4f6',
  },
}));

export const IndexRow = styled(Box)(() => ({
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  '&:hover': {
    backgroundColor: '#fafafa',
  },
}));

export const InlineInput = styled('input')(() => ({
  padding: '6px 10px',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: 'inherit',
  color: '#374151',
  outline: 'none',
  transition: 'all 150ms ease',
  minWidth: 0,
  '&::placeholder': {
    color: '#9ca3af',
  },
  '&:focus': {
    backgroundColor: '#ffffff',
    borderColor: '#6366f1',
    boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.1)',
  },
}));

export const IndexNameInput = styled(InlineInput)(() => ({
  width: 140,
  flexShrink: 0,
}));

export const InlineColumnSelector = styled(Box)(() => ({
  flex: 1,
  minWidth: 180,
}));

export const UniqueToggle = styled(Box)(() => ({
  display: 'flex',
  backgroundColor: '#f3f4f6',
  borderRadius: 8,
  padding: 2,
  flexShrink: 0,
}));

export const UniqueToggleOption = styled('button', {
  shouldForwardProp: prop => prop !== 'isActive',
})<{ isActive?: boolean }>(({ isActive }) => ({
  padding: '4px 10px',
  backgroundColor: isActive ? '#ffffff' : 'transparent',
  border: 'none',
  borderRadius: 6,
  fontSize: 10,
  fontWeight: 600,
  fontFamily: 'inherit',
  color: isActive ? '#374151' : '#9ca3af',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  whiteSpace: 'nowrap',
  ...(isActive && {
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  }),
  '&:hover': {
    color: isActive ? '#374151' : '#6b7280',
  },
}));

export const DeleteRowButton = styled('button')(() => ({
  padding: 6,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  color: '#d1d5db',
  transition: 'all 150ms ease',
  flexShrink: 0,
  '&:hover': {
    backgroundColor: '#fef2f2',
    color: '#ef4444',
  },
  '& svg': {
    width: 16,
    height: 16,
  },
}));

export const EmptyState = styled(Box)(() => ({
  padding: '32px 16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const EmptyStateText = styled(Typography)(() => ({
  fontSize: 14,
  color: '#9ca3af',
  marginBottom: 4,
}));

export const EmptyStateAction = styled('button')(() => ({
  padding: 0,
  backgroundColor: 'transparent',
  border: 'none',
  fontSize: 12,
  fontWeight: 500,
  color: '#6366f1',
  cursor: 'pointer',
  fontFamily: 'inherit',
  '&:hover': {
    color: '#4f46e5',
    textDecoration: 'underline',
  },
}));

export const FKRow = styled(Box)(() => ({
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  '&:hover': {
    backgroundColor: '#fafafa',
  },
}));

export const FKArrow = styled('span')(() => ({
  fontSize: 14,
  color: '#9ca3af',
  fontWeight: 500,
  flexShrink: 0,
}));

export const FKDot = styled('span')(() => ({
  fontSize: 14,
  color: '#9ca3af',
  fontWeight: 500,
  flexShrink: 0,
}));

export const FKTableInput = styled(InlineInput)(() => ({
  width: 120,
  flexShrink: 0,
}));

export const FKSchemaInput = styled(InlineInput)(() => ({
  width: 100,
  flexShrink: 0,
}));

export const AccSection = styled(Box)(() => ({
  marginBottom: 0,
}));

export const AccSectionHeader = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
  gap: 12,
}));

export const AccSectionTitle = styled(Typography)(() => ({
  fontSize: 14,
  fontWeight: 600,
  color: '#374151',
}));

export const AccAddButton = styled('button')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 500,
  color: '#6366f1',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 150ms ease',
  whiteSpace: 'nowrap',
  '&:hover': {
    backgroundColor: '#eef2ff',
  },
  '& svg': {
    width: 14,
    height: 14,
  },
}));

export const AccCardsContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}));

export const AccCard = styled(Box, {
  shouldForwardProp: prop => prop !== 'isExpanded',
})<{ isExpanded?: boolean }>(({ isExpanded }) => ({
  backgroundColor: isExpanded ? 'rgba(238, 242, 255, 0.3)' : '#ffffff',
  borderRadius: 12,
  border: `1px solid ${isExpanded ? '#c7d2fe' : '#e5e7eb'}`,
  overflow: 'hidden',
  transition: 'all 150ms ease',
  '&:hover': {
    borderColor: isExpanded ? '#c7d2fe' : '#d1d5db',
  },
}));

export const AccCardHeader = styled('div')(() => ({
  width: '100%',
  padding: '12px 16px',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  fontFamily: 'inherit',
  textAlign: 'left',
  transition: 'background-color 150ms ease',
  '&:hover': {
    backgroundColor: '#f9fafb',
  },
}));

export const AccCardIcon = styled(Box, {
  shouldForwardProp: prop => prop !== 'variant' && prop !== 'isExpanded',
})<{ variant?: 'index' | 'fk'; isExpanded?: boolean }>(
  ({ variant = 'index', isExpanded }) => ({
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor:
      variant === 'index'
        ? isExpanded
          ? '#bfdbfe'
          : '#dbeafe'
        : isExpanded
          ? '#ddd6fe'
          : '#ede9fe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background-color 150ms ease',
    '& svg': {
      width: 16,
      height: 16,
      color:
        variant === 'index'
          ? isExpanded
            ? '#1d4ed8'
            : '#2563eb'
          : isExpanded
            ? '#6d28d9'
            : '#7c3aed',
    },
  })
);

export const AccCardHeaderContent = styled(Box)(() => ({
  flex: 1,
  minWidth: 0,
}));

export const AccCardTitle = styled(Typography)(() => ({
  fontSize: 14,
  fontWeight: 500,
  color: '#111827',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

export const AccCardSubtitle = styled(Typography)(() => ({
  fontSize: 12,
  color: '#6b7280',
  marginTop: 2,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

export const AccCardBadge = styled('span', {
  shouldForwardProp: prop => prop !== 'variant',
})<{ variant?: 'unique' | 'non-unique' }>(({ variant = 'non-unique' }) => ({
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 10,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
  backgroundColor: variant === 'unique' ? '#d1fae5' : '#f3f4f6',
  color: variant === 'unique' ? '#065f46' : '#6b7280',
  flexShrink: 0,
}));

export const AccExpandIcon = styled('svg', {
  shouldForwardProp: prop => prop !== 'isExpanded',
})<{ isExpanded?: boolean }>(({ isExpanded }) => ({
  width: 20,
  height: 20,
  color: '#9ca3af',
  transition: 'transform 200ms ease',
  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
  flexShrink: 0,
}));

export const AccHeaderDeleteButton = styled('button')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 6,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  color: '#d1d5db',
  opacity: 1,
  transition: 'all 150ms ease',
  flexShrink: 0,
  '&:hover': {
    backgroundColor: '#fef2f2',
    color: '#ef4444',
  },
  '& svg': {
    width: 16,
    height: 16,
  },
}));

export const AccCardBody = styled(Box)(() => ({
  padding: '12px 16px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}));

export const AccFormField = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}));

export const AccFormLabel = styled('label')(() => ({
  fontSize: 12,
  fontWeight: 500,
  color: '#6b7280',
}));

export const AccFieldInput = styled('input')(() => ({
  padding: '10px 12px',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  fontSize: 14,
  fontFamily: 'inherit',
  color: '#111827',
  outline: 'none',
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

export const AccToggleContainer = styled(Box)(() => ({
  display: 'flex',
  backgroundColor: '#f3f4f6',
  borderRadius: 10,
  padding: 4,
}));

export const AccToggleOption = styled('button', {
  shouldForwardProp: prop => prop !== 'isActive',
})<{ isActive?: boolean }>(({ isActive }) => ({
  flex: 1,
  padding: '8px 16px',
  backgroundColor: isActive ? '#ffffff' : 'transparent',
  border: 'none',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 500,
  fontFamily: 'inherit',
  color: isActive ? '#111827' : '#6b7280',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  ...(isActive && {
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  }),
  '&:hover': {
    color: isActive ? '#111827' : '#374151',
  },
}));

export const AccEmptyState = styled(Box)(() => ({
  padding: '12px 16px',
  backgroundColor: '#ffffff',
  borderRadius: 12,
  border: '1px dashed #e5e7eb',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
}));

export const AccEmptyIcon = styled(Box, {
  shouldForwardProp: prop => prop !== 'variant',
})<{ variant?: 'index' | 'fk' }>(({ variant = 'index' }) => ({
  width: 32,
  height: 32,
  borderRadius: 8,
  backgroundColor: variant === 'index' ? '#eff6ff' : '#f5f3ff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  '& svg': {
    width: 16,
    height: 16,
    color: variant === 'index' ? '#93c5fd' : '#c4b5fd',
  },
}));

export const AccEmptyText = styled(Typography)(() => ({
  fontSize: 14,
  color: '#9ca3af',
  flex: 1,
}));
