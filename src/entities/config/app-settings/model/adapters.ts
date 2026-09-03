import type {
  AppSettingsDefinition,
  AppSettingsFieldDescriptor,
  AppSettingsFormErrors,
  AppSettingsFormValue,
  AppSettingsFormValues,
  AppSettingsGroup,
  AppSettingsNamespace,
  AppSettingsRecord,
  AppSettingsSelectOption,
  AppSettingsUpdatePayload,
  OomGuardMode,
  OomGuardSettingsFormErrors,
  OomGuardSettingsFormValue,
  OomGuardSettingsPayload,
  OomGuardWorkerThresholdType,
} from './types';

const DEFAULT_GROUP_LABEL = 'Основные';
const OOM_GUARD_NAMESPACE = 'runtime';
const OOM_GUARD_KEY = 'oom_guard';
const OOM_GUARD_FULL_KEY = `${OOM_GUARD_NAMESPACE}.${OOM_GUARD_KEY}`;

const OOM_GUARD_MODES = new Set<OomGuardMode>([
  'DISABLED',
  'HOST_PRESSURE',
  'WORKER_THRESHOLD',
]);
const OOM_GUARD_THRESHOLD_TYPES = new Set<OomGuardWorkerThresholdType>([
  'PERCENT',
  'ABSOLUTE_MB',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toTitleCase = (value: string): string =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, char => char.toUpperCase());

export const humanizeAppSettingsName = (value: string): string =>
  toTitleCase(value).length > 0 ? toTitleCase(value) : value;

const normalizeNumberConstraint = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const normalizeStringConstraint = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const stringifySchemaValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  ) {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const createSelectOption = (
  rawValue: unknown,
  index: number
): AppSettingsSelectOption => {
  const label = stringifySchemaValue(rawValue);

  return {
    value: `${index}:${label}`,
    label: label.length > 0 ? label : 'Пустая строка',
    rawValue,
  };
};

const areOptionRawValuesEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) {
    return true;
  }

  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
};

const uniqueSelectOptions = (values: unknown[]): AppSettingsSelectOption[] => {
  const rawValues: unknown[] = [];

  values.forEach(value => {
    if (
      !rawValues.some(existingValue =>
        areOptionRawValuesEqual(existingValue, value)
      )
    ) {
      rawValues.push(value);
    }
  });

  return rawValues.map(createSelectOption);
};

const getSchemaRefValue = (
  schema: Record<string, unknown>,
  rootSchema: Record<string, unknown>,
  depth = 0
): Record<string, unknown> | null => {
  if (depth > 10) {
    return null;
  }

  const ref = schema['$ref'];

  if (typeof ref !== 'string' || !ref.startsWith('#/')) {
    return schema;
  }

  const refPath = ref
    .slice(2)
    .split('/')
    .map(segment => segment.replace(/~1/g, '/').replace(/~0/g, '~'));
  let current: unknown = rootSchema;

  for (const segment of refPath) {
    if (!isRecord(current)) {
      return null;
    }

    current = current[segment];
  }

  if (!isRecord(current)) {
    return null;
  }

  return getSchemaRefValue(current, rootSchema, depth + 1);
};

const getSchemaVariants = (
  schema: Record<string, unknown>,
  rootSchema: Record<string, unknown>
): Record<string, unknown>[] => {
  const resolvedSchema = getSchemaRefValue(schema, rootSchema) ?? schema;
  const variants = [
    resolvedSchema['anyOf'],
    resolvedSchema['oneOf'],
    resolvedSchema['variants'],
    resolvedSchema['union'],
  ].find(Array.isArray);

  return Array.isArray(variants) ? variants.filter(isRecord) : [];
};

const getSchemaEnumValues = (
  schema: Record<string, unknown>
): unknown[] | null => {
  if (Array.isArray(schema['enum'])) {
    return schema['enum'];
  }

  if (Array.isArray(schema['values'])) {
    return schema['values'];
  }

  if (Array.isArray(schema['literals'])) {
    return schema['literals'];
  }

  if (Array.isArray(schema['choices'])) {
    return schema['choices'];
  }

  if (Array.isArray(schema['options'])) {
    return schema['options'].map(option =>
      isRecord(option) && 'value' in option ? option['value'] : option
    );
  }

  if ('const' in schema) {
    return [schema['const']];
  }

  if ('literal' in schema) {
    return [schema['literal']];
  }

  if ('value' in schema && schema['type'] === 'literal') {
    return [schema['value']];
  }

  return null;
};

