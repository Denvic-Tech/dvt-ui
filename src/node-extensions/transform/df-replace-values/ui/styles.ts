import {
  Alert,
  Box,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';

export const Root = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
});

export const SectionCard = styled(Box)({
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 16,
});

export const SectionHeader = styled(Box)({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 12,
});

export const SectionLabel = styled(Typography)({
  fontSize: 11,
  fontWeight: 600,
  lineHeight: 1.4,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#64748b',
  marginBottom: 4,
});

export const SectionHint = styled(Typography)({
  fontSize: 12,
  lineHeight: 1.5,
  color: '#94a3b8',
});

export const CountBadge = styled(Box)({
  width: 20,
  height: 20,
  borderRadius: '50%',
  backgroundColor: '#e0e7ff',
  color: '#6366f1',
  fontSize: 11,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

export const SelectorShell = styled(Box)({
  '& > div > button': {
    minHeight: 48,
    padding: '10px 14px',
    borderRadius: 10,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    boxShadow: 'none',
    transition: 'all 150ms ease',
  },
  '& > div > button > div': {
    minHeight: 24,
    alignItems: 'center',
  },
  '& > div > button:hover': {
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  '& > div > button:focus': {
    borderColor: '#6366f1',
    boxShadow: 'none',
  },
  '& [class*="OptionName"]': {
    fontSize: 14,
    color: '#1e293b',
  },
  '& [class*="TypeBadge"]': {
    borderRadius: 6,
  },
  '& [class*="SelectChevron"]': {
    color: '#94a3b8',
  },
});

export const RulesContainer = styled(Stack)({
  gap: 8,
});

export const ArrowIcon = styled(Box)(({ theme }) => ({
  width: 32,
  height: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#94a3b8',
  flexShrink: 0,
  marginTop: 2,
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

export const DeleteButton = styled(IconButton)({
  width: 32,
  height: 32,
  borderRadius: 8,
  color: '#94a3b8',
  flexShrink: 0,
  alignSelf: 'flex-start',
  marginTop: 6,
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#fee2e2',
    color: '#ef4444',
  },
  '&.Mui-disabled': {
    color: '#cbd5e1',
  },
  '@media (max-width: 899.95px)': {
    alignSelf: 'flex-end',
    marginTop: 0,
  },
});

export const AddRuleButton = styled('button')({
  marginTop: 12,
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '10px 16px',
  borderRadius: 10,
  border: '1px dashed #cbd5e1',
  backgroundColor: 'transparent',
  color: '#64748b',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
  fontFamily: 'inherit',
  transition: 'all 150ms ease',
  '&:hover': {
    borderColor: '#6366f1',
    color: '#6366f1',
    backgroundColor: '#f5f3ff',
  },
});

export const WarningBlock = styled(Box)({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: '12px 14px',
  backgroundColor: '#fef3c7',
  border: '1px solid #fde68a',
  borderRadius: 10,
});

export const WarningText = styled(Typography)({
  fontSize: 13,
  lineHeight: 1.5,
  color: '#92400e',
  '& strong': {
    fontWeight: 600,
  },
});

export const EditorTextField = styled(TextField)({
  flex: 1,
  '& .MuiOutlinedInput-root': {
    borderRadius: 10,
    backgroundColor: '#ffffff',
    transition: 'all 150ms ease',
    '& fieldset': {
      borderColor: '#e2e8f0',
    },
    '&:hover fieldset': {
      borderColor: '#cbd5e1',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#6366f1',
    },
    '&.Mui-focused': {
      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: '10px 14px',
    fontSize: 14,
    color: '#1e293b',
  },
  '& .MuiOutlinedInput-input::placeholder': {
    color: '#94a3b8',
    opacity: 1,
  },
  '& .MuiFormHelperText-root': {
    marginLeft: 2,
    marginRight: 2,
    marginTop: 4,
  },
});

export const ErrorAlert = styled(Alert)({
  borderRadius: 12,
  border: '1px solid #fecaca',
  backgroundColor: '#fef2f2',
});
