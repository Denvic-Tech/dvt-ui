import React from 'react';
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';

import {
  type SetupFieldDescriptor,
  type SetupFormValues,
  validateSetupFormValues,
} from '@/app/setup';

type FormErrors = Partial<Record<string, string>>;

export interface SetupStepFormProps {
  title: string;
  description?: string | null;
  submitLabel: string;
  fields: SetupFieldDescriptor[];
  initialValues: SetupFormValues;
  loading?: boolean;
  submitError?: string | null;
  onSubmit: (values: SetupFormValues) => Promise<void>;
}

const formRootSx = {
  borderRadius: '20px',
  border: '1px solid',
  borderColor: 'divider',
  backgroundColor: 'background.paper',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
};

const formHeaderSx = {
  px: { xs: 2, md: 3 },
  pt: { xs: 2, md: 2.5 },
};

const contentSx = {
  px: { xs: 2, md: 3 },
  py: { xs: 2, md: 2.5 },
};

const fieldsSectionSx = {
  display: 'grid',
  gap: 1.5,
};

const footerSx = {
  px: { xs: 2, md: 3 },
  py: 2,
  borderTop: '1px solid',
  borderColor: 'divider',
  display: 'flex',
  justifyContent: 'flex-end',
};

const submitButtonSx = {
  minWidth: 220,
  borderRadius: '999px',
  px: 3,
};

const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: 'background.default',
  },
};

const headerTitleSx = {
  color: 'text.secondary',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const blockTitleSx = {
  color: 'text.primary',
  fontSize: { xs: 22, md: 26 },
  fontWeight: 700,
  lineHeight: 1.15,
};

const blockDescriptionSx = {
  mt: 1,
  color: 'text.secondary',
  fontSize: 14,
  lineHeight: 1.6,
};

const getFieldHelperText = (
  field: SetupFieldDescriptor,
  error?: string
): string | undefined => {
  if (error) {
    return error;
  }

  if (field.required) {
    return 'Required field.';
  }

  if (field.nullable) {
    return 'Optional field. Leave empty to send null.';
  }

  return 'Optional field.';
};

export const SetupStepForm: React.FC<SetupStepFormProps> = ({
  title,
  description,
  submitLabel,
  fields,
  initialValues,
  loading = false,
  submitError,
  onSubmit,
}) => {
  const [values, setValues] = React.useState<SetupFormValues>(initialValues);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const initialValuesKey = React.useMemo(
    () => JSON.stringify(initialValues),
    [initialValues]
  );
  const stableInitialValues = React.useMemo(
    () => initialValues,
    [initialValuesKey]
  );

  React.useEffect(() => {
    setValues(stableInitialValues);
    setErrors({});
  }, [stableInitialValues]);

  const validate = React.useCallback(
    (nextValues: SetupFormValues) =>
      validateSetupFormValues({
        values: nextValues,
        fields,
      }),
    [fields]
  );

  const handleFieldChange =
    (field: SetupFieldDescriptor) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue =
        field.scalarKind === 'boolean'
          ? event.target.checked
          : event.target.value;
      const nextValues = {
        ...values,
        [field.key]: nextValue,
      };

      setValues(nextValues);

      if (errors[field.key]) {
        setErrors(validate(nextValues));
      }
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit(values);
  };

  return (
    <Paper component='form' onSubmit={handleSubmit} sx={formRootSx}>
      <Box sx={formHeaderSx}>
        <Typography sx={headerTitleSx}>Setup Step</Typography>
      </Box>

      <Box sx={contentSx}>
        <Stack spacing={2}>
          <Box>
            <Typography sx={blockTitleSx}>{title}</Typography>
            {description ? (
              <Typography sx={blockDescriptionSx}>{description}</Typography>
            ) : null}
          </Box>

          {fields.length > 0 ? (
            <Box sx={fieldsSectionSx}>
              {fields.map(field => {
                const error = errors[field.key];
                const helperText = getFieldHelperText(field, error);

                if (field.inputKind === 'switch') {
                  return (
                    <Box
                      key={field.key}
                      sx={{
                        px: 1.5,
                        py: 1,
                        borderRadius: '12px',
                        bgcolor: 'background.default',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(values[field.key])}
                            onChange={handleFieldChange(field)}
                          />
                        }
                        label={field.label}
                      />
                      {helperText ? (
                        <Typography
                          variant='caption'
                          color={error ? 'error.main' : 'text.secondary'}
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {helperText}
                        </Typography>
                      ) : null}
                    </Box>
                  );
                }

                return (
                  <TextField
                    key={field.key}
                    label={field.label}
                    value={values[field.key] ?? ''}
                    onChange={handleFieldChange(field)}
                    error={Boolean(error)}
                    helperText={helperText}
                    placeholder={field.key}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    required={field.required}
                    type={field.inputKind}
                    autoComplete='off'
                    sx={textFieldSx}
                  />
                );
              })}
            </Box>
          ) : null}

          {submitError ? <Alert severity='error'>{submitError}</Alert> : null}
        </Stack>
      </Box>

      <Box sx={footerSx}>
        <Button
          type='submit'
          variant='contained'
          disabled={loading}
          sx={submitButtonSx}
        >
          {submitLabel}
        </Button>
      </Box>
    </Paper>
  );
};
