import { TextField } from '@mui/material';

type LiteralValueFieldProps = {
  errorText?: string | undefined;
  helperText?: string | undefined;
  label: string;
  onChange: (nextValue: string) => void;
  placeholder?: string | undefined;
  value: string;
};

export const LiteralValueField = ({
  errorText,
  helperText = 'JSON literal: `null`, `true`, `123`, `"text"`, массив или объект.',
  label,
  onChange,
  placeholder,
  value,
}: LiteralValueFieldProps) => {
  return (
    <TextField
      fullWidth
      size='small'
      label={label}
      value={value}
      onChange={event => onChange(event.target.value)}
      error={Boolean(errorText)}
      helperText={errorText ?? helperText}
      {...(placeholder ? { placeholder } : {})}
      multiline
      minRows={1}
      maxRows={4}
    />
  );
};
