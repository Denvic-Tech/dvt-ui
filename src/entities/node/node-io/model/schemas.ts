import { zIo } from '@/shared/gatewayClient';

export const IOPrimitiveTypeSchema = zIo.extract([
  'STRING',
  'BOOLEAN',
  'INT',
  'FLOAT',
  'PRIMITIVE',
]);

export const IOConnectionRequiredTypeSchema = zIo.extract([
  'DATAFRAME',
  'COLUMN',
  'DB_CONNECTION',
  'JSON',
  'S3_CONNECTION_ID',
  'DB_CONNECTION_ID',
  'FTP_CONNECTION_ID',
  'SMB_CONNECTION_ID',
  'S3_CONNECTION,FTP_CONNECTION,SMB_CONNECTION',
  'VARIABLE',
  'SIGNAL',
  'TABLE_SCHEMA',
]);

// TODO: временная схема типов для отображения портов у сабграфа. В идеале использовать `src/entities/node-io/model/schemas.ts:IOConnectionRequiredTypeSchema`
export const IOConnectionRequiredSubgraphTypeSchema = zIo.extract([
  'DATAFRAME',
  'COLUMN',
  'DB_CONNECTION',
  'JSON',
]);

export const IOHasWidgetTypeSchema = zIo.extract([
  'STRING',
  'BOOLEAN',
  'INT',
  'FLOAT',
  'DICT',
  'COLUMN_NAME',
  'DATETIME',
  'PRIMITIVE',
  'S3_CONNECTION_ID',
  'DB_CONNECTION_ID',
  'FTP_CONNECTION_ID',
  'SMB_CONNECTION_ID',
]);
