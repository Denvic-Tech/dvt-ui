import * as React from 'react';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';

import { useAlert } from '@/app/notifications';

import { isApiError } from '@/shared/lib/errors';
import { Panel } from '@/shared/ui';
import { SingleOptionDropdownSelect } from '@/shared/ui/select';

import {
  buildAppSettingsNamespaceUpdatePayload,
  createAppSettingsFormValues,
  createDefaultOomGuardSettingsFormValue,
  findAppSettingsNamespace,
  normalizeOomGuardSettingsFormValue,
  validateAppSettingsFormValues,
  validateOomGuardSettingsFormValue,
} from '../model/adapters';
import { useAppSettings } from '../model/hooks/useAppSettings';
import type {
  AppSettingsFieldDescriptor,
  AppSettingsFormValues,
  OomGuardMode,
  OomGuardSettingsFormErrors,
  OomGuardSettingsFormValue,
  OomGuardWorkerThresholdType,
} from '../model/types';

type AppSettingsNamespacePanelProps = {
  namespaceId: string | null;
};

const OOM_GUARD_MODE_OPTIONS: Array<{
  value: OomGuardMode;
  label: string;
  description: string;
}> = [
  {
    value: 'DISABLED',
    label: 'Выключен',
    description: 'Защита от OOM отключена — task снимает только сам Dask.',
  },
  {
    value: 'HOST_PRESSURE',
    label: 'По нагрузке хоста',
    description:
      'Останавливает task с максимальным RSS, если память host/container превышает порог.',
  },
  {
    value: 'WORKER_THRESHOLD',
    label: 'По лимиту воркера',
    description:
      'Останавливает executing task, который превысил индивидуальный лимит.',
  },
];

const OOM_GUARD_THRESHOLD_TYPE_OPTIONS: Array<{
  value: OomGuardWorkerThresholdType;
  label: string;
}> = [
  {
    value: 'PERCENT',
    label: '%',
  },
  {
    value: 'ABSOLUTE_MB',
    label: 'MB',
  },
];

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};

const getVisibleOomGuardErrors = (
  showValidation: boolean,
  errors: OomGuardSettingsFormErrors
): OomGuardSettingsFormErrors => (showValidation ? errors : {});

const applyOomGuardMode = (
  currentValue: OomGuardSettingsFormValue,
  mode: OomGuardMode
): OomGuardSettingsFormValue => {
  if (mode === 'DISABLED') {
    return createDefaultOomGuardSettingsFormValue();
  }

  if (mode === 'HOST_PRESSURE') {
    return {
      mode,
      host_threshold_percent: currentValue.host_threshold_percent,
      worker_threshold_type: '',
      worker_threshold_percent: '',
      worker_threshold_mb: '',
    };
  }

  const workerThresholdType = currentValue.worker_threshold_type || 'PERCENT';

  return {
    mode,
    host_threshold_percent: '',
    worker_threshold_type: workerThresholdType,
    worker_threshold_percent:
      workerThresholdType === 'PERCENT'
        ? currentValue.worker_threshold_percent
        : '',
    worker_threshold_mb:
      workerThresholdType === 'ABSOLUTE_MB'
        ? currentValue.worker_threshold_mb
        : '',
  };
};

const applyOomGuardWorkerThresholdType = (
  currentValue: OomGuardSettingsFormValue,
  workerThresholdType: OomGuardWorkerThresholdType
): OomGuardSettingsFormValue => ({
  ...currentValue,
  worker_threshold_type: workerThresholdType,
  worker_threshold_percent:
    workerThresholdType === 'PERCENT'
      ? currentValue.worker_threshold_percent
      : '',
  worker_threshold_mb:
    workerThresholdType === 'ABSOLUTE_MB'
      ? currentValue.worker_threshold_mb
      : '',
});

const FieldMeta = ({ field }: { field: AppSettingsFieldDescriptor }) => (
  <Stack spacing={0.75}>
    <Stack direction='row' alignItems='center' spacing={1} flexWrap='wrap'>
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
        {field.label}
      </Typography>
      {field.required ? (
        <Chip label='required' size='small' sx={{ height: 20 }} />
      ) : null}
      {!field.runtimeEditable ? (
        <Chip label='read-only' size='small' sx={{ height: 20 }} />
      ) : null}
      {field.readEnv && field.envVar ? (
        <Chip label={field.envVar} size='small' sx={{ height: 20 }} />
      ) : null}
    </Stack>
    {field.description ? (
      <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: '#6b7280' }}>
        {field.description}
      </Typography>
    ) : null}
  </Stack>
);

