import { DIALECT_METADATA } from '../constants';
import type { DbDialect, DialectMetadata } from '../types';

export const getDialectMetadata = (dialect: DbDialect): DialectMetadata =>
  DIALECT_METADATA[dialect];

export const isDialectSupportsDatabases = (dialect: DbDialect): boolean =>
  getDialectMetadata(dialect).supportsDatabases;

export const isDialectSupportsSchemas = (dialect: DbDialect): boolean =>
  getDialectMetadata(dialect).supportsSchemas;
