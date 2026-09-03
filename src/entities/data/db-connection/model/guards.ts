const FILE_CONNECTION_TYPES = ['s3', 'ftp', 'sftp', 'smbprotocol'] as const; // TODO: get from backend

export type SupportedFileConnectionType =
  (typeof FILE_CONNECTION_TYPES)[number];

export const isFileConnectionType = (
  type: string
): type is SupportedFileConnectionType =>
  FILE_CONNECTION_TYPES.includes(type as SupportedFileConnectionType);