const FieldRow = ({
  field,
  children,
}: {
  field: AppSettingsFieldDescriptor;
  children: React.ReactNode;
}) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', lg: 'minmax(220px, 36%) 1fr' },
      gap: { xs: 1.5, lg: 4 },
      px: { xs: 2, sm: 3 },
      py: 2.5,
      borderTop: '1px solid #f3f4f6',
      '&:first-of-type': {
        borderTop: 0,
      },
    }}
  >
    <FieldMeta field={field} />
    <Box sx={{ minWidth: 0 }}>{children}</Box>
  </Box>
);

const COMPACT_FIELD_COPY: Record<
  string,
  { label: string; description: string }
> = {
  'runtime.datetime_precision': {
    label: 'Точность даты и времени',
    description:
      'Точность представления даты и времени при обработке данных в Dask.',
  },
  'runtime.oom_guard': {
    label: 'Защита от нехватки памяти',
    description: 'Управление защитой задач и воркеров при нехватке памяти.',
  },
};

const CompactFieldMeta = ({ field }: { field: AppSettingsFieldDescriptor }) => {
  const fieldCopy = COMPACT_FIELD_COPY[field.key];
  const label = fieldCopy?.label ?? field.label;
  const description = fieldCopy?.description ?? field.description;

  return (
    <Stack spacing={0.55}>
      <Stack direction='row' alignItems='center' spacing={0.8} flexWrap='wrap'>
        <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>
          {label}
        </Typography>
      </Stack>
      {description ? (
        <Typography sx={{ fontSize: 12.5, lineHeight: 1.45, color: '#9ca3af' }}>
          {description}
        </Typography>
      ) : null}
    </Stack>
  );
};

const CompactFieldRow = ({
  field,
  children,
}: {
  field: AppSettingsFieldDescriptor;
  children: React.ReactNode;
}) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: {
        xs: '1fr',
        md: 'minmax(280px, 46%) minmax(320px, 1fr)',
      },
      alignItems: field.kind === 'oom_guard' ? 'start' : 'center',
      gap: { xs: 1.5, md: 3 },
      px: { xs: 0, sm: 1.5 },
      py: 2.5,
      borderBottom: '1px solid #e5e7eb',
      '&:last-of-type': { borderBottom: 0 },
    }}
  >
    <CompactFieldMeta field={field} />
    <Box sx={{ minWidth: 0 }}>{children}</Box>
  </Box>
);

