import { InputBase, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

import {
  type SingleOptionDropdownOption,
  SingleOptionDropdownSelect,
} from '@/shared/ui/select/SingleOptionDropdownSelect';

import { fieldHintSx, fieldInputSx, fieldTextareaSx } from './styles';
import { TokenFieldRow } from './TokenFieldRow';

// Same as the hint, in red.
const fieldErrorSx: SxProps<Theme> = {
  mt: 0.75,
  color: '#D92D20',
  fontSize: 12,
  lineHeight: '18px',
};

// The select trigger repeats the 38px text field.
const selectTriggerSx: SxProps<Theme> = {
  height: 38,
  minHeight: 38,
  padding: '8px 12px',
  borderRadius: '9px',
  fontSize: 14,
};

const selectOptionTextSx: SxProps<Theme> = theme => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: 13,
  fontWeight: 400,
  color: 'text.primary',
});

const textareaStyle = {
  scrollbarWidth: 'thin',
  scrollbarColor: '#D3D8E2 transparent',
} as const;

type FieldNoteProps = {
  error: string | undefined;
  hint: string | undefined;
};

// An error replaces the hint under the field.
const FieldNote = ({ error, hint }: FieldNoteProps) => {
  if (error) {
    return (
      <Typography role='alert' sx={fieldErrorSx}>
        {error}
      </Typography>
    );
  }

  return hint ? <Typography sx={fieldHintSx}>{hint}</Typography> : null;
};

type TokenTextFieldProps = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password';
  multiline?: boolean;
  autoFocus?: boolean;
  error?: string | undefined;
  hint?: string | undefined;
};

export const TokenTextField = ({
  id,
  label,
  value,
  placeholder,
  onChange,
  type = 'text',
  multiline = false,
  autoFocus = false,
  error,
  hint,
}: TokenTextFieldProps) => (
  <TokenFieldRow label={label} htmlFor={id}>
    <InputBase
      id={id}
      type={type}
      value={value}
      placeholder={placeholder}
      // Fixed 3 rows: a long text scrolls inside instead of growing the field.
      {...(multiline
        ? { multiline: true, rows: 3, inputProps: { style: textareaStyle } }
        : {})}
      autoFocus={autoFocus}
      error={Boolean(error)}
      onChange={event => onChange(event.target.value)}
      sx={multiline ? fieldTextareaSx : fieldInputSx}
    />
    <FieldNote error={error} hint={hint} />
  </TokenFieldRow>
);

type TokenSelectFieldProps = {
  label: string;
  value: string;
  options: SingleOptionDropdownOption[];
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  searchable?: boolean;
  error?: string | undefined;
};

export const TokenSelectField = ({
  label,
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
  loading = false,
  searchable = false,
  error,
}: TokenSelectFieldProps) => (
  <TokenFieldRow label={label}>
    <SingleOptionDropdownSelect
      ariaLabel={label}
      value={value}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      loading={loading}
      searchable={searchable}
      error={Boolean(error)}
      optionTextSx={selectOptionTextSx}
      popperMinWidth={0}
      textFieldSx={selectTriggerSx}
      onChange={onChange}
    />
    <FieldNote error={error} hint={undefined} />
  </TokenFieldRow>
);