const getSelectOptionsFromSchema = (
  schema: unknown,
  rootSchema: Record<string, unknown> | null = isRecord(schema) ? schema : null
): AppSettingsSelectOption[] => {
  if (!isRecord(schema) || !rootSchema) {
    return [];
  }

  const resolvedSchema = getSchemaRefValue(schema, rootSchema) ?? schema;
  const enumValues = getSchemaEnumValues(resolvedSchema);

  if (enumValues) {
    return uniqueSelectOptions(enumValues);
  }

  const variantOptions = getSchemaVariants(resolvedSchema, rootSchema).flatMap(
    variant => getSelectOptionsFromSchema(variant, rootSchema)
  );

  return uniqueSelectOptions(variantOptions.map(option => option.rawValue));
};

const addSchemaTypes = (
  target: Set<string>,
  schema: Record<string, unknown>,
  rootSchema: Record<string, unknown>
) => {
  const resolvedSchema = getSchemaRefValue(schema, rootSchema) ?? schema;
  const variants = getSchemaVariants(resolvedSchema, rootSchema);

  if (variants.length > 0) {
    variants.forEach(variant => addSchemaTypes(target, variant, rootSchema));
    return;
  }

  const enumValues = getSchemaEnumValues(resolvedSchema);

  if (enumValues) {
    enumValues.forEach(value => {
      const typeName = value === null ? 'null' : typeof value;
      target.add(typeName === 'number' ? 'number' : typeName);
    });
    return;
  }

  const rawType = resolvedSchema['type'];

  if (Array.isArray(rawType)) {
    rawType.forEach(item => {
      if (typeof item === 'string') {
        target.add(item);
      }
    });
    return;
  }

  if (typeof rawType === 'string') {
    target.add(rawType);
    return;
  }

  if (isRecord(resolvedSchema['properties'])) {
    target.add('object');
    return;
  }

  if (isRecord(resolvedSchema['items'])) {
    target.add('array');
    return;
  }

  const title = resolvedSchema['title'];

  if (typeof title === 'string' && title.trim().length > 0) {
    target.add(title.toLowerCase());
  }
};

const getSchemaTypes = (schema: unknown): Set<string> => {
  const types = new Set<string>();

  if (typeof schema === 'string') {
    types.add(schema.toLowerCase());
    return types;
  }

  if (isRecord(schema)) {
    addSchemaTypes(types, schema, schema);
  }

  types.delete('null');
  return types;
};

const typeSetHas = (types: Set<string>, fragments: string[]): boolean =>
  Array.from(types).some(type =>
    fragments.some(fragment => type.includes(fragment))
  );

const resolveJsonSchemaFieldKind = (
  valueType: AppSettingsDefinition['value_type'],
  key: string
): Pick<AppSettingsFieldDescriptor, 'kind' | 'enumOptions'> => {
  const enumOptions = getSelectOptionsFromSchema(valueType);

  if (enumOptions.length > 0) {
    return {
      kind: 'select',
      enumOptions,
    };
  }

  const types = getSchemaTypes(valueType);

  if (types.size > 1) {
    return {
      kind: 'json',
      enumOptions: [],
    };
  }

  if (typeSetHas(types, ['bool', 'boolean'])) {
    return {
      kind: 'boolean',
      enumOptions: [],
    };
  }

  if (typeSetHas(types, ['int', 'integer', 'float', 'number', 'decimal'])) {
    return {
      kind: 'number',
      enumOptions: [],
    };
  }

  if (
    typeSetHas(types, ['object', 'dict', 'json', 'array', 'list']) ||
    key.endsWith('_settings')
  ) {
    return {
      kind: 'json',
      enumOptions: [],
    };
  }

  return {
    kind: 'text',
    enumOptions: [],
  };
};

export const getAppSettingsDefinitionPath = (
  definition: Pick<AppSettingsDefinition, 'key' | 'namespace'>
): string[] => {
  const keyParts = definition.key.split('.').filter(Boolean);

  if (keyParts.length > 0 && keyParts[0] === definition.namespace) {
    return keyParts;
  }

  return [definition.namespace, ...keyParts];
};

