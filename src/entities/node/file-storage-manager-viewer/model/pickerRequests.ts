import type { FileStorageManagerPickerSelection } from './types';

export class FileStorageManagerPickerAbortedError extends Error {
  constructor(message = 'File storage picker request was aborted.') {
    super(message);
    this.name = 'FileStorageManagerPickerAbortedError';
  }
}

type PickerRequestRecord = {
  reject: (reason?: unknown) => void;
  resolve: (value: FileStorageManagerPickerSelection | null) => void;
};

const requestRegistry = new Map<number, PickerRequestRecord>();
let nextRequestId = 0;

export const createFileStorageManagerPickerRequest = () => {
  const requestId = ++nextRequestId;
  const promise = new Promise<FileStorageManagerPickerSelection | null>(
    (resolve, reject) => {
      requestRegistry.set(requestId, { resolve, reject });
    }
  );

  return {
    requestId,
    promise,
  };
};

export const resolveFileStorageManagerPickerRequest = (
  requestId: number,
  value: FileStorageManagerPickerSelection | null
) => {
  const request = requestRegistry.get(requestId);
  if (!request) {
    return false;
  }

  requestRegistry.delete(requestId);
  request.resolve(value);
  return true;
};

export const rejectFileStorageManagerPickerRequest = (
  requestId: number,
  reason: unknown = new FileStorageManagerPickerAbortedError()
) => {
  const request = requestRegistry.get(requestId);
  if (!request) {
    return false;
  }

  requestRegistry.delete(requestId);
  request.reject(reason);
  return true;
};

export const rejectAllFileStorageManagerPickerRequests = (
  reason: unknown = new FileStorageManagerPickerAbortedError(
    'File storage picker requests were aborted.'
  )
) => {
  requestRegistry.forEach(request => {
    request.reject(reason);
  });
  requestRegistry.clear();
};
