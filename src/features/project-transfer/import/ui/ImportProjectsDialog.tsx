import React, { useEffect, useId, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import { Lock, X } from 'lucide-react';

import { useConnections } from '@/entities/data/db-connection';

import type {
  ImportPreviewSchema,
  ImportResultSchema,
} from '@/shared/gatewayClient';

import type {
  ImportDecisionsState,
  ImportTarget,
} from '../../lib/importRequest';
import {
  closeButtonSx,
  getTransferDialogSlotProps,
  getTransferTokens,
  ghostButtonSx,
  INTER_FONT,
  primaryButtonSx,
  thinScrollbarSx,
} from '../../ui/transferDialogStyles';
import { ButtonSpinner, OptionItem } from '../../ui/transferDialogUi';
import {
  type ExistingConnectionOption,
  getConnectionOptions,
} from '../model/connectionOptions';
import { useImportProjects } from '../model/useImportProjects';

import { ConnectionsMappingDialog } from './ConnectionsMappingDialog';
import { ImportConnectionsSummary } from './ImportConnectionsSummary';
import { ImportDropZone } from './ImportDropZone';
import { ImportFileCard } from './ImportFileCard';
import {
  ImportPassphraseField,
  MergeStrategySwitch,
  MessageList,
} from './importSettingsParts';

export interface ImportProjectsDialogProps {
  open: boolean;
  target: ImportTarget;
  onClose: () => void;
  /** Вызывается перед отправкой импорта (например, flush очереди графа) */
  onBeforeImport?: () => Promise<void> | void;
  /** Вызывается после успешного импорта (обновление списка / графа) */
  onImported?: (
    result: ImportResultSchema,
    preview: ImportPreviewSchema
  ) => void;
}

const IMPORT_DIALOG_SLOT_PROPS = getTransferDialogSlotProps({
  width: 520,
  interFont: true,
});

const getPreviewNotes = (preview: ImportPreviewSchema): string[] => [
  ...(preview.unknown_node_names.length > 0
    ? [`Неизвестные типы нод: ${preview.unknown_node_names.join(', ')}`]
    : []),
  ...(preview.unavailable_extensions.length > 0
    ? [`Недоступные расширения: ${preview.unavailable_extensions.join(', ')}`]
    : []),
  ...preview.warnings.map(warning => warning.message),
];

export const ImportProjectsDialog: React.FC<ImportProjectsDialogProps> = ({
  open,
  target,
  onClose,
  onBeforeImport,
  onImported,
}) => {
  const titleId = useId();
  const [mappingOpen, setMappingOpen] = useState(false);
  const {
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
    updateDecisions,
    backToFile,
    runImport,
    reset,
  } = useImportProjects({ target, onBeforeImport, onImported });
  const { connections: availableConnections, fetchConnections } =
    useConnections();

  useEffect(() => {
    if (open) {
      reset();
      setMappingOpen(false);
    }
  }, [open, reset]);

  const hasConnections = (preview?.connections.length ?? 0) > 0;
  useEffect(() => {
    if (hasConnections) {
      void fetchConnections();
    }
  }, [fetchConnections, hasConnections]);

  const optionsByRef = useMemo(() => {
    const options: Record<string, ExistingConnectionOption[]> = {};
    for (const connection of preview?.connections ?? []) {
      options[connection.ref] = getConnectionOptions(
        connection,
        availableConnections
      );
    }
    return options;
  }, [availableConnections, preview?.connections]);

  const title = target.mode === 'merge' ? 'Импорт в проект' : 'Импорт проектов';

  const handleClose = () => {
    if (importing) {
      return;
    }
    onClose();
  };

  const settings =
    step === 'decisions' && file && preview && decisions ? (
      <ImportSettings
        target={target}
        file={file}
        preview={preview}
        decisions={decisions}
        optionsByRef={optionsByRef}
        issues={issues.map(issue => issue.message)}
        passphraseInvalid={passphraseInvalid}
        disabled={importing}
        onReset={backToFile}
        onConfigureConnections={() => setMappingOpen(true)}
        onChange={updateDecisions}
      />
    ) : null;

  const handleImport = async () => {
    if (await runImport()) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby={titleId}
      data-testid='features/project-transfer/import-dialog'
      slotProps={IMPORT_DIALOG_SLOT_PROPS}
    >
      {step === 'pick' ? (
        <Box sx={{ position: 'relative' }}>
          <Box
            component='h2'
            id={titleId}
            sx={{
              position: 'absolute',
              width: 1,
              height: 1,
              overflow: 'hidden',
              clip: 'rect(0 0 0 0)',
            }}
          >
            {title}
          </Box>
          <Box
            component='button'
            type='button'
            aria-label='Закрыть'
            onClick={handleClose}
            sx={theme => ({
              ...closeButtonSx(theme),
              position: 'absolute',
              top: 20,
              right: 20,
              mr: 0,
              zIndex: 2,
            })}
          >
            <X size={16} strokeWidth={1.8} />
          </Box>
          <ImportDropZone
            title={title}
            error={fileError}
            reading={previewLoading}
            onFile={nextFile => void selectFile(nextFile)}
          />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              p: '16px 24px 2px',
            }}
          >
            <Box
              component='h2'
              id={titleId}
              sx={theme => ({
                flex: 1,
                m: 0,
                fontFamily: INTER_FONT,
                fontSize: 16,
                fontWeight: 650,
                lineHeight: 1.5,
                letterSpacing: '-.015em',
                color: getTransferTokens(theme).text,
              })}
            >
              {title}
            </Box>
            <Box
              component='button'
              type='button'
              aria-label='Закрыть'
              disabled={importing}
              onClick={handleClose}
              sx={closeButtonSx}
            >
              <X size={16} strokeWidth={1.8} />
            </Box>
          </Box>

          {settings}

          <Box
            sx={theme => {
              const t = getTransferTokens(theme);
              return {
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                p: '14px 24px',
                borderTop: `1px solid ${t.border}`,
                background: t.bg,
              };
            }}
          >
            <>
              <Box
                component='button'
                type='button'
                disabled={importing}
                onClick={handleClose}
                sx={ghostButtonSx}
              >
                Отмена
              </Box>
              <Box
                component='button'
                type='button'
                disabled={importing || !settings}
                onClick={() => void handleImport()}
                data-testid='features/project-transfer/import-submit'
                sx={primaryButtonSx}
              >
                {importing ? <ButtonSpinner /> : null}
                {importing ? 'Импорт…' : 'Импортировать'}
              </Box>
            </>
          </Box>
        </>
      )}

      {preview && decisions ? (
        <ConnectionsMappingDialog
          open={mappingOpen}
          connections={preview.connections}
          decisions={decisions.connections}
          optionsByRef={optionsByRef}
          onApply={connections =>
            updateDecisions(prev => ({ ...prev, connections }))
          }
          onClose={() => setMappingOpen(false)}
        />
      ) : null}
    </Dialog>
  );
};

