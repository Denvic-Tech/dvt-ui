import * as React from 'react';
import { styled } from '@mui/material/styles';

import { CODE_FONT_FAMILY } from '@/shared/ui/node-input/HighlightedSingleLineField.shared';

export type SettingsFieldTone = 'default' | 'error';
export type SettingsTextFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size'
> & {
  hasError?: boolean;
  hint?: React.ReactNode;
  label?: React.ReactNode;
  tone?: SettingsFieldTone;
};

export const SettingsSection = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

export const SettingsSectionTitle = styled('div')(({ theme }) => ({
  fontSize: 13,
  fontWeight: 700,
  color: theme.palette.grey[900],
}));

export const SettingsFieldGroup = styled('div')({
  minWidth: 0,
});

export const SettingsTwoColumns = styled('div')({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 14,
  '@media (max-width: 720px)': {
    gridTemplateColumns: '1fr',
  },
});

export const SettingsFieldLabel = styled('div')(({ theme }) => ({
  fontSize: 12,
  fontWeight: 600,
  color: theme.palette.grey[700],
  marginBottom: 6,
}));

export const SettingsTextInput = styled('input', {
  shouldForwardProp: prop => prop !== 'hasError',
})<{ hasError?: boolean }>(({ hasError = false, theme }) => ({
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  borderRadius: 10,
  fontFamily: CODE_FONT_FAMILY,
  fontSize: 13.5,
  color: '#1e293b',
  background: '#ffffff',
  border: `1px solid ${hasError ? '#ef4444' : '#e2e8f0'}`,
  outline: 'none',
  transition: 'all 150ms ease',
  '&:focus': {
    borderColor: hasError ? '#ef4444' : '#6366f1',
    boxShadow: `0 0 0 3px ${
      hasError ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)'
    }`,
  },
  '&::placeholder': {
    color: theme.palette.grey[500],
    opacity: 1,
  },
}));

export const SettingsFieldHint = styled('div', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: SettingsFieldTone }>(({ theme, tone }) => ({
  fontSize: 11.5,
  color: tone === 'error' ? '#ef4444' : theme.palette.grey[500],
  marginTop: 6,
}));

export const SettingsTextField = ({
  hasError = false,
  hint,
  label,
  tone = 'default',
  ...inputProps
}: SettingsTextFieldProps) => (
  <SettingsFieldGroup>
    {label ? <SettingsFieldLabel>{label}</SettingsFieldLabel> : null}
    <SettingsTextInput hasError={hasError} {...inputProps} />
    {hint ? <SettingsFieldHint tone={tone}>{hint}</SettingsFieldHint> : null}
  </SettingsFieldGroup>
);
