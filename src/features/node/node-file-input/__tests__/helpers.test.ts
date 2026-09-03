import { describe, expect, it } from 'vitest';

import {
  detectNodeFileSourceMode,
  getNodeFileInputErrorMessage,
  getUploadedFileDisplayName,
  hasNodeFileInputSource,
  isAcceptedNodeFile,
} from '@/features/node/node-file-input/lib/helpers';

import { ApiError } from '@/shared/lib/errors';

describe('features/node-file-input helpers', () => {
  it('detects upload mode from backend-managed connection and path', () => {
    const value = {
      connection: {
        type: 'dvt_service_files',
        metadata: {
          system: true,
          purpose: 'node-file-input',
        },
      },
      path: 'folder/data.csv',
    };

    expect(hasNodeFileInputSource(value)).toBe(true);
    expect(detectNodeFileSourceMode(value)).toBe('upload');
    expect(getUploadedFileDisplayName(value.path)).toBe('data.csv');
  });

  it('falls back to manual mode for non-internal sources', () => {
    const value = {
      connection_overrides: {
        bucket: 'reports',
      },
      path: 'reports/2026-06.csv',
    };

    expect(hasNodeFileInputSource(value)).toBe(false);
    expect(detectNodeFileSourceMode(value)).toBe('manual');
  });

  it('validates upload extensions case-insensitively', () => {
    const file = { name: 'DATA.XLSM' } as File;

    expect(isAcceptedNodeFile(file, ['.xls', '.xlsx', '.xlsm'])).toBe(true);
    expect(isAcceptedNodeFile(file, ['.csv'])).toBe(false);
  });

  it('maps 413 errors to a user-facing size message', () => {
    const error = new ApiError({
      code: 'HTTP_413',
      message: 'Payload too large',
      status: 413,
    });

    expect(
      getNodeFileInputErrorMessage(error, 'Не удалось загрузить файл')
    ).toContain('Файл слишком большой');
  });
});
