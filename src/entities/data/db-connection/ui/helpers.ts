import KafkaLogo from '@/shared/assets/Apache-Kafka-icon.svg';
import ClickHouseLogo from '@/shared/assets/ClickHouse-icon.svg';
import FTPLogo from '@/shared/assets/FTP-icon.svg';
import MongoLogo from '@/shared/assets/Mongo-icon.svg';
import MSSQLLogo from '@/shared/assets/MS-SQL-icon.svg';
import MySQLLogo from '@/shared/assets/MySQL-icon.svg';
import OracleLogo from '@/shared/assets/Oracle-icon.svg';
import PostgreSQLLogo from '@/shared/assets/PostgreSQL-icon.svg';
import S3Logo from '@/shared/assets/S3-icon.svg';
import SFTPLogo from '@/shared/assets/SFTP-icon.svg';

const LOGOS_BY_TYPE: Record<string, string> = {
  clickhouse: ClickHouseLogo,
  ftp: FTPLogo,
  kafka: KafkaLogo,
  mongodb: MongoLogo,
  mssql: MSSQLLogo,
  mysql: MySQLLogo,
  oracle: OracleLogo,
  postgres: PostgreSQLLogo,
  s3: S3Logo,
  sftp: SFTPLogo,
};

const LOGO_SCALE_BY_TYPE: Record<string, number> = {
  clickhouse: 0.85,
  ftp: 0.9,
  mongodb: 1.35,
  mssql: 2,
  s3: 1.3,
  sftp: 0.9,
};

export const getConnectionTypeLogo = (type: string) =>
  LOGOS_BY_TYPE[type] ?? null;

export const getConnectionTypeLogoScale = (type: string) =>
  LOGO_SCALE_BY_TYPE[type] ?? 1;

const CONNECTION_TYPE_LABELS: Record<string, string> = {
  clickhouse: 'ClickHouse',
  postgres: 'Postgres',
  mysql: 'MySQL',
  mongodb: 'MongoDB',
  mssql: 'MS SQL',
  oracle: 'OracleDB',
  custom: 'Custom SQL',
  kafka: 'Kafka',
  s3: 'S3',
  ftp: 'FTP',
  sftp: 'SFTP',
};

const CONNECTION_KIND_LABELS: Record<string, string> = {
  sql: 'Базы данных',
  database: 'Базы данных',
  databases: 'Базы данных',
  queue: 'Очереди сообщений',
  queues: 'Очереди сообщений',
  messaging: 'Очереди сообщений',
  cloud: 'Облачные хранилища',
  storage: 'Облачные хранилища',
  file: 'Файловые протоколы',
  files: 'Файловые протоколы',
  filesystem: 'Файловые протоколы',
};

const toTitleCase = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, char => char.toUpperCase());

export const getConnectionTypeLabel = (type: string) =>
  CONNECTION_TYPE_LABELS[type] ?? toTitleCase(type);

export const formatKindLabel = (kind: string) =>
  CONNECTION_KIND_LABELS[kind] ?? toTitleCase(kind);

export const formatKindGroupLabel = (
  kind: string,
  description?: string | null
) => {
  const normalizedDescription = description?.trim();

  if (normalizedDescription) {
    return normalizedDescription;
  }

  return formatKindLabel(kind);
};
