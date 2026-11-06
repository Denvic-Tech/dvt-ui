import * as React from 'react';
import type { SxProps, Theme } from '@mui/material/styles';

import { SingleOptionDropdownSelect } from '@/shared/ui/select';

import {
  normalizeOomGuardSettingsFormValue,
  validateOomGuardSettingsFormValue,
} from '../../model/adapters';
import type {
  AppSettingsFieldDescriptor,
  AppSettingsFormValues,
  OomGuardSettingsFormValue,
} from '../../model/types';
import { SettingsSaveRow } from '../settings-form/SettingsSaveRow';
import {
  SettingsFieldError,
  SettingsForm,
  SettingsInput,
  SettingsInputBox,
} from '../settings-form/styles';

import {
  applyOomGuardMode,
  applyOomGuardWorkerThresholdType,
  getVisibleOomGuardErrors,
  OOM_GUARD_MODE_OPTIONS,
  OOM_GUARD_THRESHOLD_TYPE_OPTIONS,
} from './oomGuardOptions';
import {
  RUNTIME_RADIO_MARK_CLASS,
  RuntimeRadioDescription,
  RuntimeRadioList,
  RuntimeRadioMark,
  RuntimeRadioName,
  RuntimeRadioOption,
  RuntimeRadioText,
  RuntimeSectionControl,
  RuntimeSectionDescription,
  RuntimeSectionDivider,
  RuntimeSectionTitle,
  RuntimeThreshold,
  RuntimeThresholdHint,
  RuntimeThresholdInputBoxSx,
  RuntimeThresholdRow,
  RuntimeThresholdUnit,
  RuntimeUnitSegment,
  RuntimeUnitSegments,
} from './styles';

// Titles of the known runtime fields; others keep the definitions' copy.
const RUNTIME_FIELD_COPY: Record<
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

// The same select as on the «Интерфейс» tab.
const SELECT_WIDTH = 240;
const selectFieldSx = { width: SELECT_WIDTH, minWidth: 0 };
const selectTextFieldSx = { minHeight: 38, borderRadius: '9px' };
const selectOptionTextSx: SxProps<Theme> = theme => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: 13,
  fontWeight: 400,
  color: 'text.primary',
});

const THRESHOLD_HINTS = {
  host: 'Порог общей памяти — % от memory limit host/container.',
  workerPercent: 'Порог памяти воркера — % от его memory limit.',
  workerMb: 'Абсолютный лимит памяти воркера в мегабайтах.',
};

type ThresholdInputProps = {
  label: string;
  value: string;
  unit: string;
  error: boolean;
  disabled: boolean;
  min: number;
  max?: number | undefined;
  onChange: (value: string) => void;
};

const ThresholdInput = ({
  label,
  value,
  unit,
  error,
  disabled,
  min,
  max,
  onChange,
}: ThresholdInputProps) => (
  <SettingsInputBox
    error={error}
    disabled={disabled}
    sx={RuntimeThresholdInputBoxSx}
  >
    <SettingsInput
      type='number'
      inputMode='decimal'
      aria-label={label}
      aria-invalid={error}
      value={value}
      min={min}
      max={max}
      disabled={disabled}
      onChange={event => onChange(event.target.value)}
    />
    <RuntimeThresholdUnit>{unit}</RuntimeThresholdUnit>
  </SettingsInputBox>
);

type OomGuardFieldProps = {
  value: OomGuardSettingsFormValue;
  error?: string | undefined;
  disabled: boolean;
  onChange: (value: OomGuardSettingsFormValue) => void;
};

