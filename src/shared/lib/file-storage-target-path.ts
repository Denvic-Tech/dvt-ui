const normalizeExtension = (extension: string) =>
  extension.startsWith('.')
    ? extension.toLowerCase()
    : `.${extension.toLowerCase()}`;

export const normalizeRelativeStoragePath = (path: string) =>
  path.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');

export const getStoragePathTargetName = (path: string | null | undefined) => {
  if (typeof path !== 'string') {
    return '';
  }

  const trimmed = path.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!trimmed || trimmed.endsWith('/')) {
    return '';
  }

  const segments = trimmed.split('/').filter(Boolean);
  return segments[segments.length - 1] ?? '';
};

export const stripStoragePathExtension = (
  pathOrFileName: string,
  extension: string
) => {
  const normalizedExtension = normalizeExtension(extension);
  let nextValue = pathOrFileName.trim();

  while (nextValue.toLowerCase().endsWith(normalizedExtension)) {
    nextValue = nextValue.slice(0, -normalizedExtension.length);
  }

  return nextValue;
};

export const splitStoragePathForSaveTarget = (
  path: string | null | undefined,
  extension: string
) => {
  if (typeof path !== 'string') {
    return {
      directoryPath: '',
      fileName: '',
    };
  }

  const normalizedRawPath = path.trim().replace(/\\/g, '/');
  if (!normalizedRawPath) {
    return {
      directoryPath: '',
      fileName: '',
    };
  }

  if (/[\\/]$/.test(normalizedRawPath)) {
    return {
      directoryPath: normalizeRelativeStoragePath(normalizedRawPath),
      fileName: '',
    };
  }

  const normalizedPath = normalizeRelativeStoragePath(normalizedRawPath);
  if (!normalizedPath) {
    return {
      directoryPath: '',
      fileName: '',
    };
  }

  const segments = normalizedPath.split('/').filter(Boolean);
  const rawFileName = segments.pop() ?? '';

  return {
    directoryPath: segments.join('/'),
    fileName: stripStoragePathExtension(rawFileName, extension),
  };
};

export const buildStoragePathForSaveTarget = ({
  directoryPath,
  extension,
  fileName,
}: {
  directoryPath: string | null | undefined;
  extension: string;
  fileName: string;
}) => {
  const normalizedDirectoryPath = normalizeRelativeStoragePath(
    directoryPath ?? ''
  );
  const normalizedFileName = stripStoragePathExtension(fileName, extension);

  if (!normalizedFileName) {
    return normalizedDirectoryPath;
  }

  return ensureStoragePathExtension(
    [normalizedDirectoryPath, normalizedFileName].filter(Boolean).join('/'),
    extension
  );
};

export const ensureStoragePathExtension = (
  pathOrFileName: string,
  extension: string
) => {
  const normalized = normalizeRelativeStoragePath(pathOrFileName);
  if (!normalized) {
    return '';
  }

  const normalizedExtension = normalizeExtension(extension);
  const segments = normalized.split('/');
  const rawFileName = segments.pop() ?? '';

  if (!rawFileName) {
    return normalized;
  }

  let fileName = rawFileName;
  while (fileName.toLowerCase().endsWith(normalizedExtension)) {
    fileName = fileName.slice(0, -normalizedExtension.length);
  }

  const nextFileName = `${fileName}${normalizedExtension}`;
  return [...segments, nextFileName].filter(Boolean).join('/');
};

export const buildStoragePathFromPickerSelection = ({
  currentPath,
  extension,
  selectedNodeType,
  selectedPath,
}: {
  currentPath: string | null | undefined;
  extension: string;
  selectedNodeType: 'file' | 'folder';
  selectedPath: string;
}) => {
  const normalizedSelectedPath = normalizeRelativeStoragePath(selectedPath);
  if (!normalizedSelectedPath) {
    return '';
  }

  if (selectedNodeType === 'file') {
    return ensureStoragePathExtension(normalizedSelectedPath, extension);
  }

  const currentTargetName = getStoragePathTargetName(currentPath);
  if (!currentTargetName) {
    return normalizedSelectedPath;
  }

  return ensureStoragePathExtension(
    `${normalizedSelectedPath}/${currentTargetName}`,
    extension
  );
};

export const hasTrailingSlashStoragePath = (path: string | null | undefined) =>
  typeof path === 'string' && /[\\/]$/.test(path.trim());
