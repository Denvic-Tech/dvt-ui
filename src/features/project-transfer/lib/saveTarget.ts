import { downloadBlob } from './downloadBlob';

type WritableFile = {
  write: (data: Blob) => Promise<void>;
  close: () => Promise<void>;
};

type SaveFilePicker = (options?: {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{ createWritable: () => Promise<WritableFile> }>;

/** Куда сохранить архив: выбранный в проводнике файл или обычное скачивание. */
export type SaveTarget = {
  save: (blob: Blob, fileName: string) => Promise<void>;
};

const INVALID_FILE_NAME_CHARS = /[\\/:*?"<>|]+/g;

/** Имя архива по умолчанию для диалога сохранения. */
export const buildBundleFileName = (name: string | undefined): string => {
  const base = (name ?? '')
    .replace(INVALID_FILE_NAME_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `${base || 'export'}.dvtpkg`;
};

const DOWNLOAD_TARGET: SaveTarget = {
  save: async (blob, fileName) => downloadBlob(blob, fileName),
};

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError';

/**
 * Сразу открывает системный диалог сохранения (File System Access API),
 * пока жив пользовательский жест: вызывать до запроса к серверу.
 * Возвращает `null`, если пользователь закрыл диалог. В браузерах без API
 * (или если диалог не открылся) архив скачивается обычным способом под
 * именем от сервера.
 */
export const requestSaveTarget = async (
  suggestedName: string
): Promise<SaveTarget | null> => {
  const showSaveFilePicker = (
    window as Window & { showSaveFilePicker?: SaveFilePicker }
  ).showSaveFilePicker;

  if (!showSaveFilePicker) {
    return DOWNLOAD_TARGET;
  }

  try {
    const handle = await showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: 'Архив DVT',
          accept: { 'application/zip': ['.dvtpkg'] },
        },
      ],
    });
    return {
      save: async blob => {
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      },
    };
  } catch (error) {
    if (isAbortError(error)) {
      return null;
    }
    console.warn('Save file picker failed, falling back to download', error);
    return DOWNLOAD_TARGET;
  }
};
