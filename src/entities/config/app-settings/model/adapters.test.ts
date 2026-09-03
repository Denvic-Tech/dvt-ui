import { describe, expect, it } from 'vitest';

import {
  buildAppSettingsNamespaces,
  buildAppSettingsNamespaceUpdatePayload,
  createAppSettingsFormValues,
  validateAppSettingsFormValues,
} from './adapters';
import type { AppSettingsDefinition, AppSettingsRecord } from './types';

const defineSetting = (
  overrides: Partial<AppSettingsDefinition> & Pick<AppSettingsDefinition, 'key'>
): AppSettingsDefinition => {
  const definition: AppSettingsDefinition = {
    key: overrides.key,
    namespace: overrides.namespace ?? 'runtime',
    group: overrides.group ?? null,
    name: overrides.name ?? overrides.key,
    value_type: overrides.value_type ?? { type: 'string' },
    nullable: overrides.nullable ?? true,
    description: overrides.description ?? null,
    secret: overrides.secret ?? false,
    runtime_editable: overrides.runtime_editable ?? true,
    bootstrap: overrides.bootstrap ?? false,
    required: overrides.required ?? false,
    read_env: overrides.read_env ?? false,
    env_var: overrides.env_var ?? null,
    setup_label: overrides.setup_label ?? null,
    setup_type: overrides.setup_type ?? 'text',
  };

  if ('default' in overrides) {
    definition.default = overrides.default;
  }

  if (overrides.ge !== undefined) {
    definition.ge = overrides.ge;
  }

  if (overrides.le !== undefined) {
    definition.le = overrides.le;
  }

  if (overrides.min_length !== undefined) {
    definition.min_length = overrides.min_length;
  }

  if (overrides.max_length !== undefined) {
    definition.max_length = overrides.max_length;
  }

  return definition;
};