interface ImportSettingsProps {
  target: ImportTarget;
  file: File;
  preview: ImportPreviewSchema;
  decisions: ImportDecisionsState;
  optionsByRef: Record<string, ExistingConnectionOption[]>;
  issues: string[];
  passphraseInvalid: boolean;
  disabled: boolean;
  onReset: () => void;
  onConfigureConnections: () => void;
  onChange: (
    updater: (prev: ImportDecisionsState) => ImportDecisionsState
  ) => void;
}

/** Шаг настроек импорта после чтения архива. */
const ImportSettings: React.FC<ImportSettingsProps> = ({
  target,
  file,
  preview,
  decisions,
  optionsByRef,
  issues,
  passphraseInvalid,
  disabled,
  onReset,
  onConfigureConnections,
  onChange,
}) => {
  const bundleHasSchedule = preview.projects.some(
    project => project.has_schedule_in_bundle
  );
  const hasExistingSchedule =
    target.mode === 'merge' &&
    preview.projects.some(project => project.has_existing_schedule);
  const canManageSchedules = preview.can_manage_schedules;

  return (
    <Box
      sx={theme => ({
        ...thinScrollbarSx(theme),
        overflowY: 'auto',
        overflowX: 'hidden',
        p: '16px 24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
      })}
    >
      <ImportFileCard
        file={file}
        preview={preview}
        disabled={disabled}
        onReset={onReset}
      />

      <MessageList
        messages={getPreviewNotes(preview)}
        tone='warning'
        testId='features/project-transfer/import-warnings'
      />

      {target.mode === 'merge' && preview.target_has_graph ? (
        <MergeStrategySwitch
          value={decisions.mergeStrategy ?? 'append'}
          disabled={disabled}
          onChange={mergeStrategy =>
            onChange(prev => ({ ...prev, mergeStrategy }))
          }
        />
      ) : null}

      {preview.connections.length > 0 ? (
        <ImportConnectionsSummary
          connections={preview.connections}
          decisions={decisions.connections}
          optionsByRef={optionsByRef}
          disabled={disabled}
          onConfigure={onConfigureConnections}
        />
      ) : null}

      {preview.manifest.has_secrets ? (
        <ImportPassphraseField
          value={decisions.passphrase}
          invalid={passphraseInvalid}
          disabled={disabled}
          onChange={passphrase => onChange(prev => ({ ...prev, passphrase }))}
        />
      ) : null}

      {bundleHasSchedule ? (
        <Box sx={{ m: '-10px -12px' }}>
          <OptionItem
            title='Расписание'
            description={
              canManageSchedules ? (
                hasExistingSchedule ? (
                  'Заменит текущее расписание проекта'
                ) : (
                  'Импортировать настройки планировщика из файла'
                )
              ) : (
                <>
                  <Lock size={12} strokeWidth={2} />
                  Доступно администраторам
                </>
              )
            }
            checked={canManageSchedules && decisions.schedule.importSchedule}
            disabled={disabled || !canManageSchedules}
            dimmed={!canManageSchedules}
            onCheckedChange={importSchedule =>
              onChange(prev => ({
                ...prev,
                schedule: {
                  ...prev.schedule,
                  importSchedule,
                  conflict: hasExistingSchedule ? 'overwrite' : 'keep',
                },
              }))
            }
          />
          {canManageSchedules && decisions.schedule.importSchedule ? (
            <OptionItem
              title='Включить расписание после импорта'
              description='Сразу после импорта проект станет активным в планировщике и начнёт запускаться по расписанию'
              checked={decisions.schedule.enable}
              disabled={disabled}
              onCheckedChange={enable =>
                onChange(prev => ({
                  ...prev,
                  schedule: { ...prev.schedule, enable },
                }))
              }
            />
          ) : null}
        </Box>
      ) : null}

      <MessageList
        messages={issues}
        tone='error'
        testId='features/project-transfer/import-issues'
      />
    </Box>
  );
};