const OomGuardEditor = ({
  field,
  value,
  error,
  disabled,
  onChange,
}: {
  field: AppSettingsFieldDescriptor;
  value: OomGuardSettingsFormValue;
  error?: string | undefined;
  disabled: boolean;
  onChange: (value: OomGuardSettingsFormValue) => void;
}) => {
  const visibleErrors = getVisibleOomGuardErrors(
    Boolean(error),
    validateOomGuardSettingsFormValue(value)
  );
  const thresholdFieldSx = {
    width: 190,
    maxWidth: '100%',
    '& .MuiOutlinedInput-root': {
      minHeight: 38,
      borderRadius: '9px',
      bgcolor: '#fff',
      boxShadow: 'none',
      '&.Mui-focused': { boxShadow: 'none' },
    },
    '& .MuiInputBase-input': {
      py: 0.9,
      fontSize: 13,
    },
    '& .MuiFormHelperText-root': {
      mx: 0,
      mt: 0.75,
      fontSize: 11,
      lineHeight: 1.35,
    },
  };

  return (
    <Stack spacing={1}>
      <RadioGroup
        value={value.mode}
        onChange={event =>
          onChange(applyOomGuardMode(value, event.target.value as OomGuardMode))
        }
      >
        <Stack spacing={1}>
          {OOM_GUARD_MODE_OPTIONS.map(option => {
            const isSelected = value.mode === option.value;

            return (
              <Box
                key={option.value}
                sx={{
                  overflow: 'hidden',
                  border: 1,
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  borderRadius: '11px',
                  bgcolor: isSelected ? 'rgba(99, 102, 241, 0.025)' : '#fff',
                  transition:
                    'border-color 120ms ease, background-color 120ms ease',
                }}
              >
                <FormControlLabel
                  disabled={disabled}
                  value={option.value}
                  control={<Radio size='small' />}
                  label={
                    <Stack spacing={0.25}>
                      <Typography
                        sx={{
                          color: isSelected ? 'primary.main' : 'text.primary',
                          fontSize: 13.5,
                          fontWeight: 600,
                          lineHeight: 1.35,
                        }}
                      >
                        {option.label}
                      </Typography>
                      <Typography
                        sx={{
                          color: '#9ca3af',
                          fontSize: 12,
                          lineHeight: 1.45,
                        }}
                      >
                        {option.description}
                      </Typography>
                    </Stack>
                  }
                  sx={{
                    width: '100%',
                    alignItems: 'flex-start',
                    m: 0,
                    px: 1.5,
                    py: 1.25,
                    '& .MuiRadio-root': {
                      p: 0,
                      mt: 0.15,
                      mr: 1.25,
                      color: '#d1d5db',
                      '&.Mui-checked': { color: 'primary.main' },
                    },
                    '& .MuiFormControlLabel-label': {
                      minWidth: 0,
                      flex: 1,
                    },
                  }}
                />

                {isSelected && option.value === 'HOST_PRESSURE' ? (
                  <Box
                    sx={{
                      px: { xs: 1.5, sm: 5.1 },
                      py: 1.5,
                      borderTop: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <TextField
                      size='small'
                      value={value.host_threshold_percent}
                      onChange={event =>
                        onChange({
                          ...value,
                          host_threshold_percent: event.target.value,
                        })
                      }
                      disabled={disabled}
                      error={Boolean(visibleErrors.host_threshold_percent)}
                      helperText={
                        visibleErrors.host_threshold_percent ??
                        'Порог общей памяти — % от memory limit host/container.'
                      }
                      type='number'
                      inputProps={{ min: 0, max: 100 }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position='end'>%</InputAdornment>
                        ),
                      }}
                      sx={thresholdFieldSx}
                    />
                  </Box>
                ) : null}

                {isSelected && option.value === 'WORKER_THRESHOLD' ? (
                  <Box
                    sx={{
                      px: { xs: 1.5, sm: 5.1 },
                      py: 1.5,
                      borderTop: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        mb: 1.25,
                        p: 0.35,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: '9px',
                        bgcolor: '#f7f7f9',
                      }}
                    >
                      <ToggleButtonGroup
                        exclusive
                        size='small'
                        value={value.worker_threshold_type}
                        disabled={disabled}
                        onChange={(_, nextValue) => {
                          if (nextValue) {
                            onChange(
                              applyOomGuardWorkerThresholdType(
                                value,
                                nextValue as OomGuardWorkerThresholdType
                              )
                            );
                          }
                        }}
                        sx={{
                          gap: 0.25,
                          '& .MuiToggleButton-root': {
                            minWidth: 38,
                            minHeight: 30,
                            px: 1.2,
                            py: 0.35,
                            border: 0,
                            borderRadius: '7px !important',
                            color: '#9ca3af',
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: 'none',
                            '&.Mui-selected': {
                              bgcolor: '#fff',
                              color: 'text.primary',
                              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
                            },
                            '&.Mui-selected:hover': { bgcolor: '#fff' },
                          },
                        }}
                      >
                        {OOM_GUARD_THRESHOLD_TYPE_OPTIONS.map(typeOption => (
                          <ToggleButton
                            key={typeOption.value}
                            value={typeOption.value}
                          >
                            {typeOption.label}
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                    </Box>

                    {visibleErrors.worker_threshold_type ? (
                      <Typography
                        sx={{ mb: 1, color: 'error.main', fontSize: 11 }}
                      >
                        {visibleErrors.worker_threshold_type}
                      </Typography>
                    ) : null}

                    {value.worker_threshold_type === 'PERCENT' ? (
                      <TextField
                        size='small'
                        value={value.worker_threshold_percent}
                        onChange={event =>
                          onChange({
                            ...value,
                            worker_threshold_percent: event.target.value,
                          })
                        }
                        disabled={disabled}
                        error={Boolean(visibleErrors.worker_threshold_percent)}
                        helperText={
                          visibleErrors.worker_threshold_percent ??
                          'Порог памяти воркера — % от его memory limit.'
                        }
                        type='number'
                        inputProps={{ min: 0, max: 100 }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position='end'>%</InputAdornment>
                          ),
                        }}
                        sx={thresholdFieldSx}
                      />
                    ) : null}

                    {value.worker_threshold_type === 'ABSOLUTE_MB' ? (
                      <TextField
                        size='small'
                        value={value.worker_threshold_mb}
                        onChange={event =>
                          onChange({
                            ...value,
                            worker_threshold_mb: event.target.value,
                          })
                        }
                        disabled={disabled}
                        error={Boolean(visibleErrors.worker_threshold_mb)}
                        helperText={
                          visibleErrors.worker_threshold_mb ??
                          'Абсолютный лимит памяти воркера в мегабайтах.'
                        }
                        type='number'
                        inputProps={{ min: 0 }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position='end'>MB</InputAdornment>
                          ),
                        }}
                        sx={thresholdFieldSx}
                      />
                    ) : null}
                  </Box>
                ) : null}
              </Box>
            );
          })}
        </Stack>
      </RadioGroup>

      {error ? (
        <Typography sx={{ color: 'error.main', fontSize: 12 }}>
          {error}
        </Typography>
      ) : null}
    </Stack>
  );
};