describe('app-settings adapters', () => {
  it('groups definitions by namespace and group in definition order', () => {
    const namespaces = buildAppSettingsNamespaces([
      defineSetting({
        key: 'dcc.url',
        namespace: 'dcc',
        group: 'Connection',
      }),
      defineSetting({
        key: 'license.key',
        namespace: 'license',
      }),
      defineSetting({
        key: 'dcc.username',
        namespace: 'dcc',
        group: 'Credentials',
      }),
    ]);

    expect(namespaces.map(namespace => namespace.id)).toEqual([
      'dcc',
      'license',
    ]);
    expect(namespaces[0].groups.map(group => group.label)).toEqual([
      'Connection',
      'Credentials',
    ]);
  });

  it('creates form values from nested settings and definition defaults', () => {
    const fields = buildAppSettingsNamespaces([
      defineSetting({
        key: 'dcc.url',
        namespace: 'dcc',
      }),
      defineSetting({
        key: 'dcc.enabled',
        namespace: 'dcc',
        value_type: { type: 'boolean' },
        default: true,
      }),
    ])[0].groups[0].fields;

    const values = createAppSettingsFormValues({
      fields,
      settings: {
        dcc: {
          url: 'http://localhost',
        },
      } as AppSettingsRecord,
    });

    expect(values).toEqual({
      'dcc.url': 'http://localhost',
      'dcc.enabled': true,
    });
  });

  it('builds nested namespace payload and skips read-only fields', () => {
    const fields = buildAppSettingsNamespaces([
      defineSetting({
        key: 'dcc.url',
        namespace: 'dcc',
      }),
      defineSetting({
        key: 'dcc.password',
        namespace: 'dcc',
        secret: true,
      }),
      defineSetting({
        key: 'dcc.env_only',
        namespace: 'dcc',
        runtime_editable: false,
      }),
    ])[0].groups[0].fields;

    const payload = buildAppSettingsNamespaceUpdatePayload({
      namespace: 'dcc',
      fields,
      values: {
        'dcc.url': 'http://dcc',
        'dcc.password': 'secret',
        'dcc.env_only': 'ignored',
      },
    });

    expect(payload).toEqual({
      dcc: {
        url: 'http://dcc',
        password: 'secret',
      },
    });
  });

  it('validates numeric constraints', () => {
    const fields = buildAppSettingsNamespaces([
      defineSetting({
        key: 'runtime.timeout',
        namespace: 'runtime',
        value_type: { type: 'integer' },
        ge: 1,
        le: 10,
      }),
    ])[0].groups[0].fields;

    expect(
      validateAppSettingsFormValues({
        fields,
        values: {
          'runtime.timeout': '11',
        },
      })
    ).toEqual({
      'runtime.timeout': 'runtime.timeout должно быть не больше 10.',
    });
  });

  it('serializes OOM Guard as runtime.oom_guard', () => {
    const fields = buildAppSettingsNamespaces([
      defineSetting({
        key: 'runtime.oom_guard',
        namespace: 'runtime',
        value_type: { type: 'object' },
      }),
    ])[0].groups[0].fields;

    const payload = buildAppSettingsNamespaceUpdatePayload({
      namespace: 'runtime',
      fields,
      values: {
        'runtime.oom_guard': {
          mode: 'WORKER_THRESHOLD',
          host_threshold_percent: '',
          worker_threshold_type: 'PERCENT',
          worker_threshold_percent: '75',
          worker_threshold_mb: '',
        },
      },
    });

    expect(payload).toEqual({
      runtime: {
        oom_guard: {
          mode: 'WORKER_THRESHOLD',
          worker_threshold_type: 'PERCENT',
          worker_threshold_percent: 75,
        },
      },
    });
  });

  it('creates select fields from enum schemas and serializes raw option values', () => {
    const fields = buildAppSettingsNamespaces([
      defineSetting({
        key: 'runtime.datetime_precision',
        namespace: 'runtime',
        value_type: {
          enum: ['Nanoseconds', 'Microseconds', 'Seconds'],
          title: 'DateTimePrecision',
          type: 'string',
        },
      }),
    ])[0].groups[0].fields;

    expect(fields[0].kind).toBe('select');
    expect(fields[0].enumOptions.map(option => option.label)).toEqual([
      'Nanoseconds',
      'Microseconds',
      'Seconds',
    ]);

    const values = createAppSettingsFormValues({
      fields,
      settings: {
        runtime: {
          datetime_precision: 'Microseconds',
        },
      } as AppSettingsRecord,
    });

    const payload = buildAppSettingsNamespaceUpdatePayload({
      namespace: 'runtime',
      fields,
      values,
    });

    expect(payload).toEqual({
      runtime: {
        datetime_precision: 'Microseconds',
      },
    });
  });

  it('creates select fields from literal union schemas', () => {
    const fields = buildAppSettingsNamespaces([
      defineSetting({
        key: 'runtime.mode',
        namespace: 'runtime',
        value_type: {
          anyOf: [
            { const: 'dev', type: 'string' },
            { const: 'prod', type: 'string' },
            { type: 'null' },
          ],
        },
      }),
    ])[0].groups[0].fields;

    expect(fields[0].kind).toBe('select');
    expect(fields[0].enumOptions.map(option => option.rawValue)).toEqual([
      'dev',
      'prod',
    ]);
  });

  it('falls back to json for unions without finite options', () => {
    const fields = buildAppSettingsNamespaces([
      defineSetting({
        key: 'runtime.scalar_override',
        namespace: 'runtime',
        value_type: {
          anyOf: [{ type: 'string' }, { type: 'integer' }],
        },
      }),
    ])[0].groups[0].fields;

    expect(fields[0].kind).toBe('json');

    const payload = buildAppSettingsNamespaceUpdatePayload({
      namespace: 'runtime',
      fields,
      values: {
        'runtime.scalar_override': '1',
      },
    });

    expect(payload).toEqual({
      runtime: {
        scalar_override: 1,
      },
    });
  });
});
