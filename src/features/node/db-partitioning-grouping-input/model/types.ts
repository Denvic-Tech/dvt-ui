export type PartitionGroupingMode =
  | 'range'
  | 'hash'
  | 'prefix'
  | 'explicit_values'
  | 'quantiles'
  | 'percentiles'
  | 'ranges'
  | 'step'
  | 'granularity'
  | 'as_is';

export type ColumnBaseType =
  | 'STRING'
  | 'NUMERIC'
  | 'DATETIME'
  | 'BOOL'
  | 'UNKNOWN';

export type PartitionGrouping = Record<string, any> & {
  mode: PartitionGroupingMode;
};
