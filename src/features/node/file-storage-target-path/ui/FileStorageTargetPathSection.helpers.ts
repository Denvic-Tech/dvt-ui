import type { ReactNode } from 'react';

import type { FileStorageManagerPickerKind } from '@/entities/node/file-storage-manager-viewer';
import type {
  FileStorageManagerPickerSelection,
  FileStorageManagerViewerSelectionMode,
} from '@/entities/node/file-storage-manager-viewer/model/types';

import type { InputDefinitionModel } from '@/shared/gatewayClient';
import type { VariableOutput, VariableType } from '@/shared/lib/variables';

import type {
  FileStorageConnectionMetadata,
  ResolvedFileStoragePickerState,
} from './fileStorageConnectionFields.helpers';

export type FileStorageTargetPathSectionProps = {
  inputDefinition: InputDefinitionModel | null | undefined;
  value: unknown;
  onChange: (nextValue: unknown) => void;
  variables: VariableOutput[];
  connectionMetadata: FileStorageConnectionMetadata;
  pickerState: ResolvedFileStoragePickerState;
  extension: string;
  pickerExtension?: string | null;
  allowedFileExts: string[];
  literalPlaceholder?: string;
  title?: string;
  titleHint?: ReactNode;
  description?: string;
  footerText?: ReactNode;
  errorText?: string | null;
  pickerTitle?: string | null;
  pickerDescription?: string | null;
  pickerConfirmLabel?: string | null;
  pickerKind?: FileStorageManagerPickerKind;
  pickerSelectionMode?: FileStorageManagerViewerSelectionMode;
  pickerSelectedPath?: string | null;
  browseTooltip?: string | null;
  mapPickerSelectionToValue?: (
    selection: FileStorageManagerPickerSelection
  ) => unknown;
  mode?: string | null;
  modeOptions?: ReadonlyArray<{
    value: string;
    label: string;
    disabled?: boolean;
    disabledReason?: string;
  }>;
  onModeChange?: (nextMode: string) => void;
};

export type Tone = 'default' | 'error' | 'warning';

export const EXPRESSION_AUTOCOMPLETE_VARIABLE_TYPES: VariableType[] = [
  'STRING',
  'BOOLEAN',
  'INT',
  'FLOAT',
  'DATETIME',
  'TIMEDELTA',
];

export const resolveTone = (
  errorText?: string | null,
  warningText?: string | null
): Tone => {
  if (errorText) {
    return 'error';
  }

  if (warningText) {
    return 'warning';
  }

  return 'default';
};

export const getLiteralPathPlaceholder = (
  connectionType:
    | NonNullable<FileStorageConnectionMetadata>['type']
    | undefined,
  extension: string
) => {
  const normalizedExtension = extension.trim();
  const protocol = connectionType?.toLowerCase() || 's3';
  return `${protocol}://path/to/file${normalizedExtension}`;
};

export const getDefaultPathDescription = (extension: string) => {
  const normalizedExtension = extension.replace(/^\./, '').trim();
  if (!normalizedExtension) {
    return 'Укажите полный путь к файлу, включая расширение.';
  }

  return `Укажите полный путь к ${normalizedExtension.toUpperCase()}-файлу, включая расширение.`;
};

export const getExpressionModeHint = () =>
  'Expression mode. Удалите ведущий "=" чтобы вернуться к literal. Переменные хранятся как expr(single).';
