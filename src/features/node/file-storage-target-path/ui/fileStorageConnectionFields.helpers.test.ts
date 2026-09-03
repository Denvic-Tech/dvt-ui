import { describe, expect, it } from 'vitest';

import type { DBConnectionRecord } from '@/entities/data/db-connection';

import type {
  FtpMetadata,
  NodeDefinition,
  S3Metadata,
} from '@/shared/gatewayClient';
import { makeExpressionValue } from '@/shared/lib/node-input-values';
import type { VariableOutput } from '@/shared/lib/variables';

import {
  buildResolvedFileStoragePickerState,
  getFileStorageOverrideBranch,
  getFileStorageOverrideFields,
  getNormalizedConnectionOverridesValue,
} from './fileStorageConnectionFields.helpers';

const nodeDefinition = {
  input_definitions: {
    connection_overrides: {
      allow_expressions: true,
      expression_policy: 'default',
      schema: {
        oneOf: [
          {
            properties: {
              type: { const: 's3' },
              bucket: { title: 'Bucket' },
              prefix: { title: 'Prefix' },
              verify: {
                title: 'Verify',
                anyOf: [{ type: 'boolean' }, { type: 'null' }],
              },
            },
          },
          {
            properties: {
              type: { const: 'ftp' },
              initial_directory: { title: 'Initial directory' },
            },
          },
          {
            properties: {
              type: { const: 'sftp' },
              initial_directory: { title: 'Initial directory' },
            },
          },
        ],
      },
    },
  },
} as unknown as NodeDefinition;

const makeS3Metadata = (): S3Metadata =>
  ({
    type: 'S3',
    connection_id: 's3-1',
    connection_prefix: 'landing',
    bucket: {
      name: 'raw-bucket',
    },
  }) as S3Metadata;

const makeFtpMetadata = (): FtpMetadata =>
  ({
    type: 'FTP',
    connection_id: 'ftp-1',
    connection_prefix: '/incoming',
    host: 'ftp.local',
  }) as FtpMetadata;

const makeSftpRecord = (): DBConnectionRecord =>
  ({
    id: 'ftp-1',
    name: 'Secure FTP',
    kind: 'file',
    type: 'sftp',
    driver: null,
    driver_options: null,
    properties: {
      initial_directory: '/dropzone',
      host: 'sftp.local',
      username: 'user',
    },
    labels: null,
    metadata: null,
    created_at: null,
    updated_at: null,
    deleted_at: null,
    user_id: null,
    organization_id: null,
    issues: [],
    raw_properties: null,
    raw_driver_options: null,
    raw_secrets: null,
  }) as DBConnectionRecord;

const variables: VariableOutput[] = [
  {
    name: 'resolved_bucket',
    type: 'STRING',
    value: 'resolved-bucket',
    scope: 'user',
    source: 'project',
  },
  {
    name: 'resolved_path',
    type: 'STRING',
    value: 'datasets/current.csv',
    scope: 'user',
    source: 'project',
  },
];

describe('fileStorageConnectionFields helpers', () => {
  it('returns visible fields for the active branch', () => {
    expect(
      getFileStorageOverrideFields({
        nodeDefinition,
        branch: getFileStorageOverrideBranch('s3'),
      }).map(field => field.attrName)
    ).toEqual(['bucket', 'prefix', 'verify']);

    const verifyField = getFileStorageOverrideFields({
      nodeDefinition,
      branch: 's3',
    }).find(field => field.attrName === 'verify');
    expect(verifyField?.inputDefinition.type).toBe('BOOLEAN');

    expect(
      getFileStorageOverrideFields({
        nodeDefinition,
        branch: getFileStorageOverrideBranch('sftp'),
      }).map(field => field.attrName)
    ).toEqual(['initial_directory']);
  });

  it('drops stale values when branch changes', () => {
    const ftpFields = getFileStorageOverrideFields({
      nodeDefinition,
      branch: 'ftp',
    });

    expect(
      getNormalizedConnectionOverridesValue({
        branch: 'ftp',
        fields: ftpFields,
        value: {
          type: 's3',
          bucket: 'raw-bucket',
          prefix: 'landing',
        },
      })
    ).toBeNull();
  });

  it('preserves an explicit false S3 verify override', () => {
    const s3Fields = getFileStorageOverrideFields({
      nodeDefinition,
      branch: 's3',
    });

    expect(
      getNormalizedConnectionOverridesValue({
        branch: 's3',
        fields: s3Fields,
        value: {
          type: 's3',
          verify: false,
        },
      })
    ).toEqual({ type: 's3', verify: false });
  });

  it('builds picker state from resolved variables and connection fields', () => {
    const pickerState = buildResolvedFileStoragePickerState({
      connectionMetadata: makeS3Metadata(),
      connectionOverrides: {
        type: 's3',
        bucket: makeExpressionValue('resolved_bucket', 'single'),
        prefix: 'daily',
        verify: false,
      },
      nodeDefinition,
      pathValue: makeExpressionValue('resolved_path', 'single'),
      variables,
    });

    expect(pickerState.canBrowse).toBe(true);
    expect(pickerState.connectionContext).toEqual({
      bucket: 'resolved-bucket',
      prefix: 'daily',
    });
    expect(pickerState.connectionRoot).toBe('s3://resolved-bucket/daily');
    expect(pickerState.resolvedPathValue).toBe('datasets/current.csv');
  });

  it('blocks picker when override expression is unresolved', () => {
    const pickerState = buildResolvedFileStoragePickerState({
      connectionMetadata: makeS3Metadata(),
      connectionOverrides: {
        type: 's3',
        bucket: makeExpressionValue('missing_bucket', 'single'),
      },
      nodeDefinition,
      pathValue: 'datasets/current.csv',
      variables,
    });

    expect(pickerState.canBrowse).toBe(false);
    expect(pickerState.disabledReason).toContain('Bucket');
    expect(pickerState.disabledReason).toContain('ещё не определено');
  });

  it('blocks picker for complex path expressions', () => {
    const pickerState = buildResolvedFileStoragePickerState({
      connectionMetadata: makeS3Metadata(),
      connectionOverrides: null,
      nodeDefinition,
      pathValue: makeExpressionValue('resolved_path | lower', 'single'),
      variables,
    });

    expect(pickerState.canBrowse).toBe(false);
    expect(pickerState.disabledReason).toContain('Path');
    expect(pickerState.disabledReason).toContain('сложным выражением');
  });

  it('uses connection record type to enable sftp-specific fields and root', () => {
    const pickerState = buildResolvedFileStoragePickerState({
      connectionMetadata: makeFtpMetadata(),
      connectionOverrides: {
        type: 'sftp',
        initial_directory: '/custom-dropzone',
      },
      connectionRecord: makeSftpRecord(),
      nodeDefinition,
      pathValue: 'daily/report.csv',
      variables: [],
    });

    expect(pickerState.connectionType).toBe('sftp');
    expect(pickerState.connectionContext).toEqual({
      initial_directory: '/custom-dropzone',
    });
    expect(pickerState.connectionRoot).toBe('sftp://custom-dropzone');
  });
});
