import {
  FileStorageListContext,
  UserFileTreeWithConnectionID,
} from '@/entities/data/storage/model/types.ts';

import { client, type UserFileTreeSchema } from '@/shared/gatewayClient';

export const storageApi = {
  uploadPresign: async (
    connectionID: string,
    filename: string,
    path: string,
    contentTypePrefix: string
  ) => {
    const response = await client.storage.upload.presign.get({
      query: {
        connection_id: connectionID,
        filename,
        path,
        content_type_prefix: contentTypePrefix,
      },
    });
    return response.data;
  },

  uploadFile: async (connectionID: string, path: string, file: File | Blob) => {
    const formData = new FormData();
    formData.append('path', path);
    formData.append('file', file);

    // Work around broken multipart request validation in the generated SDK:
    // the upload endpoint expects File/Blob at runtime, but its Zod request
    // schema currently validates `file` as a string before the request is sent.
    // Use the shared client transport directly so auth cookies, headers, and
    // interceptors stay aligned with the generated SDK.
    const response = await client.post({
      url: '/storage/upload/file',
      body: formData,
      query: {
        connection_id: connectionID,
      },
    });
    return response.data;
  },

  downloadPresign: async (
    connectionID: string,
    filename: string,
    path: string
  ) => {
    const response = await client.storage.download.presign.get({
      query: {
        connection_id: connectionID,
        filename,
        path,
      },
    });
    return response.data;
  },

  list: async (
    connectionID: string,
    path?: string,
    maxItems?: number,
    connectionContext?: FileStorageListContext | null
  ): Promise<UserFileTreeWithConnectionID> => {
    const query: Record<string, string | number> = {
      connection_id: connectionID,
      path: path ?? '',
    };

    if (maxItems !== undefined) {
      query['max_items'] = maxItems;
    }

    if (connectionContext?.bucket?.trim()) {
      query['bucket'] = connectionContext.bucket.trim();
    }
    if (connectionContext?.prefix?.trim()) {
      query['prefix'] = connectionContext.prefix.trim();
    }
    if (connectionContext?.initial_directory?.trim()) {
      query['initial_directory'] = connectionContext.initial_directory.trim();
    }

    const response = await client.get({
      url: '/storage/list',
      query,
    });

    return { ...(response.data as UserFileTreeSchema), connectionID };
  },

  createFolder: async (
    connectionID: string,
    folderName: string,
    path: string
  ) => {
    const response = await client.storage.folder.create.post({
      query: { connection_id: connectionID },
      body: {
        folder_name: folderName,
        path,
      },
    });
    return response.data;
  },

  deleteFolder: async (connectionID: string, path: string) => {
    const response = await client.storage.folder.delete.post({
      query: { connection_id: connectionID },
      body: {
        path,
      },
    });
    return response.data;
  },

  deleteFiles: async (connectionID: string, paths: string[]) => {
    const response = await client.storage.files.delete.post({
      query: { connection_id: connectionID },
      body: {
        paths,
      },
    });
    return response.data;
  },

  renamePath: async (connectionID: string, path: string, newName: string) => {
    const response = await client.storage.path.rename.post({
      query: { connection_id: connectionID },
      body: {
        path,
        new_name: newName,
      },
    });
    return response.data;
  },

  movePath: async (connectionID: string, path: string, targetPath: string) => {
    const response = await client.storage.path.move.post({
      query: { connection_id: connectionID },
      body: {
        path,
        target_path: targetPath,
      },
    });
    return response.data;
  },
};
