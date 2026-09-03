import ConnectionIDInputExtension from '@/node-extensions/common/connection-id-input';
import CoreContextMenuExtension from '@/node-extensions/common/node-context-menu-core';
import HTTPRequestExtension from '@/node-extensions/extract/http-request';
import LoadCSVExtension from '@/node-extensions/extract/load-csv';
import LoadExcelExtension from '@/node-extensions/extract/load-excel';
import LoadJSONExtension from '@/node-extensions/extract/load-json';
import LoadParquetExtension from '@/node-extensions/extract/load-parquet';
import ReadQueryFromDBV3Extension from '@/node-extensions/extract/read-query-from-db-v3';
import ReadQueueTopicExtension from '@/node-extensions/extract/read-queue-topic';
import ReadTableFromDBV3Extension from '@/node-extensions/extract/read-table-from-db-v3';
import ReadVariablesFromDBExtension from '@/node-extensions/extract/read-variables-from-db';
import CreateVariableExtension from '@/node-extensions/primitive/create-variable';
import ManageVariablesExtension from '@/node-extensions/primitive/manage-variables';
import CreateTableExtension from '@/node-extensions/tool/create-table';
import ExecuteProjectExtension from '@/node-extensions/tool/execute-project';
import ExecutePythonExtension from '@/node-extensions/tool/execute-python';
import SchemaPolicyExtension from '@/node-extensions/tool/schema-policy';
import AddTimeDeltaToDataFrameExtension from '@/node-extensions/transform/df-add-time-delta';
import DataFrameCastColumnTypeExtension from '@/node-extensions/transform/df-cast-column-type';
import DataFrameDropColumnsExtension from '@/node-extensions/transform/df-drop-columns';
import DataFrameExecCodeExtension from '@/node-extensions/transform/df-exec-code';
import DataFrameFillNAExtension from '@/node-extensions/transform/df-fill-na';
import DataFrameFilterExtension from '@/node-extensions/transform/df-filter';
import DataFrameGroupByAggExtension from '@/node-extensions/transform/df-group-by-agg';
import DataFrameJoinExtension from '@/node-extensions/transform/df-join';
import DataFrameLagColumnsExtension from '@/node-extensions/transform/df-lag-columns';
import DataFrameNumericNormalizerExtension from '@/node-extensions/transform/df-numeric-normalizer';
import DataFramePivotExtension from '@/node-extensions/transform/df-pivot';
import DataFrameRegexReplaceExtension from '@/node-extensions/transform/df-regex-replace';
import DataFrameRenameColumnsExtension from '@/node-extensions/transform/df-rename-columns';
import DataFrameReplaceValuesExtension from '@/node-extensions/transform/df-replace-values';
import DataFrameSelectColumnsExtension from '@/node-extensions/transform/df-select-columns';
import DataFrameSelectVariablesExtension from '@/node-extensions/transform/df-select-variables';
import DataFrameSetTimezoneExtension from '@/node-extensions/transform/df-set-timezone';
import DataFrameSortValuesExtension from '@/node-extensions/transform/df-sort-values';
import DataFrameSplitColumnExtension from '@/node-extensions/transform/df-split-columns';
import DataFrameUnionExtension from '@/node-extensions/transform/df-union';
import JsonEditorExtension from '@/node-extensions/transform/json-editor';
import TextExtension from '@/node-extensions/widget/text';
import SaveCSVExtension from '@/node-extensions/write/save-csv';
import SaveExcelExtension from '@/node-extensions/write/save-excel';
import SaveParquetExtension from '@/node-extensions/write/save-parquet';
import WriteDataFrameToDBExtension from '@/node-extensions/write/write-df-to-db';
import WriteDataFrameToDBV2Extension from '@/node-extensions/write/write-df-to-db-v2';
import WriteDataFrameToDBV3Extension from '@/node-extensions/write/write-df-to-db-v3';
import WriteDataFrameToDBV4Extension from '@/node-extensions/write/write-df-to-db-v4';

import { NodeExtensionsRegistry } from './lib/registry';

export const nodeExtensionsRegistry = new NodeExtensionsRegistry();
nodeExtensionsRegistry.register(
  CoreContextMenuExtension,
  ConnectionIDInputExtension,
  CreateVariableExtension,
  ManageVariablesExtension,
  HTTPRequestExtension,
  LoadCSVExtension,
  LoadExcelExtension,
  LoadJSONExtension,
  LoadParquetExtension,
  ReadQueryFromDBV3Extension,
  ReadVariablesFromDBExtension,
  ReadQueueTopicExtension,
  ReadTableFromDBV3Extension,
  CreateTableExtension,
  ExecuteProjectExtension,
  ExecutePythonExtension,
  SchemaPolicyExtension,
  AddTimeDeltaToDataFrameExtension,
  DataFrameCastColumnTypeExtension,
  DataFrameDropColumnsExtension,
  DataFrameExecCodeExtension,
  DataFrameFillNAExtension,
  DataFrameFilterExtension,
  DataFrameGroupByAggExtension,
  DataFrameJoinExtension,
  DataFrameLagColumnsExtension,
  DataFrameNumericNormalizerExtension,
  DataFramePivotExtension,
  DataFrameRegexReplaceExtension,
  DataFrameRenameColumnsExtension,
  DataFrameReplaceValuesExtension,
  DataFrameSelectColumnsExtension,
  DataFrameSelectVariablesExtension,
  DataFrameSetTimezoneExtension,
  DataFrameSortValuesExtension,
  DataFrameSplitColumnExtension,
  DataFrameUnionExtension,
  JsonEditorExtension,
  TextExtension,
  SaveCSVExtension,
  SaveExcelExtension,
  SaveParquetExtension,
  WriteDataFrameToDBExtension,
  WriteDataFrameToDBV2Extension,
  WriteDataFrameToDBV3Extension,
  WriteDataFrameToDBV4Extension
);
