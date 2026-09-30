import { styled } from '@mui/material/styles';

export const WriteModePanel = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'minmax(260px, 308px) minmax(0, 1fr)',
  height: '100%',
  minHeight: 360,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 10,
  background: theme.palette.background.paper,
  overflow: 'hidden',
  '@media (max-width: 760px)': {
    gridTemplateColumns: '1fr',
    gridTemplateRows: 'auto minmax(0, 1fr)',
    minHeight: 520,
  },
}));

export const ModeSidebar = styled('div')(({ theme }) => ({
  padding: '8px 10px',
  borderRight: `1px solid ${theme.palette.divider}`,
  overflowY: 'auto',
  '@media (max-width: 760px)': {
    borderRight: 0,
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: '8px 10px',
  },
}));

export const ModeSectionLabel = styled('div')({
  color: '#9b9ba6',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  lineHeight: 1.4,
});

export const ModeOptions = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  marginTop: 8,
});

export const ModeOption = styled('label', {
  shouldForwardProp: prop => prop !== 'selected' && prop !== 'unavailable',
})<{ selected: boolean; unavailable: boolean }>(
  ({ selected, unavailable }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: 11,
    padding: '11px 10px',
    borderRadius: 10,
    background: selected ? '#efedff' : 'transparent',
    color: selected ? '#6c63ff' : '#1a1a1f',
    cursor: unavailable ? 'not-allowed' : 'pointer',
    opacity: unavailable ? 0.5 : 1,
    transition: 'background-color 150ms ease',
    '&:hover': {
      background: selected
        ? '#efedff'
        : unavailable
          ? 'transparent'
          : '#f7f7f8',
    },
    '&:has(input:focus-visible)': {
      outline: '2px solid #6c63ff',
      outlineOffset: -2,
    },
  })
);

export const ModeRadio = styled('input')({
  appearance: 'none',
  width: 15,
  height: 15,
  boxSizing: 'border-box',
  margin: '3px 0 0',
  border: '1px solid #d4d4dc',
  borderRadius: '50%',
  background: '#fff',
  flexShrink: 0,
  cursor: 'inherit',
  '&:checked': { border: '5px solid #6c63ff' },
  '&:focus': { outline: 'none' },
});

export const ModeOptionText = styled('div')({ flex: 1, minWidth: 0 });

export const ModeOptionHeading = styled('div')({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 8,
  fontFamily: 'Inter, sans-serif',
  fontSize: 15,
  fontWeight: 600,
  lineHeight: 1.4,
  '& code': {
    fontFamily: 'ui-monospace, Consolas, monospace',
    fontSize: 11.5,
    fontWeight: 400,
    color: '#b9b9c5',
  },
  'input:checked + div & code': { color: '#6c63ff' },
});

export const ModeOptionHint = styled('div')({
  fontFamily: 'Inter, sans-serif',
  marginTop: 1,
  color: '#9b9ba6',
  fontSize: 13,
  lineHeight: 1.4,
});

export const ModeDetails = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  minHeight: 0,
  overflow: 'auto',
  overscrollBehavior: 'contain',
  padding: '20px 22px',
  gap: 24,
  '@media (max-width: 1000px)': { padding: '18px 16px' },
});

export const ModeDetailsTitle = styled('div')({
  display: 'flex',
  alignItems: 'baseline',
  flexWrap: 'wrap',
  gap: 9,
  color: '#1a1a1f',
  fontFamily: 'Inter, sans-serif',
  fontSize: 18,
  fontWeight: 600,
  '& span': { color: '#9b9ba6', fontSize: 13, fontWeight: 400 },
  '& code': {
    color: '#6b6b76',
    fontFamily: 'Inter, sans-serif',
    fontSize: 15,
    fontWeight: 400,
    overflowWrap: 'anywhere',
  },
});

export const ModeDescription = styled('p')({
  fontFamily: 'Inter, sans-serif',
  margin: '3px 0 0',
  color: '#6b6b76',
  fontSize: 15,
  lineHeight: 1.65,
});

export const ModeKeyField = styled('div')({
  marginTop: 20,
  maxWidth: 440,
  '& > label': {
    display: 'block',
    marginBottom: 6,
    color: '#9b9ba6',
    fontSize: 11,
    fontWeight: 600,
  },
});

export const ModeExample = styled('section')({
  marginTop: 8,
  flexShrink: 0,
  minWidth: 0,
});

export const ExampleHeading = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 8,
});

export const ExampleLegend = styled('div')({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 12,
  color: '#9b9ba6',
  fontSize: 12,
});

export const LegendItem = styled('span', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: 'added' | 'removed' | 'updated' }>(({ tone }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  '&::before': {
    content: '""',
    width: 8,
    height: 8,
    borderRadius: 2,
    background:
      tone === 'added' ? '#15803d' : tone === 'updated' ? '#d97706' : '#dc2626',
  },
}));

export const ExampleGrid = styled('div')({
  display: 'grid',
  gridTemplateColumns:
    'minmax(150px, 1fr) 12px minmax(150px, 1fr) 12px minmax(150px, 1fr)',
  gap: 8,
  overflowX: 'auto',
  paddingBottom: 1,
});

export const ExampleOperator = styled('span')({
  alignSelf: 'center',
  justifySelf: 'center',
  color: '#c0c0c8',
  fontSize: 17,
  fontWeight: 600,
});

export const ExampleCard = styled('div', {
  shouldForwardProp: prop => prop !== 'muted',
})<{ muted?: boolean }>(({ muted }) => ({
  minWidth: 0,
  minHeight: 236,
  border: '1px solid #e5e5eb',
  borderRadius: 8,
  overflow: 'hidden',
  background: '#fff',
  opacity: muted ? 0.5 : 1,
}));

export const ExampleCardTitle = styled('div')({
  padding: '8px 11px',
  background: '#f7f7f8',
  borderBottom: '1px solid #e5e5eb',
  color: '#6b6b76',
  fontFamily: 'Inter, sans-serif',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 1.4,
});

export const ExampleTable = styled('table')({
  width: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'fixed',
  fontFamily: 'ui-monospace, Consolas, monospace',
  fontSize: 11.5,
  color: '#6b6b76',
  '& th, & td': {
    padding: '6px 10px',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    borderBottom: '1px solid #e5e5eb',
    lineHeight: 1.4,
  },
  '& th': { color: '#c0c0c8', fontWeight: 500 },
  '& th:last-child': { width: '40%' },
  '& tbody tr:last-child td': { borderBottom: 0 },
  '@media (max-width: 1100px)': {
    fontSize: 10.5,
    '& th, & td': { padding: '6px' },
  },
});

export const ExampleRow = styled('tr', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone?: 'added' | 'removed' | 'updated' | undefined }>(({ tone }) => ({
  background:
    tone === 'added'
      ? '#eef8f1'
      : tone === 'updated'
        ? '#fff8eb'
        : tone === 'removed'
          ? '#fef2f2'
          : 'transparent',
  color:
    tone === 'added'
      ? '#15803d'
      : tone === 'updated'
        ? '#b86b07'
        : tone === 'removed'
          ? '#b91c1c'
          : 'inherit',
  textDecoration: tone === 'removed' ? 'line-through' : 'none',
}));

export const ExampleNote = styled('p')({
  margin: '8px 0 0',
  color: '#b86b07',
  fontSize: 12.5,
  lineHeight: 1.5,
});