const FieldControl = ({
  field,
  value,
  error,
  onChange,
  variant = 'default',
}: {
  field: AppSettingsFieldDescriptor;
  value: AppSettingsFormValues[string];
  error?: string | undefined;
  onChange: (value: AppSettingsFormValues[string]) => void;
  variant?: 'default' | 'compact';
}) => {
  const disabled = !field.runtimeEditable;
  const isCompact = variant === 'compact';
  const [showSecretValue, setShowSecretValue] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const copyResetTimeoutRef = React.useRef<number | null>(null);
  const textValue =
    typeof value === 'string' || typeof value === 'number' ? value : '';
  const compactFieldName =
    field.relativePath[field.relativePath.length - 1]?.toLowerCase() ?? '';
  const compactPlaceholder =
    compactFieldName === 'url'
      ? 'Введите URL'
      : compactFieldName === 'username'
        ? 'Введите пользователя'
        : compactFieldName === 'password'
          ? 'Введите пароль'
          : compactFieldName === 'key'
            ? 'Введите лицензионный ключ'
            : 'Введите значение';

  React.useEffect(
    () => () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    },
    []
  );

  const handleCopy = async () => {
    const text = String(textValue);
    let copySucceeded = false;

    try {
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.clipboard?.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(text);
        copySucceeded = true;
      }
    } catch {
      copySucceeded = false;
    }

    if (!copySucceeded && typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        copySucceeded = document.execCommand('copy');
      } catch {
        copySucceeded = false;
      } finally {
        textarea.remove();
      }
    }

    if (!copySucceeded) {
      return;
    }

    setCopied(true);
    if (copyResetTimeoutRef.current !== null) {
      window.clearTimeout(copyResetTimeoutRef.current);
    }
    copyResetTimeoutRef.current = window.setTimeout(() => {
      setCopied(false);
      copyResetTimeoutRef.current = null;
    }, 1400);
  };

  const compactTextFieldSx = {
    '& .MuiOutlinedInput-root': {
      minHeight: 40,
      pr: field.kind === 'password' || disabled ? 0 : undefined,
      borderRadius: '9px',
      bgcolor: disabled ? 'rgba(248, 250, 252, 0.9)' : '#fff',
      boxShadow: 'none',
      '&.Mui-focused': { boxShadow: 'none' },
      '&.Mui-disabled': { boxShadow: 'none' },
    },
    '& .MuiInputBase-input': {
      py: 1,
      fontFamily: 'inherit',
      fontSize: 13,
    },
    '& .MuiInputBase-input.Mui-disabled': {
      WebkitTextFillColor: '#6b7280',
    },
  };

  if (field.kind === 'oom_guard') {
    return (
      <OomGuardEditor
        field={field}
        value={normalizeOomGuardSettingsFormValue(value)}
        error={error}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }

  if (field.kind === 'boolean') {
    return (
      <Stack spacing={0.75}>
        <Switch
          checked={Boolean(value)}
          disabled={disabled}
          onChange={event => onChange(event.target.checked)}
        />
        {error ? (
          <Typography sx={{ color: 'error.main', fontSize: 12 }}>
            {error}
          </Typography>
        ) : null}
      </Stack>
    );
  }

  if (field.kind === 'select') {
    if (isCompact) {
      const compactOptions = [
        ...(field.nullable || !field.required
          ? [{ value: '', label: 'Не задано' }]
          : []),
        ...field.enumOptions.map(option => ({
          value: option.value,
          label: option.label,
        })),
      ];

      return (
        <Stack spacing={0.75}>
          <SingleOptionDropdownSelect
            ariaLabel={field.label}
            value={String(textValue)}
            options={compactOptions}
            disabled={disabled}
            error={Boolean(error)}
            placeholder='Выберите значение'
            popperMinWidth={0}
            textFieldSx={{
              height: 40,
              minHeight: 40,
              px: 1.5,
              py: 1,
              borderRadius: '9px',
              fontFamily: 'inherit',
              fontSize: 13,
              boxShadow: 'none',
            }}
            optionTextSx={{ fontFamily: 'inherit', fontSize: 13 }}
            onChange={onChange}
          />
          {error ? (
            <Typography sx={{ color: 'error.main', fontSize: 11 }}>
              {error}
            </Typography>
          ) : null}
        </Stack>
      );
    }

    return (
      <TextField
        select
        value={String(textValue)}
        disabled={disabled}
        onChange={event => onChange(event.target.value)}
        error={Boolean(error)}
        helperText={error ?? undefined}
        placeholder={field.key}
        fullWidth
      >
        {field.nullable || !field.required ? (
          <MenuItem value=''>
            <Typography sx={{ color: '#9ca3af' }}>Не задано</Typography>
          </MenuItem>
        ) : null}
        {field.enumOptions.map(option => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  if (isCompact && disabled) {
    return (
      <Box
        sx={{
          minHeight: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
        }}
      >
        <Typography
          sx={{
            minWidth: 0,
            color: 'text.secondary',
            fontSize: 13,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {textValue}
        </Typography>
        <IconButton
          size='small'
          disableRipple
          onClick={() => void handleCopy()}
          aria-label={`Скопировать ${field.label}`}
          sx={{
            width: 28,
            height: 28,
            flex: '0 0 28px',
            color: copied ? 'success.main' : 'text.secondary',
            '&:hover': {
              bgcolor: 'transparent',
              color: copied ? 'success.main' : 'text.secondary',
            },
          }}
        >
          {copied ? (
            <CheckRoundedIcon
              sx={{
                fontSize: 16,
                '& path': {
                  stroke: 'currentColor',
                  strokeWidth: 0.8,
                },
              }}
            />
          ) : (
            <ContentCopyOutlinedIcon sx={{ fontSize: 14 }} />
          )}
        </IconButton>
      </Box>
    );
  }

  return (
    <TextField
      value={textValue}
      disabled={disabled}
      onChange={event => onChange(event.target.value)}
      error={Boolean(error)}
      helperText={error ?? undefined}
      placeholder={isCompact ? compactPlaceholder : field.key}
      type={field.kind === 'password' && !showSecretValue ? 'password' : 'text'}
      fullWidth
      multiline={field.kind === 'json'}
      {...(field.kind === 'json' ? { minRows: 6 } : {})}
      inputProps={{
        autoComplete: field.secret ? 'new-password' : 'off',
      }}
      {...(isCompact
        ? {
            size: 'small' as const,
            sx: compactTextFieldSx,
          }
        : {})}
      {...(isCompact && (field.kind === 'password' || disabled)
        ? {
            InputProps: {
              endAdornment: (
                <InputAdornment position='end' sx={{ height: 40, ml: 0 }}>
                  {field.kind === 'password' ? (
                    <Tooltip
                      title={showSecretValue ? 'Скрыть значение' : 'Показать'}
                    >
                      <IconButton
                        size='small'
                        onClick={() =>
                          setShowSecretValue(currentValue => !currentValue)
                        }
                        aria-label={
                          showSecretValue ? 'Скрыть значение' : 'Показать'
                        }
                        sx={{
                          width: 40,
                          height: 38,
                          borderRadius: 0,
                          color: 'text.disabled',
                          '&:hover': { bgcolor: 'transparent' },
                        }}
                      >
                        {showSecretValue ? (
                          <VisibilityOffOutlinedIcon sx={{ fontSize: 17 }} />
                        ) : (
                          <VisibilityOutlinedIcon sx={{ fontSize: 17 }} />
                        )}
                      </IconButton>
                    </Tooltip>
                  ) : null}
                </InputAdornment>
              ),
            },
          }
        : {})}
    />
  );
};

export const AppSettingsNamespacePanel: React.FC<
  AppSettingsNamespacePanelProps
> = ({ namespaceId }) => {
  const { showAlert } = useAlert();
  const {
    settings,
    definitions,
    status,
    definitionsStatus,
    error,
    definitionsError,
    upsertStatus,
    upsertError,
    loadAll,
    saveSettings,
  } = useAppSettings();
  const [values, setValues] = React.useState<AppSettingsFormValues>({});
  const [errors, setErrors] = React.useState<Partial<Record<string, string>>>(
    {}
  );
  const namespace = React.useMemo(
    () => findAppSettingsNamespace(definitions, namespaceId),
    [definitions, namespaceId]
  );
  const fields = React.useMemo(
    () => namespace?.groups.flatMap(group => group.fields) ?? [],
    [namespace]
  );
  const isInitialLoading =
    status === 'loading' ||
    definitionsStatus === 'loading' ||
    (status === 'idle' && definitionsStatus === 'idle');
  const isSaving = upsertStatus === 'loading';

  React.useEffect(() => {
    if (status === 'idle' || definitionsStatus === 'idle') {
      void loadAll();
    }
  }, [definitionsStatus, loadAll, status]);

  React.useEffect(() => {
    setValues(
      createAppSettingsFormValues({
        settings,
        fields,
      })
    );
    setErrors({});
  }, [fields, settings]);

  const updateValue = React.useCallback(
    (
      field: AppSettingsFieldDescriptor,
      value: AppSettingsFormValues[string]
    ) => {
      const nextValues = {
        ...values,
        [field.key]: value,
      };

      setValues(nextValues);

      if (errors[field.key]) {
        setErrors(
          validateAppSettingsFormValues({
            values: nextValues,
            fields,
          })
        );
      }
    },
    [errors, fields, values]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!namespace) {
      return;
    }

    const nextErrors = validateAppSettingsFormValues({
      values,
      fields,
    });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await saveSettings({
        namespace: namespace.id,
        values: buildAppSettingsNamespaceUpdatePayload({
          namespace: namespace.id,
          values,
          fields,
        }),
      });
      showAlert({
        type: 'success',
        title: 'Настройки сохранены.',
      });
    } catch {
      // Error state is stored in the slice and rendered below.
    }
  };

  if (isInitialLoading) {
    return (
      <Box
        sx={{
          minHeight: 360,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || definitionsError) {
    return (
      <Alert severity='error'>
        {error?.message ??
          definitionsError?.message ??
          'Не удалось загрузить настройки.'}
      </Alert>
    );
  }

  if (!namespace) {
    return (
      <Panel elevation={0} sx={{ p: 3, border: '1px solid #e5e7eb' }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
          Настройки не найдены
        </Typography>
        <Typography sx={{ mt: 1, color: '#6b7280' }}>
          Для выбранного раздела нет app settings definitions.
        </Typography>
      </Panel>
    );
  }

  const normalizedNamespaceId = namespace.id.toLocaleLowerCase();
  const compactNamespaceConfig =
    normalizedNamespaceId === 'dcc'
      ? {
          title: 'DCC',
          badge: 'dcc',
          description:
            'Параметры и настройки подключения к Denvic Control Center.',
        }
      : normalizedNamespaceId === 'license'
        ? {
            title: 'License',
            badge: 'license',
            description: 'Управление лицензионным ключом приложения.',
          }
        : normalizedNamespaceId === 'runtime'
          ? {
              title: 'Runtime',
              badge: 'runtime',
              description:
                'Параметры выполнения задач и защиты runtime-процессов.',
            }
          : null;

  if (compactNamespaceConfig) {
    return (
      <Box
        component='form'
        onSubmit={handleSubmit}
        sx={{
          width: '100%',
          minHeight: '100%',
          p: { xs: 2, sm: 3 },
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: '18px',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1180, mr: 'auto' }}>
          <Stack direction='row' alignItems='center' gap={1.5}>
            <Box
              sx={{
                width: 44,
                height: 44,
                flex: '0 0 44px',
                display: 'grid',
                placeItems: 'center',
                borderRadius: '11px',
                bgcolor: 'rgba(99, 102, 241, 0.08)',
                color: 'primary.main',
              }}
            >
              <SettingsOutlinedIcon sx={{ fontSize: 21 }} />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Stack direction='row' alignItems='center' gap={1}>
                <Typography
                  component='h1'
                  sx={{
                    color: 'text.primary',
                    fontSize: { xs: 23, sm: 26 },
                    fontWeight: 700,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.15,
                  }}
                >
                  {compactNamespaceConfig.title}
                </Typography>
                <Chip
                  label={compactNamespaceConfig.badge}
                  size='small'
                  sx={{
                    height: 22,
                    borderRadius: '6px',
                    bgcolor: '#f3f4f6',
                    color: '#6b7280',
                    fontFamily:
                      '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: 10.5,
                  }}
                />
              </Stack>
              <Typography
                sx={{
                  mt: 0.35,
                  color: 'text.secondary',
                  fontSize: 13,
                  lineHeight: 1.3,
                }}
              >
                {compactNamespaceConfig.description}
              </Typography>
            </Box>
          </Stack>

          {upsertError ? (
            <Alert severity='error' sx={{ mt: 2.25 }}>
              {resolveErrorMessage(
                upsertError,
                'Не удалось сохранить настройки.'
              )}
            </Alert>
          ) : null}

          <Box sx={{ width: '100%', maxWidth: 900, mt: 2.5 }}>
            {fields.map(field => (
              <CompactFieldRow key={field.key} field={field}>
                <Stack spacing={0.65}>
                  <FieldControl
                    field={field}
                    value={values[field.key]}
                    error={errors[field.key]}
                    variant='compact'
                    onChange={value => updateValue(field, value)}
                  />
                  {normalizedNamespaceId !== 'runtime' ? (
                    <Typography
                      sx={{
                        color: '#c0c4cf',
                        fontFamily:
                          '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        fontSize: 11,
                        lineHeight: 1.35,
                      }}
                    >
                      {field.key}
                    </Typography>
                  ) : null}
                </Stack>
              </CompactFieldRow>
            ))}
          </Box>

          <Box
            sx={{
              width: '100%',
              maxWidth: 900,
              display: 'flex',
              justifyContent: 'flex-end',
              mt: 2,
            }}
          >
            <Button
              type='submit'
              variant='contained'
              disabled={isSaving}
              sx={{
                minHeight: 36,
                px: 2,
                borderRadius: '9px',
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' },
              }}
            >
              {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Panel
      component='form'
      elevation={0}
      onSubmit={handleSubmit}
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: '#fff',
      }}
    >
      <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>
          {namespace.label}
        </Typography>
        <Typography sx={{ mt: 0.75, fontSize: 14, color: '#6b7280' }}>
          Настройки namespace `{namespace.id}` формируются автоматически из
          definitions.
        </Typography>
      </Box>
      <Divider />

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {upsertError ? (
          <Alert severity='error' sx={{ m: 2 }}>
            {resolveErrorMessage(
              upsertError,
              'Не удалось сохранить настройки.'
            )}
          </Alert>
        ) : null}

        {namespace.groups.map(group => (
          <Box key={group.id}>
            <Box
              sx={{
                px: { xs: 2, sm: 3 },
                py: 2,
                bgcolor: '#f9fafb',
                borderTop: '1px solid #e5e7eb',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <Typography
                sx={{ fontSize: 13, fontWeight: 700, color: '#374151' }}
              >
                {group.label}
              </Typography>
            </Box>

            {group.fields.map(field => (
              <FieldRow key={field.key} field={field}>
                <FieldControl
                  field={field}
                  value={values[field.key]}
                  error={errors[field.key]}
                  onChange={value => updateValue(field, value)}
                />
              </FieldRow>
            ))}
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          borderTop: '1px solid #e5e7eb',
          bgcolor: '#f9fafb',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Button type='submit' variant='contained' disabled={isSaving}>
          {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
      </Box>
    </Panel>
  );
};
