import type { SetupStepField } from '@/shared/gatewayClient';

export type SetupFieldScalarKind = 'string' | 'number' | 'boolean';
export type SetupFieldInputKind =
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'switch';

export interface SetupFieldDescriptor {
  key: string;
  label: string;
  required: boolean;
  nullable: boolean;
  scalarKind: SetupFieldScalarKind;
  inputKind: SetupFieldInputKind;
  value?: unknown;
}

export type SetupFormValue = string | number | boolean;
export type SetupFormValues = Partial<Record<string, SetupFormValue>>;
export type SetupFormErrors = Partial<Record<string, string>>;

const resolveScalarKind = (
  fieldType: SetupStepField['type']
): SetupFieldScalarKind => {
  if (fieldType === 'boolean') {
    return 'boolean';
  }

  if (fieldType === 'number') {
    return 'number';
  }

  return 'string';
};

const resolveInputKind = (
  fieldType: SetupStepField['type']
): SetupFieldInputKind => {
  if (fieldType === 'boolean') {
    return 'switch';
  }

  if (fieldType === 'number') {
    return 'number';
  }

  if (fieldType === 'email') {
    return 'email';
  }

  if (fieldType === 'password') {
    return 'password';
  }

  return 'text';
};

const normalizeFieldValue = (
  value: unknown,
  descriptor: SetupFieldDescriptor
): SetupFormValue => {
  if (descriptor.scalarKind === 'boolean') {
    return typeof value === 'boolean' ? value : false;
  }

  if (descriptor.scalarKind === 'number') {
    return typeof value === 'number' ? value : '';
  }

  return typeof value === 'string' ? value : '';
};

const isBlankString = (value: SetupFormValue | undefined): boolean =>
  typeof value === 'string' && value.trim().length === 0;

export const getSetupFieldDescriptors = ({
  fields,
}: {
  fields?: SetupStepField[] | null | undefined;
}): SetupFieldDescriptor[] =>
  (fields ?? []).map(field => ({
    key: field.key,
    label: field.label,
    required: field.required,
    nullable: field.nullable,
    scalarKind: resolveScalarKind(field.type),
    inputKind: resolveInputKind(field.type),
    value: field.value,
  }));

export const createSetupFormValues = ({
  values,
  fields,
}: {
  values?: Record<string, unknown> | null;
  fields: SetupFieldDescriptor[];
}): SetupFormValues =>
  fields.reduce<SetupFormValues>((acc, field) => {
    acc[field.key] = normalizeFieldValue(values?.[field.key] ?? field.value, field);
    return acc;
  }, {});

export const validateSetupFormValues = ({
  values,
  fields,
}: {
  values: SetupFormValues;
  fields: SetupFieldDescriptor[];
}): SetupFormErrors =>
  fields.reduce<SetupFormErrors>((acc, field) => {
    const value = values[field.key];

    if (field.scalarKind === 'number') {
      const isEmpty = value === '' || value === undefined;

      if (field.required && isEmpty) {
        acc[field.key] = `${field.label} is required.`;
        return acc;
      }

      if (!isEmpty && Number.isNaN(Number(value))) {
        acc[field.key] = `${field.label} must be a valid number.`;
      }

      return acc;
    }

    if (field.scalarKind === 'string' && field.required && isBlankString(value)) {
      acc[field.key] = `${field.label} is required.`;
    }

    return acc;
  }, {});

export const buildSetupPayload = ({
  values,
  fields,
}: {
  values: SetupFormValues;
  fields: SetupFieldDescriptor[];
}): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  fields.forEach(field => {
    const value = values[field.key];

    if (field.scalarKind === 'boolean') {
      payload[field.key] = Boolean(value);
      return;
    }

    if (field.scalarKind === 'number') {
      if (value === '' || value === undefined) {
        if (field.nullable) {
          payload[field.key] = null;
        }
        return;
      }

      payload[field.key] = Number(value);
      return;
    }

    if (typeof value !== 'string') {
      payload[field.key] = field.nullable ? null : '';
      return;
    }

    if (value.length === 0 && field.nullable) {
      payload[field.key] = null;
      return;
    }

    payload[field.key] = value;
  });

  return payload;
};
