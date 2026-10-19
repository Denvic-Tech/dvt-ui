import { describe, expect, it } from 'vitest';

import type { ImportPreviewSchema } from '@/shared/gatewayClient';

import {
  buildImportRequest,
  createInitialDecisions,
  formatVariableValue,
  parseVariableValue,
} from '../importRequest';

const createPreview = (
  overrides: Partial<ImportPreviewSchema> = {}
): ImportPreviewSchema => ({
  manifest: {
    format_version: 1,
    dvt_version: '1.2.3',
    exported_at: '2026-10-16T10:00:00Z',
    source_instance_id: 'instance-1',
    options: {},
    has_secrets: true,
  },
  folders: [],
  projects: [
    {
      ref: 'proj-1',
      name: 'Alpha',
      folder_ref: null,
      node_count: 3,
      edge_count: 2,
      subgraph_count: 0,
      files_total_size: 0,
      variables: [
        {
          key: 'host',
          value: { type: 'STRING', value: 'localhost', is_list_type: false },
          conflicts_with_existing: true,
        },
        {
          key: 'limit',
          value: { type: 'INT', value: 10, is_list_type: false },
          conflicts_with_existing: false,
        },
        {
          key: 'tags',
          value: { type: 'STRING', value: ['a', 'b'], is_list_type: true },
          conflicts_with_existing: true,
        },
      ],
      has_schedule_in_bundle: true,
      has_existing_schedule: true,
    },
  ],
  connections: [
    {
      ref: 'conn-1',
      name: 'Postgres main',
      kind: 'sql',
      type: 'postgres',
      inaccessible: false,
      has_secrets_in_bundle: true,
      candidates: [{ id: 'c-10', name: 'pg', kind: 'sql', type: 'postgres' }],
    },
    {
      ref: 'conn-2',
      name: 'S3 files',
      kind: 'file',
      type: 's3',
      inaccessible: true,
      has_secrets_in_bundle: false,
      candidates: [],
    },
    {
      ref: 'conn-3',
      name: 'Kafka',
      kind: 'queue',
      type: 'kafka',
      inaccessible: false,
      has_secrets_in_bundle: false,
      candidates: [],
    },
  ],
  unknown_node_names: [],
  unavailable_extensions: [],
  target_has_graph: true,
  can_manage_schedules: true,
  warnings: [],
  ...overrides,
});

