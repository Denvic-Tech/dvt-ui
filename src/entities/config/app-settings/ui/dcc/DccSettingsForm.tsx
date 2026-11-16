import * as React from 'react';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

import type {
  AppSettingsFieldDescriptor,
  AppSettingsFormValues,
} from '../../model/types';
import {
  SettingsFieldError,
  SettingsFieldLabel,
  SettingsForm,
  SettingsInput,
  SettingsInputBox,
  SettingsInputButton,
} from '../settings-form/styles';

import { DccFieldPair, DccSaveRow } from './styles';

// Labels of the known DCC fields; others keep the label from the definitions.
const DCC_FIELD_COPY: Record<string, { label: string; placeholder: string }> = {
  url: { label: 'URL', placeholder: 'https://' },
  username: { label: 'Пользователь', placeholder: 'Имя пользователя' },
  password: { label: 'Пароль', placeholder: 'Пароль' },
};

const getFieldName = (field: AppSettingsFieldDescriptor) =>
  field.relativePath[field.relativePath.length - 1]?.toLowerCase() ?? '';

type DccFieldProps = {
  field: AppSettingsFieldDescriptor;
  value: AppSettingsFormValues[string];
  error?: string | undefined;
  onChange: (value: AppSettingsFormValues[string]) => void;
};

const DccField = ({ field, value, error, onChange }: DccFieldProps) => {
  const [showSecretValue, setShowSecretValue] = React.useState(false);
  const name = getFieldName(field);
  const copy = DCC_FIELD_COPY[name];
  const inputId = `dcc-setting-${name || field.key}`;
  const isPassword = field.kind === 'password';
  const textValue =
    typeof value === 'string' || typeof value === 'number' ? value : '';
  const toggleLabel = showSecretValue ? 'Скрыть значение' : 'Показать';

  return (
    <div>
      <SettingsFieldLabel htmlFor={inputId}>
        {copy?.label ?? field.label}
      </SettingsFieldLabel>
      <SettingsInputBox error={Boolean(error)}>
        <SettingsInput
          id={inputId}
          value={textValue}
          placeholder={copy?.placeholder}
          type={isPassword && !showSecretValue ? 'password' : 'text'}
          autoComplete={field.secret ? 'new-password' : 'off'}
          spellCheck={false}
          aria-invalid={Boolean(error)}
          onChange={event => onChange(event.target.value)}
        />
        {isPassword ? (
          <SettingsInputButton
            disableRipple
            aria-label={toggleLabel}
            title={toggleLabel}
            onClick={() => setShowSecretValue(current => !current)}
          >
            {showSecretValue ? (
              <IconEyeOff size={16} stroke={1.4} />
            ) : (
              <IconEye size={16} stroke={1.4} />
            )}
          </SettingsInputButton>
        ) : null}
      </SettingsInputBox>
      {error ? <SettingsFieldError>{error}</SettingsFieldError> : null}
    </div>
  );
};

type DccSettingsFormProps = {
  // Editable DCC fields; the connector ID is shown in the page header.
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

// URL on its own row, the user and the password side by side, save below.
export const DccSettingsForm = ({
  fields,
  values,
  errors,
  onChange,
  isDirty,
  isSaving,
  showSaved,
}: DccSettingsFormProps) => {
  const urlField = fields.find(field => getFieldName(field) === 'url');
  const pairedFields = fields.filter(field =>
    ['username', 'password'].includes(getFieldName(field))
  );
  const otherFields = fields.filter(
    field => field !== urlField && !pairedFields.includes(field)
  );

  const renderField = (field: AppSettingsFieldDescriptor) => (
    <DccField
      key={field.key}
      field={field}
      value={values[field.key]}
      error={errors[field.key]}
      onChange={value => onChange(field, value)}
    />
  );

  return (
    <SettingsForm spacing={16}>
      {urlField ? renderField(urlField) : null}
      {pairedFields.length > 0 ? (
        <DccFieldPair>{pairedFields.map(renderField)}</DccFieldPair>
      ) : null}
      {otherFields.map(renderField)}

      <DccSaveRow isDirty={isDirty} isSaving={isSaving} showSaved={showSaved} />
    </SettingsForm>
  );
};
