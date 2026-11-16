import { ButtonBase, keyframes, styled } from '@mui/material';

const FONT_FAMILY =
  'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const MONO_FONT_FAMILY =
  '"JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace';

const DIVIDER = '1px solid #EEF0F4';

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const dialogPaperSx = {
  width: 'min(980px, calc(100vw - 32px))',
  maxWidth: 'none',
  maxHeight: 'calc(100vh - 32px)',
  m: 2,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: '16px',
  backgroundColor: '#fff',
  backgroundImage: 'none',
  boxShadow:
    '0 24px 64px rgba(20, 24, 40, 0.18), 0 0 0 1px rgba(20, 24, 40, 0.04)',
  fontFamily: FONT_FAMILY,
  color: '#1B1F2A',
} as const;

export const dialogBackdropSx = {
  backdropFilter: 'blur(7px)',
  backgroundColor: 'rgba(15, 23, 42, 0.38)',
} as const;

export const ModalHeader = styled('header')({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexShrink: 0,
  padding: '18px 24px',
  borderBottom: DIVIDER,
});

export type HeaderTone = 'run' | 'error' | 'done';

const HEADER_TONES: Record<HeaderTone, { background: string; color: string }> =
  {
    run: { background: '#EEF0FF', color: '#5B5BEF' },
    error: { background: '#FDECEC', color: '#E5484D' },
    done: { background: '#E6F6EE', color: '#1E9E63' },
  };

export const HeaderTile = styled('span', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: HeaderTone }>(({ tone }) => ({
  width: 40,
  height: 40,
  flex: '0 0 40px',
  display: 'grid',
  placeItems: 'center',
  borderRadius: 11,
  backgroundColor: HEADER_TONES[tone].background,
  color: HEADER_TONES[tone].color,
}));

export const HeaderText = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
});

export const HeaderTitle = styled('h2')({
  margin: 0,
  fontSize: 16,
  lineHeight: '20px',
  fontWeight: 600,
});

export const HeaderSubtitle = styled('span')({
  fontSize: 13,
  lineHeight: '18px',
  color: '#6B7385',
  fontVariantNumeric: 'tabular-nums',
});

export const HeaderAside = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexShrink: 0,
  marginLeft: 'auto',
});

export const HeaderCounter = styled('span')({
  fontSize: 12.5,
  color: '#9AA0AD',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
});

export const HeaderButton = styled(ButtonBase)({
  height: 34,
  padding: '0 14px',
  borderRadius: 9,
  backgroundColor: '#F1F3F8',
  color: '#3A4152',
  fontFamily: FONT_FAMILY,
  fontSize: 13,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  transition: 'background-color 140ms ease',
  '&:hover': { backgroundColor: '#E8EBF2' },
  '&.Mui-focusVisible': { boxShadow: '0 0 0 2px #A5B4FC' },
});

export type NoticeTone = 'error' | 'warning';

const NOTICE_TONES: Record<NoticeTone, { background: string; color: string }> =
  {
    error: { background: '#FEF5F5', color: '#B42318' },
    warning: { background: '#FFF8EB', color: '#B54708' },
  };

export const StatusNotice = styled('div', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: NoticeTone }>(({ tone }) => ({
  flexShrink: 0,
  margin: '16px 24px 0',
  padding: '10px 14px',
  borderRadius: 10,
  backgroundColor: NOTICE_TONES[tone].background,
  color: NOTICE_TONES[tone].color,
  fontSize: 13,
  lineHeight: '18px',
  fontWeight: 500,
  wordBreak: 'break-word',
}));

export const ModalBody = styled('div')({
  display: 'grid',
  gridTemplateColumns: '400px minmax(0, 1fr)',
  alignItems: 'stretch',
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
  '@media (max-width: 860px)': {
    gridTemplateColumns: 'minmax(0, 1fr)',
  },
});

export const StepList = styled('ol')({
  margin: 0,
  padding: '12px 24px 4px',
  listStyle: 'none',
});

export const StepRow = styled('li')({
  position: 'relative',
  display: 'flex',
  gap: 12,
  padding: '8px 0',
  // The line to the next step's icon.
  '&:not(:last-of-type)::after': {
    content: '""',
    position: 'absolute',
    left: 7.5,
    top: 27,
    bottom: -9,
    width: 1,
    backgroundColor: '#EEF0F4',
  },
});

