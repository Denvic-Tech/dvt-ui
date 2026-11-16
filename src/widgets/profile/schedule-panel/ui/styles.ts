import { styled } from '@mui/material/styles';

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

const ROW_DIVIDER = '1px solid #EEF0F4';

// A schedule row in the token-list box: 48px, no hover background.
export const ScheduleRowRoot = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  boxSizing: 'border-box',
  height: 48,
  flexShrink: 0,
  padding: '0 8px 0 14px',
  borderBottom: ROW_DIVIDER,
  backgroundColor: '#fff',
  '&:last-of-type': { borderBottom: 'none' },
});

export const ScheduleSwitch = styled('button', {
  shouldForwardProp: prop => prop !== 'checked',
})<{ checked: boolean }>(({ checked }) => ({
  position: 'relative',
  width: 26,
  height: 16,
  flex: 'none',
  padding: 0,
  border: 'none',
  borderRadius: 8,
  backgroundColor: checked ? '#5B5BEF' : '#DCE1EA',
  cursor: 'pointer',
  transition: 'background-color 180ms ease, opacity 180ms ease',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 2,
    left: 2,
    width: 12,
    height: 12,
    borderRadius: '50%',
    backgroundColor: '#fff',
    boxShadow: '0 1px 2px rgba(20, 24, 40, 0.18)',
    transform: checked ? 'translateX(10px)' : 'none',
    transition: 'transform 180ms cubic-bezier(.3, .7, .2, 1)',
  },
  '&:focus-visible': { outline: 'none', boxShadow: '0 0 0 3px #EEF0FF' },
  '&:disabled': { opacity: 0.5, cursor: 'default' },
}));

export const ScheduleNameCell = styled('div')({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  whiteSpace: 'nowrap',
});

export const ScheduleName = styled('span', {
  shouldForwardProp: prop => prop !== 'enabled',
})<{ enabled: boolean }>(({ enabled }) => ({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: enabled ? '#1B1F2A' : '#4A5161',
  fontFamily:
    'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: 13,
  fontWeight: 400,
}));

export const ScheduleCron = styled('span')({
  width: 120,
  flex: 'none',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: '#4A5161',
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontSize: 12.5,
  fontWeight: 500,
});

export const ScheduleNextRun = styled('span', {
  shouldForwardProp: prop => prop !== 'muted',
})<{ muted: boolean }>(({ muted }) => ({
  width: 150,
  flex: 'none',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: muted ? '#9AA0AD' : '#1B1F2A',
  fontSize: 13,
}));

export const ScheduleHistory = styled('div')({
  width: 96,
  height: 16,
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
});

export const ScheduleNoRuns = styled('span')({
  color: '#9AA0AD',
  fontSize: 12.5,
  whiteSpace: 'nowrap',
});