const getRelativePath = (
  definition: Pick<AppSettingsDefinition, 'key' | 'namespace'>
): string[] => {
  const path = getAppSettingsDefinitionPath(definition);
  return path[0] === definition.namespace ? path.slice(1) : path;
};

const getNestedValue = (
  source: Record<string, unknown>,
  path: string[]
): unknown => {
  let current: unknown = source;

  for (const segment of path) {
    if (!isRecord(current)) {
      return undefined;
    }

    current = current[segment];
  }

  return current;
};

const setNestedValue = (
  target: Record<string, unknown>,
  path: string[],
  value: unknown
) => {
  if (path.length === 0) {
    return;
  }

  let current = target;

  path.slice(0, -1).forEach(segment => {
    const existing = current[segment];

    if (!isRecord(existing)) {
      current[segment] = {};
    }

    current = current[segment] as Record<string, unknown>;
  });

  current[path[path.length - 1]] = value;
};

export const getAppSettingsDefinitionValue = (
  settings: AppSettingsRecord | null,
  definition: AppSettingsDefinition
): unknown => {
  if (!settings) {
    return definition.default;
  }

  const pathValue = getNestedValue(
    settings as Record<string, unknown>,
    getAppSettingsDefinitionPath(definition)
  );

  if (pathValue !== undefined) {
    return pathValue;
  }

  const directValue = (settings as Record<string, unknown>)[definition.key];
  return directValue !== undefined ? directValue : definition.default;
};

const getAppSettingsFieldValue = (
  settings: AppSettingsRecord | null,
  field: AppSettingsFieldDescriptor
): unknown => {
  if (!settings) {
    return field.defaultValue;
  }

  const pathValue = getNestedValue(settings as Record<string, unknown>, [
    field.namespace,
    ...field.relativePath,
  ]);

  if (pathValue !== undefined) {
    return pathValue;
  }

  const directValue = (settings as Record<string, unknown>)[field.key];
  return directValue !== undefined ? directValue : field.defaultValue;
};

const resolveFieldControl = (
  definition: AppSettingsDefinition
): Pick<AppSettingsFieldDescriptor, 'kind' | 'enumOptions'> => {
  const key = definition.key.toLowerCase();
  const setupType = definition.setup_type.toLowerCase();

  if (
    definition.namespace === OOM_GUARD_NAMESPACE &&
    (definition.key === OOM_GUARD_KEY || definition.key === OOM_GUARD_FULL_KEY)
  ) {
    return {
      kind: 'oom_guard',
      enumOptions: [],
    };
  }

  if (definition.secret || setupType.includes('password')) {
    return {
      kind: 'password',
      enumOptions: [],
    };
  }

  return resolveJsonSchemaFieldKind(definition.value_type, key);
};

export const createAppSettingsFieldDescriptor = (
  definition: AppSettingsDefinition
): AppSettingsFieldDescriptor => {
  const fieldControl = resolveFieldControl(definition);

  return {
    key: definition.key,
    namespace: definition.namespace,
    relativePath: getRelativePath(definition),
    label:
      definition.setup_label?.trim() ||
      definition.name.trim() ||
      humanizeAppSettingsName(definition.key),
    description: definition.description ?? null,
    group: definition.group ?? null,
    kind: fieldControl.kind,
    valueType: definition.value_type,
    enumOptions: fieldControl.enumOptions,
    nullable: definition.nullable,
    required: definition.required,
    runtimeEditable: definition.runtime_editable,
    secret: definition.secret,
    readEnv: definition.read_env,
    envVar: definition.env_var ?? null,
    defaultValue: definition.default,
    ge: normalizeNumberConstraint(definition.ge),
    le: normalizeNumberConstraint(definition.le),
    minLength: normalizeStringConstraint(definition.min_length),
    maxLength: normalizeStringConstraint(definition.max_length),
  };
};