export const StepIcon = styled('span')({
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  placeItems: 'center',
  width: 16,
  height: 16,
  flex: '0 0 16px',
  marginTop: 1,
});

export const StepSpinner = styled('span')({
  width: 14,
  height: 14,
  boxSizing: 'border-box',
  borderRadius: '50%',
  border: '1.8px solid #DCDDFB',
  borderTopColor: '#5B5BEF',
  animation: `${spin} 0.8s linear infinite`,
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
});

export const StepText = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
});

export type StepTone = 'pending' | 'running' | 'done' | 'failed';

const STEP_NAME_TONES: Record<StepTone, { color: string; weight: number }> = {
  pending: { color: '#9AA0AD', weight: 400 },
  running: { color: '#1B1F2A', weight: 500 },
  done: { color: '#4A5161', weight: 500 },
  failed: { color: '#B42318', weight: 500 },
};

export const StepName = styled('span', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: StepTone }>(({ tone }) => ({
  fontSize: 13.5,
  lineHeight: '18px',
  fontWeight: STEP_NAME_TONES[tone].weight,
  color: STEP_NAME_TONES[tone].color,
}));

export const StepDetail = styled('span')({
  fontSize: 12.5,
  lineHeight: '17px',
  color: '#9AA0AD',
});

export const StepsPending = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 0',
  fontSize: 13,
  lineHeight: '18px',
  color: '#6B7385',
});

export const LogColumn = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  padding: '20px 24px 0 0',
  '@media (max-width: 860px)': {
    padding: '12px 24px 0',
  },
});

// Marks the copy button, so the log shows it on hover.
export const LOG_COPY_BUTTON_CLASS = 'system-update-log-copy';

export const LogWrap = styled('div')({
  position: 'relative',
  flex: 1,
  minHeight: 420,
  [`&:hover .${LOG_COPY_BUTTON_CLASS}`]: { opacity: 1 },
});

export const LogScroll = styled('div')({
  position: 'absolute',
  inset: 0,
  boxSizing: 'border-box',
  padding: '12px 14px',
  borderRadius: 10,
  backgroundColor: '#F7F8FA',
  fontFamily: MONO_FONT_FAMILY,
  fontSize: 11.5,
  lineHeight: '18px',
  color: '#4A5161',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  overflowY: 'auto',
  overflowAnchor: 'none',
  scrollbarWidth: 'thin',
  scrollbarColor: '#D3D8E2 transparent',
});

export const LogCommand = styled('div')({ color: '#4343D6' });

export const LogLine = styled('div', {
  shouldForwardProp: prop => prop !== 'error',
})<{ error: boolean }>(({ error }) => ({
  minHeight: 18,
  ...(error ? { color: '#B42318' } : {}),
}));

export const LogCopyButton = styled(ButtonBase)({
  position: 'absolute',
  top: 8,
  right: 8,
  width: 26,
  height: 26,
  borderRadius: 7,
  color: '#8C93A3',
  opacity: 0,
  transition: 'opacity 150ms ease, background-color 150ms ease',
  '&.Mui-focusVisible': { opacity: 1 },
  '&:hover': { backgroundColor: '#EEF0F4', color: '#1B1F2A' },
});

export const LogJumpButton = styled(ButtonBase)({
  position: 'absolute',
  left: '50%',
  bottom: 10,
  transform: 'translateX(-50%)',
  gap: 5,
  height: 26,
  padding: '0 10px',
  borderRadius: 13,
  backgroundColor: '#1B1F2A',
  color: '#fff',
  fontFamily: FONT_FAMILY,
  fontSize: 12,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  boxShadow: '0 4px 12px rgba(20, 24, 40, 0.18)',
  '&.Mui-focusVisible': { boxShadow: '0 0 0 2px #A5B4FC' },
});

export const StepsColumn = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
});

// Sits at the bottom of the steps column, level with the log's bottom edge.
export const StepsNote = styled('p')({
  margin: 'auto 0 0',
  padding: '16px 24px 0',
  fontSize: 12.5,
  lineHeight: '18px',
  color: '#9AA0AD',
});

export const ModalEndSpacer = styled('div')({
  flexShrink: 0,
  height: 24,
});
