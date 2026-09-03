import { describe, expect, it } from 'vitest';

import {
  createFileStorageManagerPickerRequest,
  FileStorageManagerPickerAbortedError,
  rejectAllFileStorageManagerPickerRequests,
  rejectFileStorageManagerPickerRequest,
  resolveFileStorageManagerPickerRequest,
} from './pickerRequests';

describe('pickerRequests', () => {
  it('resolves a picker request with the selected path', async () => {
    const request = createFileStorageManagerPickerRequest();

    expect(
      resolveFileStorageManagerPickerRequest(request.requestId, {
        path: 'reports/export.csv',
        nodeType: 'file',
      })
    ).toBe(true);

    await expect(request.promise).resolves.toEqual({
      path: 'reports/export.csv',
      nodeType: 'file',
    });
  });

  it('rejects an active request explicitly', async () => {
    const request = createFileStorageManagerPickerRequest();

    expect(
      rejectFileStorageManagerPickerRequest(
        request.requestId,
        new FileStorageManagerPickerAbortedError('Cancelled')
      )
    ).toBe(true);

    await expect(request.promise).rejects.toThrow('Cancelled');
  });

  it('rejects all pending requests', async () => {
    const first = createFileStorageManagerPickerRequest();
    const second = createFileStorageManagerPickerRequest();

    rejectAllFileStorageManagerPickerRequests(
      new FileStorageManagerPickerAbortedError('All cancelled')
    );

    await expect(first.promise).rejects.toThrow('All cancelled');
    await expect(second.promise).rejects.toThrow('All cancelled');
  });
});
