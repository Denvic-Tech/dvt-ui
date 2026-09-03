import { toApiErrorPayload } from '@/shared/lib/errors';

export type NodeFileSourceMode = 'manual' | 'upload';

export type NodeFileUploadConfig = {
  acceptedExtensions: readonly string[];
  displayName: string;
  helperText: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getNormalizedExtension = (filename: string): string => {
  const ext = filename.split('.').pop()?.trim().toLowerCase() ?? '';
  return ext ? `.${ext}` : '';
};

const isNodeFileInputConnection = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const metadata = isRecord(value['metadata']) ? value['metadata'] : null;

  return (
    value['type'] === 'dvt_service_files' ||
    (metadata?.['system'] === true &&
      metadata?.['purpose'] === 'node-file-input')
  );
};

export const hasNodeFileInputSource = (
  value: Record<string, unknown> | null | undefined
): boolean => {
  const path = typeof value?.['path'] === 'string' ? value['path'].trim() : '';
  return path.length > 0 && isNodeFileInputConnection(value?.['connection']);
};

export const detectNodeFileSourceMode = (
  value: Record<string, unknown> | null | undefined
): NodeFileSourceMode => (hasNodeFileInputSource(value) ? 'upload' : 'manual');

export const isAcceptedNodeFile = (
  file: File,
  acceptedExtensions: readonly string[]
): boolean => {
  const ext = getNormalizedExtension(file.name);
  return acceptedExtensions.includes(ext);
};

export const getAcceptedExtensionsLabel = (
  acceptedExtensions: readonly string[]
): string => acceptedExtensions.join(', ');

export const getUploadedFileDisplayName = (
  path: string | null | undefined,
  filename?: string | null
): string | null => {
  const trimmedFilename = filename?.trim();
  if (trimmedFilename) {
    return trimmedFilename;
  }

  const trimmedPath = path?.trim();
  if (!trimmedPath) {
    return null;
  }

  return trimmedPath.split('/').pop() ?? trimmedPath;
};

export const formatNodeFileSize = (sizeInBytes: number): string => {
  if (!Number.isFinite(sizeInBytes) || sizeInBytes <= 0) {
    return '0 Б';
  }

  if (sizeInBytes < 1024) {
    return `${Math.round(sizeInBytes)} Б`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1).replace(/\\.0$/, '')} КБ`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1).replace(/\\.0$/, '')} МБ`;
};

export const getNodeFileInputErrorMessage = (
  error: unknown,
  fallbackMessage: string
): string => {
  const payload = toApiErrorPayload(error, fallbackMessage);

  if (payload.status === 413) {
    return 'Файл слишком большой. Попробуйте файл меньше 2 MB или проверьте лимит backend.';
  }

  return payload.detail || payload.message || fallbackMessage;
};