describe('features/project-transfer/lib/importRequest', () => {
  describe('formatVariableValue / parseVariableValue', () => {
    it('keeps scalar strings as-is and serializes other types as JSON', () => {
      expect(
        formatVariableValue({
          type: 'STRING',
          value: 'abc',
          is_list_type: false,
        })
      ).toBe('abc');
      expect(formatVariableValue({ type: 'INT', value: 10 })).toBe('10');
      expect(
        formatVariableValue({
          type: 'STRING',
          value: ['a'],
          is_list_type: true,
        })
      ).toBe('["a"]');
      expect(formatVariableValue(null)).toBe('');
    });

    it('parses values back without changing type and is_list_type', () => {
      expect(
        parseVariableValue('new', {
          type: 'STRING',
          value: 'old',
          is_list_type: false,
        })
      ).toEqual({
        value: { type: 'STRING', value: 'new', is_list_type: false },
      });
      expect(parseVariableValue('42', { type: 'INT', value: 1 })).toEqual({
        value: { type: 'INT', value: 42 },
      });
      expect(parseVariableValue('{bad', { type: 'JSON', value: {} })).toEqual({
        error: 'Значение должно быть корректным JSON',
      });
    });
  });

  describe('createInitialDecisions', () => {
    it('creates connections and appends to the graph by default', () => {
      const decisions = createInitialDecisions(createPreview());

      expect(decisions.mergeStrategy).toBe('append');
      expect(decisions.connections['conn-1']?.action).toBe('create');
      expect(decisions.connections['conn-3']?.action).toBe('create');
      expect(decisions.variables['proj-1']?.['host']?.valueText).toBe(
        'localhost'
      );
      expect(decisions.schedule.importSchedule).toBe(false);
    });

    it('maps or skips connections that cannot be created', () => {
      const decisions = createInitialDecisions(
        createPreview({
          connections: [
            {
              ref: 'conn-a',
              name: 'S3 files',
              kind: 'file',
              type: 's3',
              inaccessible: true,
              has_secrets_in_bundle: false,
              candidates: [
                { id: 'c-s3', name: 'S3 files', kind: 'file', type: 's3' },
              ],
            },
            {
              ref: 'conn-b',
              name: 'S3 other',
              kind: 'file',
              type: 's3',
              inaccessible: true,
              has_secrets_in_bundle: false,
              candidates: [
                { id: 'c-s3', name: 'S3 files', kind: 'file', type: 's3' },
              ],
            },
          ],
        })
      );

      expect(decisions.connections['conn-a']).toEqual({
        action: 'use_existing',
        connectionId: 'c-s3',
        secretsText: '',
      });
      expect(decisions.connections['conn-b']?.action).toBe('skip');
    });
  });

  describe('buildImportRequest', () => {
    it('builds a create request with only non-default decisions', () => {
      const preview = createPreview({ target_has_graph: false });
      const decisions = createInitialDecisions(preview);
      decisions.passphrase = 'secret-pass';
      decisions.connections['conn-1'] = {
        action: 'create',
        connectionId: null,
        secretsText: '{"password": "ignored because of passphrase"}',
      };
      decisions.connections['conn-2'] = {
        action: 'use_existing',
        connectionId: 'c-99',
        secretsText: '',
      };
      decisions.connections['conn-3'] = {
        action: 'create',
        connectionId: null,
        secretsText: '{"password": "pw"}',
      };
      decisions.variables['proj-1']!['host']!.valueText = 'remote';
      decisions.variables['proj-1']!['limit']!.valueText = '25';
      decisions.schedule = {
        importSchedule: true,
        enable: true,
        conflict: 'overwrite',
      };

      const { request, issues } = buildImportRequest(
        { mode: 'create', folderId: 'folder-1' },
        preview,
        decisions
      );

      expect(issues).toEqual([]);
      expect(request).toEqual({
        mode: 'create',
        folder_id: 'folder-1',
        project_id: null,
        merge_strategy: 'append',
        passphrase: 'secret-pass',
        connections: {
          'conn-1': { action: 'create' },
          'conn-2': { action: 'use_existing', connection_id: 'c-99' },
          'conn-3': { action: 'create', secrets: { password: 'pw' } },
        },
        variables: {
          'proj-1': {
            host: {
              value: { type: 'STRING', value: 'remote', is_list_type: false },
            },
            limit: { value: { type: 'INT', value: 25, is_list_type: false } },
          },
        },
        schedule: { import_schedule: true, enable: true, conflict: 'keep' },
      });
    });

    it('builds a merge request with conflict decisions and replace strategy', () => {
      const preview = createPreview();
      const decisions = createInitialDecisions(preview);
      decisions.mergeStrategy = 'replace';
      decisions.variables['proj-1']!['host']!.conflict = 'overwrite';
      decisions.variables['proj-1']!['tags']!.conflict = 'keep';
      decisions.variables['proj-1']!['limit']!.conflict = 'overwrite';
      decisions.schedule = {
        importSchedule: true,
        enable: false,
        conflict: 'overwrite',
      };

      const { request, issues } = buildImportRequest(
        { mode: 'merge', projectId: 'project-42' },
        preview,
        decisions
      );

      expect(issues).toEqual([]);
      expect(request.mode).toBe('merge');
      expect(request.project_id).toBe('project-42');
      expect(request.folder_id).toBeNull();
      expect(request.merge_strategy).toBe('replace');
      expect(request.passphrase).toBeNull();
      expect(request.connections).toEqual({
        'conn-1': { action: 'create' },
        'conn-3': { action: 'create' },
      });
      expect(request.variables).toEqual({
        'proj-1': { host: { conflict: 'overwrite' } },
      });
      expect(request.schedule).toEqual({
        import_schedule: true,
        enable: false,
        conflict: 'overwrite',
      });
    });

    it('omits variables and schedule when nothing changed', () => {
      const preview = createPreview({ target_has_graph: false });
      const decisions = createInitialDecisions(preview);

      const { request, issues } = buildImportRequest(
        { mode: 'merge', projectId: 'project-42' },
        preview,
        decisions
      );

      expect(issues).toEqual([]);
      expect(request.variables).toEqual({});
      expect(request.schedule).toEqual({
        import_schedule: false,
        enable: false,
        conflict: 'keep',
      });
    });

    it('ignores the schedule block when the user cannot manage schedules', () => {
      const preview = createPreview({
        target_has_graph: false,
        can_manage_schedules: false,
      });
      const decisions = createInitialDecisions(preview);
      decisions.schedule = {
        importSchedule: true,
        enable: true,
        conflict: 'keep',
      };

      const { request } = buildImportRequest(
        { mode: 'create', folderId: null },
        preview,
        decisions
      );

      expect(request.schedule?.import_schedule).toBe(false);
    });

    it('reports validation issues instead of sending a broken payload', () => {
      const preview = createPreview();
      const decisions = createInitialDecisions(preview);
      decisions.mergeStrategy = null;
      decisions.connections['conn-1'] = {
        action: 'use_existing',
        connectionId: null,
        secretsText: '',
      };
      decisions.connections['conn-2'] = {
        action: 'create',
        connectionId: null,
        secretsText: '',
      };
      decisions.connections['conn-3'] = {
        action: 'create',
        connectionId: null,
        secretsText: '[1, 2]',
      };
      decisions.variables['proj-1']!['limit']!.valueText = 'not json';

      const { request, issues } = buildImportRequest(
        { mode: 'merge', projectId: 'project-42' },
        preview,
        decisions
      );

      expect(issues.map(issue => issue.field)).toEqual([
        'merge_strategy',
        'connections.conn-1',
        'connections.conn-2',
        'connections.conn-3',
        'variables.proj-1.limit',
      ]);
      expect(request.connections).toEqual({});
      expect(request.variables).toEqual({});
    });
  });
});
