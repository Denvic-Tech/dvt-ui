import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  History as LagIcon,
  SettingsEthernet as StepsIcon,
} from '@mui/icons-material';

export const PaddedContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0.5),
}));

export const EditorRoot = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  padding: theme.spacing(0.5),
  height: '100%',
  minHeight: 0,
}));

export const ColumnsSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  flex: 1,
  minHeight: 0,
}));

export const ParamsSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
}));

export const CleanCard = styled('div')(() => ({
  border: '1px solid #f3f4f6',
  borderRadius: 12,
  backgroundColor: '#ffffff',
  overflow: 'hidden',
}));

export const FlexCleanCard = styled(CleanCard)(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
}));

export const SectionLabel = styled(Typography)(() => ({
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#9ca3af',
}));

export const SectionLabelRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  paddingLeft: 4,
}));

export const CardBody = styled('div')(() => ({
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
}));

export const SelectorWrapper = styled('div')(() => ({
  flex: 1,
  minHeight: 0,
}));

export const ErrorBanner = styled('div')(() => ({
  padding: '10px 12px',
  borderRadius: 10,
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#b91c1c',
  fontSize: 12,
  fontWeight: 500,
}));

export const ErrorList = styled('ul')(() => ({
  margin: 0,
  paddingLeft: '1.2rem',
}));

export const InfoBanner = styled('div')(() => ({
  padding: '10px 12px',
  borderRadius: 10,
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  color: '#1d4ed8',
  fontSize: 12,
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}));

export const MutedLagIcon = styled(LagIcon)(() => ({
  color: '#9ca3af',
  fontSize: 16,
}));

export const MutedStepsIcon = styled(StepsIcon)(() => ({
  color: '#9ca3af',
  fontSize: 16,
}));
