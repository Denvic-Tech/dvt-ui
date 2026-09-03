import type { ComponentType } from 'react';

import type { DBConnectionRecord } from '@/entities/data/db-connection';
import type {
  FileStorageConnectionType,
  FileStorageListContext,
} from '@/entities/data/storage';

import type {
  FtpMetadata,
  NodeDefinition,
  NodeMetadata,
  S3Metadata,
  SmbMetadata,
} from '@/shared/gatewayClient';
import type { VariableOutput } from '@/shared/lib/variables';

export type ExtensionConnectedInputMetadata = NodeMetadata[string];

export type ExtensionFileStorageConnectionMetadata =
  | S3Metadata
  | FtpMetadata
  | SmbMetadata
  | null;

export type ExtensionFileStorageConnectionOverridesValue =
  | {
      type?: string | null;
      bucket?: unknown;
      prefix?: unknown;
      initial_directory?: unknown;
    }
  | null
  | undefined;

export type ExtensionFileStoragePickerState = {
  canBrowse: boolean;
  connectionContext: FileStorageListContext | null;
  connectionID: string | null;
  connectionRoot: string | null;
  connectionType: FileStorageConnectionType | null;
  disabledReason: string;
  resolvedPathValue: string | null;
};

export type ExtensionFileStoragePickerSelection = {
  path: string;
  nodeType: 'file' | 'folder';
};

export type ExtensionFileStoragePickerKind = 'generic' | 'save_target';
export type ExtensionFileStoragePickerSelectionMode =
  | 'file'
  | 'folder'
  | 'file_or_folder';

export type ExtensionFileStoragePickerOptions = {
  connectionID: string;
  selectionMode: ExtensionFileStoragePickerSelectionMode;
  selectedPath?: string | null;
  allowedFileExts?: string[] | null;
  kind?: ExtensionFileStoragePickerKind | undefined;
  extension?: string | null;
  connectionContext?: FileStorageListContext | null;
  title?: string | null;
  description?: string | null;
  confirmLabel?: string | null;
};

export type ExtensionFileStorageConnectionContextArgs = {
  getConnectedInputMetadata: (
    inputName: string
  ) => ExtensionConnectedInputMetadata;
  inputName?: string | undefined;
};

export type ExtensionFileStorageCapabilities = {
  components: {
    FileStorageConnectionFields: ComponentType<any>;
    FileStorageTargetPathSection: ComponentType<any>;
  };
  hooks: {
    useConnectionContext: (args: ExtensionFileStorageConnectionContextArgs) => {
      connectionMetadata: ExtensionFileStorageConnectionMetadata;
      connectionRecord: DBConnectionRecord | null;
    };
    usePicker: () => {
      openPicker: (
        options: ExtensionFileStoragePickerOptions
      ) => Promise<ExtensionFileStoragePickerSelection | null>;
    };
  };
  helpers: {
    getConnectedInputMetadata: (
      args: ExtensionFileStorageConnectionContextArgs
    ) => ExtensionFileStorageConnectionMetadata;
    buildResolvedPickerState: (args: {
      connectionMetadata: ExtensionFileStorageConnectionMetadata;
      connectionOverrides: ExtensionFileStorageConnectionOverridesValue;
      connectionRecord?: DBConnectionRecord | null | undefined;
      nodeDefinition: NodeDefinition | null | undefined;
      pathLabel?: string | undefined;
      pathValue?: unknown;
      variables: VariableOutput[];
    }) => ExtensionFileStoragePickerState;
  };
};

export type ExtensionRepackS3ParquetValues = {
  source_pattern?: unknown;
  target_path?: unknown;
  connection_overrides?: unknown;
  min_file_size_bytes?: number | null;
  max_output_size_bytes?: number | null;
};

export type ExtensionRepackS3ParquetSizeUnit = 'B' | 'KB' | 'MB' | 'GB';

export type ExtensionRepackS3ParquetCapabilities = {
  constants: {
    sizeUnits: readonly ExtensionRepackS3ParquetSizeUnit[];
  };
  helpers: {
    buildParquetPatternFromFolder: (path: string) => string;
    convertSizeToBytes: (
      rawValue: string,
      unit: ExtensionRepackS3ParquetSizeUnit
    ) => number | null;
    getSizeInputStateFromBytes: (bytes: number | null | undefined) => {
      value: string;
      unit: ExtensionRepackS3ParquetSizeUnit;
    };
    getSourcePatternPickerSelectedPath: (value: unknown) => string | null;
    validateValues: (
      values: ExtensionRepackS3ParquetValues
    ) => Partial<Record<keyof ExtensionRepackS3ParquetValues, string>>;
  };
};

export type ExtensionHost = {
  version: '1';
  react: typeof import('react');
  ui?: {
    mui?: typeof import('@mui/material');
    icons?: Record<string, import('react').ComponentType<any>>;
    components?: {};
  };
  capabilities?: {
    fileStorage?: ExtensionFileStorageCapabilities;
    nodes?: {
      repackS3Parquet?: ExtensionRepackS3ParquetCapabilities;
    };
  };
  utils?: Record<string, unknown>;
  resolve?: (name: string) => unknown;
  client?: any;
};
