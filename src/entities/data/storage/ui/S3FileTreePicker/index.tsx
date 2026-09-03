import React, { forwardRef } from 'react';

import {
  FileStorageTreePicker,
  type FileStorageTreePickerRef,
} from '../FileStorageTreePicker';

export type S3FileTreePickerRef = FileStorageTreePickerRef;

export interface S3FileTreePickerProps {
  connectionID: string;
  connectionPrefix?: string | null | undefined;
  mode: 'file' | 'folder' | 'file_or_folder';
  selected?: string | null;
  onSelect?: (fullPath: string) => void;
  filterFile?: (name: string) => boolean;
  allowedFileExts?: string[];
  searchTerm?: string;
  height?: number | string;
  maxItems?: number;
}

export const S3FileTreePicker = forwardRef<
  S3FileTreePickerRef,
  S3FileTreePickerProps
>(function S3FileTreePicker(props, ref) {
  return (
    <FileStorageTreePicker
      ref={ref}
      connectionID={props.connectionID}
      connectionType='s3'
      connectionName={props.connectionPrefix || 'Мои файлы'}
      rootHint={null}
      mode={props.mode}
      selected={props.selected}
      onSelect={props.onSelect}
      filterFile={props.filterFile}
      allowedFileExts={props.allowedFileExts}
      searchTerm={props.searchTerm}
      height={props.height}
      maxItems={props.maxItems}
    />
  );
});
