import { styled } from '@mui/material/styles';

export const colors = {
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  indigo50: '#eef2ff',
  indigo100: '#e0e7ff',
  indigo500: '#6366f1',
  amber50: '#fffbeb',
  amber500: '#f59e0b',
  red500: '#ef4444',
};

export const Root = styled('div')(() => ({
  width: '100%',
  minHeight: '100%',
}));

export const Section = styled('section')(() => ({
  width: '100%',
}));

export const ProjectField = styled('div')(() => ({
  marginBottom: 18,
}));

export const FieldLabel = styled('div')(() => ({
  fontSize: 13,
  fontWeight: 500,
  color: colors.gray700,
  marginBottom: 6,
}));

export const FieldHint = styled('div')(() => ({
  fontSize: 12,
  color: colors.gray400,
  marginTop: 4,
}));

export const PolicyFields = styled('div')(() => ({
  display: 'grid',
  gap: 16,
  marginTop: 16,
}));

export const PolicyField = styled('div')(() => ({
  minWidth: 0,
}));

export const HelperText = styled('p')<{ error?: boolean }>(({ error }) => ({
  margin: '8px 0 0',
  fontSize: 12,
  lineHeight: 1.5,
  color: error ? colors.red500 : colors.gray500,
}));

export const ToggleCard = styled('div')<{
  active?: boolean;
  activeColor?: 'indigo' | 'amber';
}>(({ active, activeColor = 'indigo' }) => {
  const palette = {
    indigo: { bg: colors.indigo50, border: colors.indigo500 },
    amber: { bg: colors.amber50, border: colors.amber500 },
  };
  const current = palette[activeColor];

  return {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: active ? current.bg : colors.white,
    border: `1px solid ${active ? current.border : colors.gray200}`,
    transition: 'all 150ms ease',
  };
});

export const ToggleRow = styled('div')(() => ({
  padding: '14px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
}));

export const ToggleContent = styled('div')(() => ({
  minWidth: 0,
  flex: 1,
}));

export const ToggleLabel = styled('div')(() => ({
  fontSize: 14,
  fontWeight: 600,
  color: colors.gray800,
}));

export const ToggleDescription = styled('div')(() => ({
  fontSize: 12,
  color: colors.gray500,
  marginTop: 2,
}));

export const ToggleConstraintMessage = styled('div')(() => ({
  fontSize: 12,
  lineHeight: 1.4,
  color: colors.indigo500,
  marginTop: 6,
}));

export const ExpandableArea = styled('div')(() => ({
  padding: '14px 16px 16px',
  borderTop: `1px solid ${colors.indigo100}`,
}));

export const ToggleTrackButton = styled('button')<{ enabled?: boolean }>(
  ({ enabled }) => ({
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: enabled ? colors.indigo500 : colors.gray300,
    cursor: 'pointer',
    position: 'relative',
    transition: 'background-color 200ms ease',
    flexShrink: 0,
    border: 'none',
    padding: 0,
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.65,
    },
  })
);

export const ToggleThumb = styled('div')<{ enabled?: boolean }>(
  ({ enabled }) => ({
    width: 16,
    height: 16,
    borderRadius: '50%',
    backgroundColor: colors.white,
    position: 'absolute',
    top: 3,
    left: enabled ? 21 : 3,
    transition: 'left 200ms ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
  })
);

export const TextInput = styled('input')(() => ({
  width: '100%',
  padding: '10px 14px',
  backgroundColor: colors.gray50,
  border: `1px solid ${colors.gray200}`,
  borderRadius: 12,
  fontSize: 14,
  color: colors.gray800,
  outline: 'none',
  transition: 'all 150ms ease',
  boxSizing: 'border-box',
  '&:focus': {
    backgroundColor: colors.white,
    borderColor: colors.indigo500,
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
  },
  '&::placeholder': {
    color: colors.gray400,
  },
}));

export const ProjectSelectButton = styled('button')<{
  disabled?: boolean;
  error?: boolean;
}>(({ disabled, error }) => ({
  width: '100%',
  padding: '11px 14px',
  borderRadius: 12,
  border: `1px solid ${error ? colors.red500 : colors.gray200}`,
  fontSize: 14,
  outline: 'none',
  backgroundColor: disabled ? colors.gray50 : colors.white,
  color: disabled ? colors.gray400 : colors.gray900,
  cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  textAlign: 'left',
  boxShadow: error ? '0 0 0 3px rgba(239, 68, 68, 0.12)' : 'none',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
}));

export const ProjectSelectText = styled('span')<{ placeholder?: boolean }>(
  ({ placeholder }) => ({
    color: placeholder ? colors.gray500 : colors.gray900,
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
    color: colors.gray500,
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
  backgroundColor: colors.white,
  color: colors.gray900,
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
    backgroundColor: selected ? colors.indigo50 : 'transparent',
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
      backgroundColor: selected ? colors.indigo100 : colors.gray50,
    },
  })
);

export const ProjectMenuLabel = styled('span')(() => ({
  minWidth: 0,
  flex: 1,
  color: colors.gray900,
  fontSize: 13,
  fontWeight: 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));
