import { alpha, Box, styled, Typography } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

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
})<{ hasError?: boolean }>(
  ({ theme, hasError }) => ({
    border: `1px solid ${
      hasError ? theme.palette.error.main : theme.palette.divider
    }`,
    borderRadius: 8,
    overflow: 'visible',
    backgroundColor: theme.palette.background.paper,
    transition: 'border-color 0.2s ease',
  })
);

export const AccordionHeader = styled('button', {
  shouldForwardProp: prop => prop !== 'isOpen',
})<{ isOpen?: boolean }>(
  ({ theme, isOpen }) => ({
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
  })
);

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
})<{ isOpen?: boolean }>(
  ({ theme, isOpen }) => ({
    fontSize: '0.875rem',
    fontWeight: 500,
    color: isOpen ? theme.palette.text.primary : theme.palette.text.secondary,
  })
);

export const CollapsedValue = styled(Typography, {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone?: 'info' | 'warning' }>(({ theme, tone = 'info' }) => ({
  fontSize: '0.75rem',
  color: tone === 'warning' ? theme.palette.warning.main : theme.palette.primary.main,
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

export const TableBrowserContainer = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 8,
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
  fontFamily:
    '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
  fontWeight: 400,
  color: '#b91c1c',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  margin: 0,
  lineHeight: 1.7,
}));