export const buildAppSettingsNamespaces = (
  definitions: AppSettingsDefinition[]
): AppSettingsNamespace[] => {
  const namespaces = new Map<
    string,
    { label: string; groups: Map<string, AppSettingsGroup> }
  >();

  definitions.forEach(definition => {
    const field = createAppSettingsFieldDescriptor(definition);
    const namespaceEntry =
      namespaces.get(field.namespace) ??
      ({
        label: humanizeAppSettingsName(field.namespace),
        groups: new Map<string, AppSettingsGroup>(),
      } satisfies { label: string; groups: Map<string, AppSettingsGroup> });
    const groupId = field.group ?? '__default__';
    const groupEntry =
      namespaceEntry.groups.get(groupId) ??
      ({
        id: groupId,
        label: field.group?.trim() || DEFAULT_GROUP_LABEL,
        fields: [],
      } satisfies AppSettingsGroup);

    groupEntry.fields.push(field);
    namespaceEntry.groups.set(groupId, groupEntry);
    namespaces.set(field.namespace, namespaceEntry);
  });

  return Array.from(namespaces.entries()).map(([id, namespace]) => ({
    id,
    label: namespace.label,
    groups: Array.from(namespace.groups.values()),
  }));
};

export const findAppSettingsNamespace = (
  definitions: AppSettingsDefinition[],
  namespaceId: string | null | undefined
): AppSettingsNamespace | null => {
  if (!namespaceId) {
    return null;
  }

  return (
    buildAppSettingsNamespaces(definitions).find(
      namespace => namespace.id === namespaceId
    ) ?? null
  );
};

export const createDefaultOomGuardSettingsFormValue =
  (): OomGuardSettingsFormValue => ({
    mode: 'DISABLED',
    host_threshold_percent: '',
    worker_threshold_type: '',
    worker_threshold_percent: '',
    worker_threshold_mb: '',
  });

const normalizeNumericFormValue = (value: unknown): number | string => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value;
  }

  return '';
};

const normalizeOomGuardMode = (value: unknown): OomGuardMode =>
  OOM_GUARD_MODES.has(value as OomGuardMode)
    ? (value as OomGuardMode)
    : 'DISABLED';

const normalizeOomGuardWorkerThresholdType = (
  value: unknown
): OomGuardWorkerThresholdType | '' =>
  OOM_GUARD_THRESHOLD_TYPES.has(value as OomGuardWorkerThresholdType)
    ? (value as OomGuardWorkerThresholdType)
    : '';

export const normalizeOomGuardSettingsFormValue = (
  value: unknown
): OomGuardSettingsFormValue => {
  const defaults = createDefaultOomGuardSettingsFormValue();

  if (!isRecord(value)) {
    return defaults;
  }

  const mode = normalizeOomGuardMode(value['mode']);
  const inferredWorkerThresholdType =
    normalizeOomGuardWorkerThresholdType(value['worker_threshold_type']) ||
    (value['worker_threshold_percent'] != null
      ? 'PERCENT'
      : value['worker_threshold_mb'] != null
        ? 'ABSOLUTE_MB'
        : '');

  return {
    mode,
    host_threshold_percent:
      mode === 'HOST_PRESSURE'
        ? normalizeNumericFormValue(value['host_threshold_percent'])
        : '',
    worker_threshold_type:
      mode === 'WORKER_THRESHOLD' ? inferredWorkerThresholdType : '',
    worker_threshold_percent:
      mode === 'WORKER_THRESHOLD' && inferredWorkerThresholdType === 'PERCENT'
        ? normalizeNumericFormValue(value['worker_threshold_percent'])
        : '',
    worker_threshold_mb:
      mode === 'WORKER_THRESHOLD' &&
      inferredWorkerThresholdType === 'ABSOLUTE_MB'
        ? normalizeNumericFormValue(value['worker_threshold_mb'])
        : '',
  };
};