const OomGuardField = ({
  value,
  error,
  disabled,
  onChange,
}: OomGuardFieldProps) => {
  // Field errors show up once the form has flagged the setting.
  const visibleErrors = getVisibleOomGuardErrors(
    Boolean(error),
    validateOomGuardSettingsFormValue(value)
  );

  const renderHostThreshold = () => (
    <RuntimeThreshold>
      <RuntimeThresholdRow>
        <ThresholdInput
          label='Порог общей памяти'
          value={value.host_threshold_percent}
          unit='%'
          error={Boolean(visibleErrors.host_threshold_percent)}
          disabled={disabled}
          min={0}
          max={100}
          onChange={nextValue =>
            onChange({ ...value, host_threshold_percent: nextValue })
          }
        />
      </RuntimeThresholdRow>
      <RuntimeThresholdHint
        error={Boolean(visibleErrors.host_threshold_percent)}
      >
        {visibleErrors.host_threshold_percent ?? THRESHOLD_HINTS.host}
      </RuntimeThresholdHint>
    </RuntimeThreshold>
  );

  const renderWorkerThreshold = () => {
    const isPercent = value.worker_threshold_type === 'PERCENT';
    const isMb = value.worker_threshold_type === 'ABSOLUTE_MB';
    const thresholdError = isPercent
      ? visibleErrors.worker_threshold_percent
      : isMb
        ? visibleErrors.worker_threshold_mb
        : undefined;
    const hintError = visibleErrors.worker_threshold_type ?? thresholdError;

    return (
      <RuntimeThreshold>
        <RuntimeThresholdRow>
          {isPercent || isMb ? (
            <ThresholdInput
              label='Порог памяти воркера'
              value={
                isPercent
                  ? value.worker_threshold_percent
                  : value.worker_threshold_mb
              }
              unit={isPercent ? '%' : 'MB'}
              error={Boolean(thresholdError)}
              disabled={disabled}
              min={0}
              max={isPercent ? 100 : undefined}
              onChange={nextValue =>
                onChange(
                  isPercent
                    ? { ...value, worker_threshold_percent: nextValue }
                    : { ...value, worker_threshold_mb: nextValue }
                )
              }
            />
          ) : null}
          <RuntimeUnitSegments role='radiogroup' aria-label='Единица порога'>
            {OOM_GUARD_THRESHOLD_TYPE_OPTIONS.map(option => {
              const selected = value.worker_threshold_type === option.value;

              return (
                <RuntimeUnitSegment
                  key={option.value}
                  disableRipple
                  role='radio'
                  aria-checked={selected}
                  selected={selected}
                  disabled={disabled}
                  onClick={() =>
                    onChange(
                      applyOomGuardWorkerThresholdType(value, option.value)
                    )
                  }
                >
                  {option.label}
                </RuntimeUnitSegment>
              );
            })}
          </RuntimeUnitSegments>
        </RuntimeThresholdRow>
        <RuntimeThresholdHint error={Boolean(hintError)}>
          {hintError ??
            (isMb ? THRESHOLD_HINTS.workerMb : THRESHOLD_HINTS.workerPercent)}
        </RuntimeThresholdHint>
      </RuntimeThreshold>
    );
  };

  return (
    <>
      <RuntimeRadioList role='radiogroup'>
        {OOM_GUARD_MODE_OPTIONS.map(option => {
          const checked = value.mode === option.value;

          return (
            <div key={option.value}>
              <RuntimeRadioOption
                disableRipple
                role='radio'
                aria-checked={checked}
                disabled={disabled}
                onClick={() => {
                  if (!checked) {
                    onChange(applyOomGuardMode(value, option.value));
                  }
                }}
              >
                <RuntimeRadioMark
                  className={RUNTIME_RADIO_MARK_CLASS}
                  data-checked={checked}
                  checked={checked}
                  aria-hidden
                />
                <RuntimeRadioText>
                  <RuntimeRadioName>{option.label}</RuntimeRadioName>
                  <RuntimeRadioDescription>
                    {option.description}
                  </RuntimeRadioDescription>
                </RuntimeRadioText>
              </RuntimeRadioOption>

              {checked && option.value === 'HOST_PRESSURE'
                ? renderHostThreshold()
                : null}
              {checked && option.value === 'WORKER_THRESHOLD'
                ? renderWorkerThreshold()
                : null}
            </div>
          );
        })}
      </RuntimeRadioList>
      {error ? <SettingsFieldError>{error}</SettingsFieldError> : null}
    </>
  );
};

type SelectFieldProps = {
  field: AppSettingsFieldDescriptor;
  value: AppSettingsFormValues[string];
  error?: string | undefined;
  label: string;
  onChange: (value: string) => void;
};

const SelectField = ({
  field,
  value,
  error,
  label,
  onChange,
}: SelectFieldProps) => {
  const options = React.useMemo(
    () => [
      ...(field.nullable || !field.required
        ? [{ value: '', label: 'Не задано' }]
        : []),
      ...field.enumOptions.map(option => ({
        value: option.value,
        label: option.label,
      })),
    ],
    [field]
  );
  const textValue =
    typeof value === 'string' || typeof value === 'number' ? value : '';

  return (
    <>
      <SingleOptionDropdownSelect
        ariaLabel={label}
        value={String(textValue)}
        options={options}
        disabled={!field.runtimeEditable}
        error={Boolean(error)}
        placeholder='Выберите значение'
        popperMinWidth={SELECT_WIDTH}
        sx={selectFieldSx}
        textFieldSx={selectTextFieldSx}
        optionTextSx={selectOptionTextSx}
        onChange={onChange}
      />
      {error ? <SettingsFieldError>{error}</SettingsFieldError> : null}
    </>
  );
};

type RuntimeSettingsFormProps = {
  fields: AppSettingsFieldDescriptor[];
  values: AppSettingsFormValues;
  errors: Partial<Record<string, string>>;
  onChange: (
    field: AppSettingsFieldDescriptor,
    value: AppSettingsFormValues[string]
  ) => void;
  // The values differ from the loaded ones.
  isDirty: boolean;
  isSaving: boolean;
  showSaved: boolean;
};

// Settings one under another with a divider between them, save below.
export const RuntimeSettingsForm = ({
  fields,
  values,
  errors,
  onChange,
  isDirty,
  isSaving,
  showSaved,
}: RuntimeSettingsFormProps) => (
  <SettingsForm spacing={28}>
    {fields.map((field, index) => {
      const copy = RUNTIME_FIELD_COPY[field.key];
      const label = copy?.label ?? field.label;
      const description = copy?.description ?? field.description;

      return (
        <React.Fragment key={field.key}>
          {index > 0 ? <RuntimeSectionDivider /> : null}
          <section aria-label={label}>
            <RuntimeSectionTitle>{label}</RuntimeSectionTitle>
            {description ? (
              <RuntimeSectionDescription>
                {description}
              </RuntimeSectionDescription>
            ) : null}
            <RuntimeSectionControl>
              {field.kind === 'oom_guard' ? (
                <OomGuardField
                  value={normalizeOomGuardSettingsFormValue(values[field.key])}
                  error={errors[field.key]}
                  disabled={!field.runtimeEditable}
                  onChange={value => onChange(field, value)}
                />
              ) : field.kind === 'select' ? (
                <SelectField
                  field={field}
                  value={values[field.key]}
                  error={errors[field.key]}
                  label={label}
                  onChange={value => onChange(field, value)}
                />
              ) : null}
            </RuntimeSectionControl>
          </section>
        </React.Fragment>
      );
    })}

    <SettingsSaveRow
      isDirty={isDirty}
      isSaving={isSaving}
      showSaved={showSaved}
    />
  </SettingsForm>
);
