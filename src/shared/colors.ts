import type { Io } from '@/shared/gatewayClient';

export const IO_TYPE_COLORS: Record<Io, string> = {
  // Text
  STRING: '#1E88E5', // calm blue

  // Logic
  BOOLEAN: '#7B1FA2', // purple (logic/flags)

  // Numbers
  INT: '#FB8C00', // orange (discrete)
  FLOAT: '#FBC02D', // amber (continuous)
  'FLOAT,INT': '#FB8C00', // numeric family (keep consistent)

  // Structured / objects
  DICT: '#546E7A', // blue-grey (structured object)
  JSON: '#00ACC1', // cyan (format/data)
  SCHEMA: '#455A64', // darker blue-grey (structure/contract)
  VARIABLE: '#5E35B1', // deep purple (named value/handle)
  SIGNAL: '#E91E63', // pink (control flow / signals)

  // Tabular
  DATAFRAME: '#43A047', // green (table/data)
  TABLE_SCHEMA: '#2E7D32', // darker green (table structure)

  // Column-related (same domain, but distinct shades)
  COLUMN: '#6D4C41', // brown (field/column)
  COLUMN_NAME: '#8D6E63', // lighter brown (metadata-ish)

  // Time
  DATETIME: '#00897B', // teal (time/system)
  TIMEDELTA: '#26A69A', // lighter teal (duration/time delta)

  // Connections (systems)
  DB_CONNECTION: '#3949AB', // indigo (infra/system)
  DB_CONNECTION_ID: '#7986CB', // lighter indigo (id/handle)

  S3_CONNECTION: '#F4511E', // deep orange (storage/cloud)
  S3_CONNECTION_ID: '#FF8A65', // lighter deep orange (id/handle)
  FTP_CONNECTION: '#00ACC1', // cyan (file transfer system)
  FTP_CONNECTION_ID: '#4DD0E1', // lighter cyan (id/handle)
  SMB_CONNECTION: '#4bdd22',
  SMB_CONNECTION_ID: '#aaff90',

  'S3_CONNECTION,FTP_CONNECTION,SMB_CONNECTION': '#13c100',

  KAFKA_CONNECTION: '#E53935', // red (stream/event)
  KAFKA_CONNECTION_ID: '#C62828', // deeper red (id/handle)

  // Generic
  OBJECT: '#757575', // neutral grey
  PRIMITIVE: '#3F51B5', // indigo-ish (base types umbrella)

  // Special
  UNKNOWN: '#D81B60', // magenta (attention, but not same as Kafka)
  '*': '#B0BEC5', // soft neutral (any)
};