const parseNumericInput = (
  value: number | string
): number | null | typeof Number.NaN => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : Number.NaN;
  }

  if (value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

export const validateOomGuardSettingsFormValue = (
  value: OomGuardSettingsFormValue
): OomGuardSettingsFormErrors => {
  const errors: OomGuardSettingsFormErrors = {};

  if (value.mode === 'HOST_PRESSURE') {
    const threshold = parseNumericInput(value.host_threshold_percent);

    if (threshold === null) {
      errors.host_threshold_percent = 'Укажите порог общей памяти.';
    } else if (Number.isNaN(threshold)) {
      errors.host_threshold_percent = 'Порог общей памяти должен быть числом.';
    } else if (threshold <= 0 || threshold > 100) {
      errors.host_threshold_percent =
        'Порог общей памяти должен быть больше 0 и не больше 100.';
    }
  }

  if (value.mode === 'WORKER_THRESHOLD') {
    if (!value.worker_threshold_type) {
      errors.worker_threshold_type = 'Выберите тип порога воркера.';
    }

    if (value.worker_threshold_type === 'PERCENT') {
      const threshold = parseNumericInput(value.worker_threshold_percent);

      if (threshold === null) {
        errors.worker_threshold_percent =
          'Укажите процентный порог памяти воркера.';
      } else if (Number.isNaN(threshold)) {
        errors.worker_threshold_percent =
          'Порог памяти воркера должен быть числом.';
      } else if (threshold <= 0 || threshold > 100) {
        errors.worker_threshold_percent =
          'Порог памяти воркера должен быть больше 0 и не больше 100.';
      }
    }

    if (value.worker_threshold_type === 'ABSOLUTE_MB') {
      const threshold = parseNumericInput(value.worker_threshold_mb);

      if (threshold === null) {
        errors.worker_threshold_mb = 'Укажите лимит памяти воркера в MB.';
      } else if (Number.isNaN(threshold)) {
        errors.worker_threshold_mb = 'Лимит памяти воркера должен быть числом.';
      } else if (!Number.isInteger(threshold) || threshold <= 0) {
        errors.worker_threshold_mb =
          'Лимит памяти воркера должен быть целым числом больше 0.';
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    errors._form = 'Проверьте настройки OOM Guard.';
  }

  return errors;
};

const buildOomGuardSettingsPayload = (
  value: OomGuardSettingsFormValue
): OomGuardSettingsPayload => {
  if (value.mode === 'HOST_PRESSURE') {
    return {
      mode: 'HOST_PRESSURE',
      host_threshold_percent: Number(value.host_threshold_percent),
    };
  }

  if (
    value.mode === 'WORKER_THRESHOLD' &&
    value.worker_threshold_type === 'PERCENT'
  ) {
    return {
      mode: 'WORKER_THRESHOLD',
      worker_threshold_type: 'PERCENT',
      worker_threshold_percent: Number(value.worker_threshold_percent),
    };
  }

  if (
    value.mode === 'WORKER_THRESHOLD' &&
    value.worker_threshold_type === 'ABSOLUTE_MB'
  ) {
    return {
      mode: 'WORKER_THRESHOLD',
      worker_threshold_type: 'ABSOLUTE_MB',
      worker_threshold_mb: Number(value.worker_threshold_mb),
    };
  }

  return {
    mode: 'DISABLED',
  };
};

const normalizeFieldValue = (
  value: unknown,
  field: AppSettingsFieldDescriptor
): AppSettingsFormValue => {
  if (field.kind === 'oom_guard') {
    return normalizeOomGuardSettingsFormValue(value);
  }

  if (field.kind === 'boolean') {
    return typeof value === 'boolean' ? value : false;
  }

  if (field.kind === 'number') {
    return typeof value === 'number' || typeof value === 'string' ? value : '';
  }

  if (field.kind === 'select') {
    if (value === null || value === undefined) {
      return '';
    }

    const option = field.enumOptions.find(item =>
      areOptionRawValuesEqual(item.rawValue, value)
    );

    return option?.value ?? stringifySchemaValue(value);
  }

  if (field.kind === 'json') {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  }

  return typeof value === 'string' ? value : '';
};

export const createAppSettingsFormValues = ({
  settings,
  fields,
}: {
  settings: AppSettingsRecord | null;
  fields: AppSettingsFieldDescriptor[];
}): AppSettingsFormValues =>
  fields.reduce<AppSettingsFormValues>((acc, field) => {
    acc[field.key] = normalizeFieldValue(
      getAppSettingsFieldValue(settings, field),
      field
    );
    return acc;
  }, {});

const isBlankString = (value: AppSettingsFormValue | undefined): boolean =>
  typeof value === 'string' && value.trim().length === 0;

export const validateAppSettingsFormValues = ({
  values,
  fields,
}: {
  values: AppSettingsFormValues;
  fields: AppSettingsFieldDescriptor[];
}): AppSettingsFormErrors =>
  fields.reduce<AppSettingsFormErrors>((acc, field) => {
    if (!field.runtimeEditable) {
      return acc;
    }

    const value = values[field.key];

    if (field.kind === 'oom_guard') {
      const nextValue = normalizeOomGuardSettingsFormValue(value);
      const oomErrors = validateOomGuardSettingsFormValue(nextValue);

      if (oomErrors._form) {
        acc[field.key] = oomErrors._form;
      }

      return acc;
    }

    if (field.kind === 'number') {
      const isEmpty = value === '' || value === undefined;

      if (field.required && isEmpty) {
        acc[field.key] = `${field.label} обязательно для заполнения.`;
        return acc;
      }

      if (!isEmpty) {
        const numberValue = Number(value);

        if (Number.isNaN(numberValue)) {
          acc[field.key] = `${field.label} должно быть числом.`;
          return acc;
        }

        if (field.ge != null && numberValue < field.ge) {
          acc[field.key] = `${field.label} должно быть не меньше ${field.ge}.`;
          return acc;
        }

        if (field.le != null && numberValue > field.le) {
          acc[field.key] = `${field.label} должно быть не больше ${field.le}.`;
        }
      }

      return acc;
    }

    if (field.kind === 'json') {
      if (field.required && isBlankString(value)) {
        acc[field.key] = `${field.label} обязательно для заполнения.`;
        return acc;
      }

      if (!isBlankString(value)) {
        try {
          JSON.parse(String(value));
        } catch {
          acc[field.key] = `${field.label} должно быть валидным JSON.`;
        }
      }

      return acc;
    }

    if (field.kind === 'select') {
      if (field.required && isBlankString(value)) {
        acc[field.key] = `${field.label} обязательно для заполнения.`;
      }

      return acc;
    }

    if (
      (field.kind === 'text' || field.kind === 'password') &&
      field.required &&
      isBlankString(value)
    ) {
      acc[field.key] = `${field.label} обязательно для заполнения.`;
      return acc;
    }

    if (typeof value === 'string') {
      if (field.minLength != null && value.length < field.minLength) {
        acc[field.key] =
          `${field.label} должно быть не короче ${field.minLength} символов.`;
        return acc;
      }

      if (field.maxLength != null && value.length > field.maxLength) {
        acc[field.key] =
          `${field.label} должно быть не длиннее ${field.maxLength} символов.`;
      }
    }

    return acc;
  }, {});

const buildFieldPayloadValue = (
  field: AppSettingsFieldDescriptor,
  value: AppSettingsFormValue | undefined
): unknown => {
  if (field.kind === 'oom_guard') {
    return buildOomGuardSettingsPayload(
      normalizeOomGuardSettingsFormValue(value)
    );
  }

  if (field.kind === 'boolean') {
    return Boolean(value);
  }

  if (field.kind === 'number') {
    if (value === '' || value === undefined) {
      return field.nullable ? null : undefined;
    }

    return Number(value);
  }

  if (field.kind === 'select') {
    if (value === '' || value === undefined) {
      return field.nullable ? null : undefined;
    }

    const option = field.enumOptions.find(item => item.value === value);
    return option ? option.rawValue : value;
  }

  if (field.kind === 'json') {
    if (value === '' || value === undefined) {
      return field.nullable ? null : undefined;
    }

    return JSON.parse(String(value));
  }

  if (typeof value !== 'string') {
    return field.nullable ? null : '';
  }

  if (value.length === 0 && field.nullable) {
    return null;
  }

  return value;
};

export const buildAppSettingsNamespaceUpdatePayload = ({
  namespace,
  values,
  fields,
}: {
  namespace: string;
  values: AppSettingsFormValues;
  fields: AppSettingsFieldDescriptor[];
}): AppSettingsUpdatePayload => {
  const namespacePayload: Record<string, unknown> = {};

  fields.forEach(field => {
    if (field.namespace !== namespace || !field.runtimeEditable) {
      return;
    }

    const value = buildFieldPayloadValue(field, values[field.key]);

    if (value === undefined) {
      return;
    }

    setNestedValue(namespacePayload, field.relativePath, value);
  });

  return {
    [namespace]: namespacePayload,
  } as AppSettingsUpdatePayload;
};
