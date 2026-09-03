import { createAppAsyncThunk } from '@/app/providers/store/helpers.ts';

import { dataframeApi, type DownloadDataFrameCsvOptions } from '../api.ts';

export interface DownloadDataFrameCsvResult {
  blob: Blob;
  filename: string | null;
}

const getHeaderValue = (
  headers: Record<string, string | undefined>,
  name: string
): string | undefined => {
  const lower = name.toLowerCase();
  return headers[lower] ?? headers[name];
};

const stripQuotes = (value: string): string => value.replace(/^"|"$/g, '');

const parseFilenameFromContentDisposition = (value?: string): string | null => {
  if (!value) return null;

  const filenameStarMatch = /filename\*=([^;]+)/i.exec(value);
  if (filenameStarMatch?.[1]) {
    const encoded = stripQuotes(filenameStarMatch[1].trim());
    const parts = encoded.split("''");
    const filename = parts.length === 2 ? parts[1] : encoded;
    try {
      return decodeURIComponent(filename);
    } catch {
      return filename;
    }
  }

  const filenameMatch = /filename="?([^";]+)"?/i.exec(value);
  return filenameMatch?.[1]?.trim() ?? null;
};

const resolveFilenameFromHeaders = (
  headers: Record<string, string | undefined>
): string | null => {
  const contentDisposition = getHeaderValue(headers, 'content-disposition');
  const filenameFromDisposition =
    parseFilenameFromContentDisposition(contentDisposition);
  return (
    filenameFromDisposition ?? getHeaderValue(headers, 'x-filename') ?? null
  );
};

export const downloadDataFrameCsv = createAppAsyncThunk<
  DownloadDataFrameCsvResult,
  DownloadDataFrameCsvOptions
>('dataframe/downloadDataFrameCsv', async options => {
  const { data, headers } = await dataframeApi.downloadDataFrameCsv(options);
  const contentType = getHeaderValue(headers, 'content-type') ?? 'text/csv';
  const blob =
    data instanceof Blob ? data : new Blob([data], { type: contentType });

  return {
    blob,
    filename: resolveFilenameFromHeaders(headers),
  };
});
