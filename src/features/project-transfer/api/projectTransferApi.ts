import type {
  ExportRequestSchema,
  ImportPreviewSchema,
  ImportRequestSchema,
  ImportResultSchema,
} from '@/shared/gatewayClient';
import { client } from '@/shared/gatewayClient';
import type { ApiErrorPayload } from '@/shared/lib/errors';
import { ApiError, isApiError } from '@/shared/lib/errors';

import {
  EXPORT_WARNINGS_HEADER,
  type ExportWarning,
  parseContentDispositionFileName,
  parseExportWarningsHeader,
  readHeader,
} from '../lib/exportResponse';

export type ExportBundleResult = {
  blob: Blob;
  fileName: string;
  warnings: ExportWarning[];
};

const readString = (
  data: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = data[key];
  return typeof value === 'string' ? value : undefined;
};

/**
 * При `responseType: 'blob'` тело ошибки тоже приходит как Blob, и общий
 * interceptor не может прочитать `description`. Разбираем его здесь.
 */
const unwrapBlobError = async (error: unknown): Promise<never> => {
  if (!isApiError(error)) {
    throw error;
  }

  const raw = error.payload.meta?.['raw'];
  if (!(raw instanceof Blob)) {
    throw error;
  }

  let data: Record<string, unknown> | null = null;
  try {
    const parsed: unknown = JSON.parse(await raw.text());
    if (typeof parsed === 'object' && parsed !== null) {
      data = parsed as Record<string, unknown>;
    }
  } catch {
    data = null;
  }

  if (!data) {
    throw error;
  }

  const description =
    readString(data, 'description') ??
    readString(data, 'detail') ??
    readString(data, 'message') ??
    error.payload.description;
  const name = readString(data, 'name') ?? error.payload.name;

  const payload: ApiErrorPayload = {
    ...error.payload,
    code: readString(data, 'code') ?? error.payload.code,
    message:
      readString(data, 'message') ?? description ?? error.payload.message,
    meta: { ...error.payload.meta, raw: data },
  };
  if (name !== undefined) {
    payload.name = name;
  }
  if (description !== undefined) {
    payload.description = description;
  }

  throw new ApiError(payload);
};

const buildImportFormData = (
  file: File | Blob,
  payload: ImportRequestSchema
): FormData => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('payload', JSON.stringify(payload));
  return formData;
};

/**
 * Сгенерированные функции SDK для multipart валидируют `file` как строку и
 * не дают доступа к заголовкам ответа, поэтому запросы идут напрямую через
 * `client.post` (как в `nodeFileInputApi`). Ошибки обрабатываются локально
 * (`silent: true`).
 */
export const projectTransferApi = {
  exportBundle: async (
    request: ExportRequestSchema
  ): Promise<ExportBundleResult> => {
    try {
      const response = await client.post<Blob, unknown, true>({
        url: '/projects/export',
        body: request,
        responseType: 'blob',
        throwOnError: true,
        silent: true,
      });

      const headers = response.headers as Record<string, unknown> | undefined;
      const blob =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data as unknown as BlobPart], {
              type: 'application/zip',
            });

      return {
        blob,
        fileName: parseContentDispositionFileName(
          readHeader(headers, 'content-disposition')
        ),
        warnings: parseExportWarningsHeader(
          readHeader(headers, EXPORT_WARNINGS_HEADER)
        ),
      };
    } catch (error) {
      return unwrapBlobError(error);
    }
  },

  previewImport: async (
    file: File | Blob,
    payload: ImportRequestSchema
  ): Promise<ImportPreviewSchema> => {
    const response = await client.post<ImportPreviewSchema, unknown, true>({
      url: '/projects/import/preview',
      body: buildImportFormData(file, payload),
      throwOnError: true,
      silent: true,
    });

    return response.data;
  },

  importBundle: async (
    file: File | Blob,
    payload: ImportRequestSchema
  ): Promise<ImportResultSchema> => {
    const response = await client.post<ImportResultSchema, unknown, true>({
      url: '/projects/import',
      body: buildImportFormData(file, payload),
      throwOnError: true,
      silent: true,
    });

    return response.data;
  },
};
