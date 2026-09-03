import { Dialog } from '@mui/material';
import { keyframes, styled } from '@mui/material/styles';

// Цветовая палитра из CleanMinimalDesignSystem.md
export const colors = {
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray700: '#374151',
  gray800: '#1f2937',
  indigo100: '#e0e7ff',
  indigo500: '#6366f1',
  indigo600: '#4f46e5',
  red100: '#fee2e2',
  red500: '#ef4444',
  amber100: '#fef3c7',
  amber500: '#f59e0b',
  blue100: '#dbeafe',
  blue500: '#3b82f6',
  blue700: '#1d4ed8',
};

// Основной контейнер теперь всегда на всю ширину
export const Container = styled('div')(() => ({
  backgroundColor: colors.white,
  borderRadius: 16, // radius: 16px (3xl) по системе
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  overflow: 'hidden',
  width: '100%',
  minHeight: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

export const Header = styled('div')(() => ({
  padding: '16px 20px',
  borderBottom: `1px solid ${colors.gray100}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

export const HeaderTitle = styled('h2')(() => ({
  margin: 0,
  fontSize: 14,
  fontWeight: 600,
  color: colors.gray800,
}));

export const Content = styled('div')(() => ({
  padding: 16,
  flex: 1,
}));

export const Footer = styled('div')(() => ({
  padding: '12px 16px',
  borderTop: `1px solid ${colors.gray100}`,
  backgroundColor: 'rgba(249, 250, 251, 0.5)',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
}));

export const Section = styled('div')(() => ({
  padding: 16,
  backgroundColor: colors.gray50,
  borderRadius: 12,
  width: '100%',
}));

export const IconWrapper = styled('div')<{ variant?: 'default' | 'primary' }>(
  ({ variant = 'default' }) => ({
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: variant === 'primary' ? colors.indigo100 : colors.gray100,
    color: variant === 'primary' ? colors.indigo500 : colors.gray500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  })
);

export const PrimaryButton = styled('button')(() => ({
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 500,
  color: colors.white,
  backgroundColor: colors.indigo500,
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  transition: 'background-color 150ms ease',
  '&:hover': { backgroundColor: colors.indigo600 },
  '&:disabled': { backgroundColor: colors.gray200, cursor: 'not-allowed' },
}));

export const IconButton = styled('button')(() => ({
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 8,
  color: colors.gray400,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '&:hover': { backgroundColor: colors.gray100, color: colors.gray700 },
}));

export const Label = styled('label')(() => ({
  display: 'block',
  fontSize: 11,
  fontWeight: 500,
  color: colors.gray500,
  marginBottom: 6,
}));

export const Input = styled('input')(() => ({
  width: '100%',
  padding: '8px 12px',
  fontSize: 13,
  color: colors.gray700,
  border: `1px solid ${colors.gray200}`,
  borderRadius: 8,
  outline: 'none',
  '&:focus': {
    borderColor: '#a5b4fc',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
}));

export const RetrySection = styled('section')(() => ({
  paddingTop: 2,
}));

export const RetryToggleRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
}));

export const RetryToggleCopy = styled('div')(() => ({
  minWidth: 0,
}));

export const RetryToggleTitle = styled('div')(() => ({
  fontSize: 13,
  fontWeight: 600,
  color: colors.gray700,
}));

export const RetryToggleDescription = styled('div')(() => ({
  marginTop: 3,
  fontSize: 11,
  lineHeight: 1.4,
  color: colors.gray400,
}));

export const RetrySettingsGrid = styled('div')(() => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
  marginTop: 16,
  '@media (max-width: 520px)': {
    gridTemplateColumns: '1fr',
  },
}));

export const RetryField = styled('div')(() => ({
  minWidth: 0,
}));

export const RetryFieldLabel = styled(Label)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  width: 'fit-content',
}));

export const RetryHelpIcon = styled('span')(() => ({
  width: 14,
  height: 14,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  color: colors.gray400,
  cursor: 'help',
  borderRadius: '50%',
  outline: 'none',
  '&:hover, &:focus-visible': {
    color: colors.gray700,
  },
}));

export const Badge = styled('span')<{ variant?: 'info' | 'warning' }>(
  ({ variant = 'info' }) => ({
    padding: '2px 8px',
    fontSize: 10,
    fontWeight: 600,
    borderRadius: 6,
    backgroundColor: variant === 'info' ? colors.blue100 : colors.amber100,
    color: variant === 'info' ? colors.blue700 : colors.amber500,
  })
);

export const Pill = styled('span')(() => ({
  borderRadius: 9999,
  padding: '4px 10px',
  backgroundColor: colors.gray100,
  color: colors.gray500,
  fontSize: 10,
  fontWeight: 600,
}));

export const TrafficLights = styled('div')(() => ({
  display: 'flex',
  gap: 6,
}));

export const TrafficLight = styled('div')<{
  color: 'red' | 'yellow' | 'green';
}>(({ color }) => ({
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor:
    color === 'red' ? '#f87171' : color === 'yellow' ? '#fbbf24' : '#4ade80',
}));

export const CronContainer = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 16,
  backgroundColor: colors.gray50,
  borderRadius: 12,
  border: `1px solid ${colors.gray200}`,
}));

export const GridContainer = styled('div')(() => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
  gap: 8,
  marginTop: 8,
}));

export const GridItem = styled('button')<{ selected?: boolean }>(
  ({ selected }) => ({
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 6,
    border: `1px solid ${selected ? colors.indigo500 : colors.gray200}`,
    backgroundColor: selected ? colors.indigo500 : colors.white,
    color: selected ? colors.white : colors.gray700,
    cursor: 'pointer',
    transition: 'all 0.1s ease',
    '&:hover': {
      borderColor: colors.indigo500,
      backgroundColor: selected ? colors.indigo600 : colors.indigo100,
      color: selected ? colors.white : colors.indigo600,
    },
  })
);

export const TabsContainer = styled('div')(() => ({
  display: 'flex',
  gap: 4,
  padding: 4,
  backgroundColor: colors.gray100,
  borderRadius: 8,
  marginBottom: 12,
  minWidth: 0,
  overflow: 'hidden',
}));

export const Tab = styled('button')<{ active?: boolean }>(({ active }) => ({
  flex: '1 1 0',
  minWidth: 0,
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 600,
  border: 'none',
  borderRadius: 6,
  backgroundColor: active ? colors.white : 'transparent',
  color: active ? colors.indigo600 : colors.gray500,
  boxShadow: active ? '0 2px 8px rgba(15, 23, 42, 0.08)' : 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  '&:hover': {
    color: colors.indigo600,
  },
}));

export const TimeInputGroup = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}));

export const PanelHeader = styled('div')(() => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 4,
  flexWrap: 'wrap',
  padding: '4px 8px 16px',
  '@media (max-width: 900px)': {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
}));

export const PanelHeaderCopy = styled('div')(() => ({
  minWidth: 0,
}));

export const PanelTitle = styled('h3')(() => ({
  margin: 0,
  fontSize: 20,
  lineHeight: 1.2,
  fontWeight: 700,
  color: '#111827',
  marginBottom: 4,
}));

export const PanelDescription = styled('p')(() => ({
  margin: 0,
  fontSize: 14,
  lineHeight: 1.5,
  color: '#6b7280',
}));

export const CreateActionButton = styled('button')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '10px 16px',
  backgroundColor: '#6366f1',
  border: 'none',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.2,
  color: '#ffffff',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#4f46e5',
  },
  '&:disabled': {
    backgroundColor: '#d1d5db',
    color: '#f9fafb',
    cursor: 'not-allowed',
  },
}));

export const ScheduleList = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}));

export const SchedulerWarning = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '14px 16px',
  borderRadius: 14,
  border: '1px solid #fecaca',
  backgroundColor: '#fff5f5',
  marginBottom: 16,
}));

export const SchedulerWarningTitle = styled('div')(() => ({
  fontSize: 14,
  fontWeight: 600,
  color: '#991b1b',
}));

export const SchedulerWarningText = styled('div')(() => ({
  fontSize: 13,
  lineHeight: 1.5,
  color: '#7f1d1d',
}));

export const ScheduleCard = styled('div')<{ disabled?: boolean }>(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  padding: '14px 16px',
  borderRadius: 14,
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  transition: 'all 150ms ease',
}));

export const ScheduleTopRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  '@media (max-width: 720px)': {
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
}));

export const CalendarIconBox = styled('div')<{ active?: boolean }>(
  ({ active }) => ({
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: active ? '#eef2ff' : '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  })
);

export const InfoBlock = styled('div')(() => ({
  flex: 1,
  minWidth: 0,
}));

export const NameRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 4,
  minWidth: 0,
  flexWrap: 'wrap',
}));

export const ScheduleName = styled('span')(() => ({
  fontSize: 14,
  fontWeight: 600,
  color: '#111827',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const ModePill = styled('span')(() => ({
  padding: '2px 8px',
  borderRadius: 6,
  fontSize: 10,
  fontWeight: 500,
  color: '#6366f1',
  backgroundColor: '#eef2ff',
  textTransform: 'lowercase',
}));

export const MetaRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
}));

export const CronText = styled('span')(() => ({
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontSize: 12,
  color: '#6b7280',
}));

export const InlineDivider = styled('span')(() => ({
  width: 1,
  height: 12,
  backgroundColor: '#e5e7eb',
}));

export const NextRunText = styled('span')<{ active?: boolean }>(
  ({ active }) => ({
    fontSize: 11,
    fontWeight: 500,
    color: active ? '#10b981' : '#9ca3af',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
    whiteSpace: 'nowrap',
  })
);

export const NextRunValue = styled('span')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  whiteSpace: 'nowrap',
}));

export const ToggleTrack = styled('button')<{ enabled?: boolean }>(
  ({ enabled }) => ({
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: enabled ? '#6366f1' : '#d1d5db',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background-color 200ms ease',
    flexShrink: 0,
    border: 'none',
    padding: 0,
  })
);

export const ToggleThumb = styled('span')<{ enabled?: boolean }>(
  ({ enabled }) => ({
    width: 14,
    height: 14,
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    position: 'absolute',
    top: 3,
    left: enabled ? 19 : 3,
    transition: 'left 200ms ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
  })
);

export const ActionsDivider = styled('div')(() => ({
  width: 1,
  height: 28,
  backgroundColor: '#e5e7eb',
  flexShrink: 0,
}));

export const ActionsRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 2,
}));

export const ScheduleActionButton = styled('button')<{ danger?: boolean }>(
  ({ danger }) => ({
    padding: 6,
    borderRadius: 8,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    transition: 'all 150ms ease',
    '&:hover': {
      backgroundColor: danger ? '#fef2f2' : '#f3f4f6',
    },
  })
);

export const ActionsGroup = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginLeft: 'auto',
  '@media (max-width: 720px)': {
    width: '100%',
    justifyContent: 'flex-end',
  },
}));

export const ScheduleBottomRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  paddingTop: 12,
  marginTop: 12,
  borderTop: '1px dashed #f3f4f6',
  minWidth: 0,
  '@media (max-width: 720px)': {
    justifyContent: 'flex-end',
  },
}));

export const HistorySection = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
  flex: 1,
  '@media (max-width: 720px)': {
    display: 'none',
  },
}));

export const HistoryLabel = styled('span')(() => ({
  fontSize: 11,
  fontWeight: 600,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  flexShrink: 0,
}));

export const RunCirclesViewport = styled('div')(() => ({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
}));

export const RunCirclesRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  minWidth: 'max-content',
}));

const pulse = keyframes({
  '0%, 100%': {
    opacity: 1,
  },
  '50%': {
    opacity: 0.6,
  },
});

export const RunCircleButton = styled('button', {
  shouldForwardProp: prop =>
    !['statusColor', 'statusColorHover', 'isRunning'].includes(prop as string),
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
  animation: isRunning ? `${pulse} 1.5s ease-in-out infinite` : 'none',
  '&:hover': {
    backgroundColor: statusColorHover,
  },
}));

export const LastRunInfoBlock = styled('div')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
  color: '#6b7280',
  marginLeft: 'auto',
  minWidth: 0,
  whiteSpace: 'nowrap',
  '@media (max-width: 720px)': {
    marginLeft: 0,
    width: '100%',
    justifyContent: 'flex-end',
  },
}));

export const StatusDot = styled('span', {
  shouldForwardProp: prop => prop !== 'statusColor',
})<{
  statusColor: string;
}>(({ statusColor }) => ({
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: statusColor,
  flexShrink: 0,
}));

export const LastRunDuration = styled('span')(() => ({
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
}));

export const LastRunSeparator = styled('span')(() => ({
  color: '#d1d5db',
}));

export const NoRunsHint = styled('span')(() => ({
  fontSize: 12,
  color: '#9ca3af',
  marginLeft: 'auto',
}));

export const RunDetailsDialog = styled(Dialog)(() => ({
  '& .MuiDialog-paper': {
    width: '100%',
    maxWidth: 480,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
    margin: 20,
  },
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(4px)',
  },
}));

export const RunDetailsHeader = styled('div')(() => ({
  padding: '16px 20px',
  borderBottom: '1px solid #f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
}));

export const RunDetailsHeaderMeta = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0,
}));

export const RunDetailsStatusBadge = styled('span', {
  shouldForwardProp: prop => prop !== 'statusColor',
})<{
  statusColor: string;
}>(({ statusColor }) => ({
  padding: '4px 10px',
  backgroundColor: statusColor,
  color: '#ffffff',
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.4,
  textTransform: 'uppercase',
  border: 'none',
  flexShrink: 0,
}));

export const RunDetailsCount = styled('span')(() => ({
  fontSize: 13,
  color: '#6b7280',
  fontWeight: 500,
}));

export const RunDetailsBody = styled('div')(() => ({
  maxHeight: 400,
  overflowY: 'auto',
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}));

export const RunCard = styled('div')(() => ({
  padding: 12,
  backgroundColor: '#f9fafb',
  border: '1px solid #f3f4f6',
  borderRadius: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}));

export const RunCardTopRow = styled('div')(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8,
}));

export const RunTaskId = styled('span')(() => ({
  fontSize: 11,
  fontWeight: 600,
  color: '#6b7280',
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const RunDuration = styled('span')(() => ({
  fontSize: 11,
  color: '#059669',
  fontWeight: 600,
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  flexShrink: 0,
}));

export const RunTimeGrid = styled('div')(() => ({
  display: 'flex',
  gap: 12,
  fontSize: 11,
  color: '#6b7280',
  flexWrap: 'wrap',
}));

export const RunTimeBlock = styled('div')(() => ({
  '& > .label': {
    color: '#9ca3af',
    marginBottom: 2,
  },
  '& > .value': {
    color: '#111827',
    fontWeight: 500,
  },
}));

export const RunErrorBlock = styled('div')(() => ({
  marginTop: 4,
  padding: 8,
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 8,
  fontSize: 11,
  color: '#dc2626',
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  lineHeight: 1.5,
  wordBreak: 'break-word',
}));

export const RunReasonText = styled('div')(() => ({
  fontSize: 11,
  color: '#9ca3af',
  '& > .value': {
    color: '#6b7280',
    fontWeight: 500,
  },
}));

export const ProjectSelectButton = styled('button')<{ disabled?: boolean }>(
  ({ disabled }) => ({
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    fontSize: 13,
    outline: 'none',
    backgroundColor: disabled ? '#f9fafb' : '#ffffff',
    color: disabled ? '#9ca3af' : '#111827',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    textAlign: 'left',
  })
);

export const ProjectSelectText = styled('span')<{ placeholder?: boolean }>(
  ({ placeholder }) => ({
    color: placeholder ? '#6b7280' : '#111827',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
    flex: 1,
    cursor: 'inherit',
  })
);

export const ChevronIcon = styled('span')<{ open?: boolean; hidden?: boolean }>(
  ({ open, hidden }) => ({
    width: 18,
    height: 18,
    display: hidden ? 'none' : 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 150ms ease',
    flexShrink: 0,
    cursor: 'inherit',
  })
);

export const ProjectMenuContent = styled('div')(() => ({
  padding: 6,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}));

export const ProjectSearchWrap = styled('div')(() => ({
  padding: 2,
}));

export const ProjectSearchInput = styled('input')(() => ({
  width: '100%',
  padding: '9px 12px',
  borderRadius: 10,
  border: `1px solid ${colors.gray200}`,
  backgroundColor: '#ffffff',
  color: '#111827',
  fontSize: 13,
  outline: 'none',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
  '&::placeholder': {
    color: colors.gray400,
  },
  '&:focus': {
    borderColor: '#a5b4fc',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
}));

export const ProjectMenuScrollArea = styled('div')(() => ({
  maxHeight: 260,
  overflowY: 'auto',
  paddingRight: 2,
}));

export const ProjectMenuEmptyState = styled('div')(() => ({
  padding: '14px 12px',
  fontSize: 13,
  lineHeight: 1.5,
  color: colors.gray500,
  textAlign: 'center',
}));

export const ProjectMenuButton = styled('button')<{ selected?: boolean }>(
  ({ selected }) => ({
    width: '100%',
    border: 'none',
    backgroundColor: selected ? '#eef2ff' : 'transparent',
    borderRadius: 10,
    padding: '10px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    textAlign: 'left',
    transition: 'background-color 150ms ease',
    '&:hover': {
      backgroundColor: selected ? '#e0e7ff' : '#f9fafb',
    },
  })
);

export const ProjectMenuLabel = styled('span')(() => ({
  minWidth: 0,
  flex: 1,
  color: '#111827',
  fontSize: 13,
  fontWeight: 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const ProjectAuthorBadge = styled('span')(() => ({
  padding: '2px 8px',
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 600,
  color: '#6b7280',
  backgroundColor: '#f3f4f6',
  flexShrink: 0,
  maxWidth: 150,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));
