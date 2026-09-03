import { useMemo } from 'react';

import type {
  ExtensionConnectedInputMetadata,
  ExtensionFileStorageCapabilities,
  ExtensionFileStorageConnectionContextArgs,
  ExtensionFileStorageConnectionMetadata,
  ExtensionFileStoragePickerOptions,
} from '@/app/extensions/types';

import {
  FileStorageConnectionFields,
  FileStorageTargetPathSection,
} from '@/features/node/file-storage-target-path';
import { buildResolvedFileStoragePickerState } from '@/features/node/file-storage-target-path/ui/fileStorageConnectionFields.helpers';

import { useConnections } from '@/entities/data/db-connection';
import { useFileStorageManagerViewer } from '@/entities/node/file-storage-manager-viewer';

const isFileStorageConnectionMetadata = (
  value: ExtensionConnectedInputMetadata
): value is NonNullable<ExtensionFileStorageConnectionMetadata> => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const metadataType = value['type'];
  return metadataType === 'S3' || metadataType === 'FTP' || metadataType === 'SMB';
};

const resolveConnectedInputMetadata = ({
  getConnectedInputMetadata,
  inputName = 'connection',
}: ExtensionFileStorageConnectionContextArgs): ExtensionFileStorageConnectionMetadata => {
  const metadata = getConnectedInputMetadata(inputName);
  return isFileStorageConnectionMetadata(metadata) ? metadata : null;
};

const useConnectionContext: ExtensionFileStorageCapabilities['hooks']['useConnectionContext'] =
  ({ getConnectedInputMetadata, inputName = 'connection' }) => {
    const connectionMetadata = useMemo(
      () =>
        resolveConnectedInputMetadata({
          getConnectedInputMetadata,
          inputName,
        }),
      [getConnectedInputMetadata, inputName]
    );
    const { getConnectionById } = useConnections();

    const connectionRecord = useMemo(
      () =>
        connectionMetadata?.connection_id
          ? (getConnectionById(connectionMetadata.connection_id) ?? null)
          : null,
      [connectionMetadata?.connection_id, getConnectionById]
    );

    return {
      connectionMetadata,
      connectionRecord,
    };
  };

const usePicker: ExtensionFileStorageCapabilities['hooks']['usePicker'] = () => {
  const { openPicker } = useFileStorageManagerViewer();

  return {
    openPicker: (options: ExtensionFileStoragePickerOptions) => {
      const nextOptions: Parameters<typeof openPicker>[0] = {
        connectionID: options.connectionID,
        selectionMode: options.selectionMode,
      };

      if (options.selectedPath !== undefined) {
        nextOptions.selectedPath = options.selectedPath;
      }
      if (options.allowedFileExts !== undefined) {
        nextOptions.allowedFileExts = options.allowedFileExts;
      }
      if (options.kind !== undefined) {
        nextOptions.kind = options.kind;
      }
      if (options.extension !== undefined) {
        nextOptions.extension = options.extension;
      }
      if (options.connectionContext !== undefined) {
        nextOptions.connectionContext = options.connectionContext;
      }
      if (options.title !== undefined) {
        nextOptions.title = options.title;
      }
      if (options.description !== undefined) {
        nextOptions.description = options.description;
      }
      if (options.confirmLabel !== undefined) {
        nextOptions.confirmLabel = options.confirmLabel;
      }

      return openPicker(nextOptions);
    },
  };
};

export const fileStorageHostCapabilities: ExtensionFileStorageCapabilities = {
  components: {
    FileStorageConnectionFields,
    FileStorageTargetPathSection,
  },
  hooks: {
    useConnectionContext,
    usePicker,
  },
  helpers: {
    getConnectedInputMetadata: resolveConnectedInputMetadata,
    buildResolvedPickerState: buildResolvedFileStoragePickerState,
  },
};
