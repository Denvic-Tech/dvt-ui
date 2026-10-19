import { useCallback, useEffect, useRef, useState } from 'react';

import { useAlert } from '@/app/notifications';

import type {
  ImportPreviewSchema,
  ImportRequestSchema,
  ImportResultSchema,
} from '@/shared/gatewayClient';
import { isApiError } from '@/shared/lib/errors';

import { projectTransferApi } from '../../api/projectTransferApi';
import { getApiErrorDescription } from '../../lib/errorMessage';
import {
  buildImportRequest,
  createInitialDecisions,
  type ImportDecisionsState,
  type ImportRequestIssue,
  type ImportTarget,
} from '../../lib/importRequest';

import { buildImportSummary } from './importSummary';

export const PROJECT_TRANSFER_NOTIFICATION_GROUP = 'project-transfer';

/** Код ошибки бэкенда `InvalidPassphraseError` */
const INVALID_PASSPHRASE_CODE = 'PROJECT_TRANSFER_005';
const INVALID_PASSPHRASE_NAME = 'PROJECT_TRANSFER_INVALID_PASSPHRASE';

const BUNDLE_FILE_PATTERN = /\.dvtpkg$/i;

export type ImportStep = 'pick' | 'decisions';

export interface UseImportProjectsParams {
  target: ImportTarget;
  /** Вызывается перед `POST /projects/import` (например, flush очереди графа) */
  onBeforeImport?: (() => Promise<void> | void) | undefined;
  onImported?:
    | ((result: ImportResultSchema, preview: ImportPreviewSchema) => void)
    | undefined;
}

const buildPreviewRequest = (target: ImportTarget): ImportRequestSchema => ({
  mode: target.mode,
  folder_id: target.mode === 'create' ? target.folderId : null,
  project_id: target.mode === 'merge' ? target.projectId : null,
  merge_strategy: 'append',
});

const isInvalidPassphraseError = (error: unknown): boolean =>
  isApiError(error) &&
  (error.payload.code === INVALID_PASSPHRASE_CODE ||
    error.payload.name === INVALID_PASSPHRASE_NAME);

/**
 * Состояние диалога импорта: выбор файла → preview → решения → импорт.
 * Итог импорта показывается уведомлением; ошибки чтения файла и неверный
 * пароль возвращаются в UI, остальные ошибки — через useAlert.
 */
export const useImportProjects = ({
  target,
  onBeforeImport,
  onImported,
}: UseImportProjectsParams) => {
  const { showNotification } = useAlert();
  const [step, setStep] = useState<ImportStep>('pick');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreviewSchema | null>(null);
  const [decisions, setDecisions] = useState<ImportDecisionsState | null>(null);
  const [issues, setIssues] = useState<ImportRequestIssue[]>([]);
  const [passphraseInvalid, setPassphraseInvalid] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const previewRequestRef = useRef(0);

  const targetRef = useRef(target);
  const onBeforeImportRef = useRef(onBeforeImport);
  const onImportedRef = useRef(onImported);
  useEffect(() => {
    targetRef.current = target;
    onBeforeImportRef.current = onBeforeImport;
    onImportedRef.current = onImported;
  });

  const backToFile = useCallback(() => {
    previewRequestRef.current += 1;
    setStep('pick');
    setFile(null);
    setFileError(null);
    setPreview(null);
    setDecisions(null);
    setIssues([]);
    setPassphraseInvalid(false);
    setPreviewLoading(false);
  }, []);

  const reset = useCallback(() => {
    backToFile();
    setImporting(false);
  }, [backToFile]);

  const selectFile = useCallback(async (nextFile: File) => {
    if (!BUNDLE_FILE_PATTERN.test(nextFile.name)) {
      setFileError(`«${nextFile.name}» — не файл экспорта DVT`);
      return;
    }

    const requestId = previewRequestRef.current + 1;
    previewRequestRef.current = requestId;

    setFile(nextFile);
    setFileError(null);
    setPreview(null);
    setDecisions(null);
    setIssues([]);
    setPassphraseInvalid(false);
    setPreviewLoading(true);

    try {
      const nextPreview = await projectTransferApi.previewImport(
        nextFile,
        buildPreviewRequest(targetRef.current)
      );
      if (previewRequestRef.current !== requestId) {
        return;
      }
      setPreview(nextPreview);
      setDecisions(createInitialDecisions(nextPreview));
      setStep('decisions');
    } catch (error) {
      if (previewRequestRef.current !== requestId) {
        return;
      }
      console.error('Project import preview failed', error);
      setFileError(
        getApiErrorDescription(
          error,
          'Не удалось прочитать файл. Проверьте, что выбран корректный .dvtpkg.'
        )
      );
      setFile(null);
    } finally {
      if (previewRequestRef.current === requestId) {
        setPreviewLoading(false);
      }
    }
  }, []);

  const updateDecisions = useCallback(
    (updater: (prev: ImportDecisionsState) => ImportDecisionsState) => {
      setDecisions(prev => (prev ? updater(prev) : prev));
      setIssues([]);
      setPassphraseInvalid(false);
    },
    []
  );

  const runImport = useCallback(async (): Promise<boolean> => {
    if (!file || !preview || !decisions || importing) {
      return false;
    }

    const built = buildImportRequest(targetRef.current, preview, decisions);
    if (built.issues.length > 0) {
      setIssues(built.issues);
      return false;
    }

    setIssues([]);
    setPassphraseInvalid(false);
    setImporting(true);
    try {
      await onBeforeImportRef.current?.();
      const nextResult = await projectTransferApi.importBundle(
        file,
        built.request
      );
      const summary = buildImportSummary(
        targetRef.current.mode,
        preview,
        decisions,
        nextResult
      );
      showNotification({
        ...summary,
        group: PROJECT_TRANSFER_NOTIFICATION_GROUP,
        ...(summary.type === 'warning' ? { autoCloseDuration: null } : {}),
      });
      onImportedRef.current?.(nextResult, preview);
      return true;
    } catch (error) {
      if (isInvalidPassphraseError(error)) {
        setPassphraseInvalid(true);
        return false;
      }
      console.error('Project import failed', error);
      showNotification({
        type: 'error',
        title: 'Не удалось импортировать',
        description: getApiErrorDescription(
          error,
          'Сервер отклонил импорт. Попробуйте ещё раз.'
        ),
        group: PROJECT_TRANSFER_NOTIFICATION_GROUP,
      });
      return false;
    } finally {
      setImporting(false);
    }
  }, [decisions, file, importing, preview, showNotification]);

  return {
    step,
    file,
    fileError,
    preview,
    decisions,
    issues,
    passphraseInvalid,
    previewLoading,
    importing,
    selectFile,
    setFileError,
    updateDecisions,
    backToFile,
    runImport,
    reset,
  };
};
