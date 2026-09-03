import { describe, expect, it } from 'vitest';

import {
  buildStoragePathForSaveTarget,
  buildStoragePathFromPickerSelection,
  ensureStoragePathExtension,
  getStoragePathTargetName,
  hasTrailingSlashStoragePath,
  splitStoragePathForSaveTarget,
  stripStoragePathExtension,
} from './file-storage-target-path';

describe('file-storage-target-path helpers', () => {
  it('ensures extension for the last path segment', () => {
    expect(ensureStoragePathExtension('reports/export', '.csv')).toBe(
      'reports/export.csv'
    );
    expect(ensureStoragePathExtension('reports/export.csv', '.csv')).toBe(
      'reports/export.csv'
    );
    expect(ensureStoragePathExtension('reports/export.csv.csv', '.csv')).toBe(
      'reports/export.csv'
    );
  });

  it('preserves the current target name when a folder is selected', () => {
    expect(
      buildStoragePathFromPickerSelection({
        currentPath: 'reports/export',
        selectedPath: 'archive/2026',
        selectedNodeType: 'folder',
        extension: '.xlsx',
      })
    ).toBe('archive/2026/export.xlsx');
  });

  it('replaces the full path when a file is selected', () => {
    expect(
      buildStoragePathFromPickerSelection({
        currentPath: 'reports/export.csv',
        selectedPath: 'archive/result.csv',
        selectedNodeType: 'file',
        extension: '.csv',
      })
    ).toBe('archive/result.csv');
  });

  it('returns the raw folder path when current target name is absent', () => {
    expect(
      buildStoragePathFromPickerSelection({
        currentPath: 'archive/',
        selectedPath: 'reports/2026',
        selectedNodeType: 'folder',
        extension: '.parquet',
      })
    ).toBe('reports/2026');
  });

  it('extracts target names and detects trailing slashes', () => {
    expect(getStoragePathTargetName('reports/export.parquet')).toBe(
      'export.parquet'
    );
    expect(getStoragePathTargetName('reports/')).toBe('');
    expect(hasTrailingSlashStoragePath('reports/')).toBe(true);
    expect(hasTrailingSlashStoragePath('reports/export.csv')).toBe(false);
  });

  it('splits a save target path into directory and editable file name', () => {
    expect(
      splitStoragePathForSaveTarget('reports/quick_test.csv', '.csv')
    ).toEqual({
      directoryPath: 'reports',
      fileName: 'quick_test',
    });
    expect(splitStoragePathForSaveTarget('reports/', '.csv')).toEqual({
      directoryPath: 'reports',
      fileName: '',
    });
  });

  it('builds a normalized full path for save target picker drafts', () => {
    expect(
      buildStoragePathForSaveTarget({
        directoryPath: 'reports/2026',
        fileName: 'quick_test',
        extension: '.csv',
      })
    ).toBe('reports/2026/quick_test.csv');
    expect(
      buildStoragePathForSaveTarget({
        directoryPath: 'reports/2026',
        fileName: 'quick_test.csv',
        extension: '.csv',
      })
    ).toBe('reports/2026/quick_test.csv');
  });

  it('strips duplicated extensions from the editable file name', () => {
    expect(stripStoragePathExtension('quick_test.csv.csv', '.csv')).toBe(
      'quick_test'
    );
  });
});
