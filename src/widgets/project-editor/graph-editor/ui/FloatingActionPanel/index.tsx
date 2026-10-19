import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Tooltip } from '@mui/material';
import { FaRegSave } from 'react-icons/fa';
import { MdOutlineDriveFolderUpload } from 'react-icons/md';

import { useAlert } from '@/app/notifications';
import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import {
  flushGraphOperations,
  selectHasPendingGraphChanges,
} from '@/features/project-editor/sync-graph';
import {
  ExportProjectsDialog,
  type ExportTarget,
  ImportProjectsDialog,
  type ImportTarget,
} from '@/features/project-transfer';
import { selectConsoleUILayout } from '@/features/ui-layout';

import { useProjectTask } from '@/entities/project/project-task';
import { useCurrentProject } from '@/entities/project/projects';
import { useTaskExecutionStatus } from '@/entities/project/task-execution-status';
import { useUiPreferences } from '@/entities/ui-preferences';

import { TaskExecutionStatus } from '@/shared/gatewayClient';

import { ExecuteButton } from './ExecuteButton';
import { HardStopConfirmDialog } from './HardStopConfirmDialog';
import { ResetProjectCacheButton } from './ResetProjectCacheButton';
import { ActionButton, ActionDivider, PanelContainer } from './styles';

const TERMINAL_STATUSES: (TaskExecutionStatus | 'IDLE')[] = [
  'SUCCESS',
  'ERROR',
  'CANCELLED',
];

const TOOLTIP_BASE_PROPS = Object.freeze({
  placement: 'left' as const,
  disableInteractive: true,
  enterTouchDelay: 0,
  arrow: true,
});

const ACTION_CONTAINER_SX = Object.freeze({
  position: 'relative',
  display: 'flex',
});

export interface FloatingActionPanelProps {
  /**
   * Перезагружает граф текущего проекта с сервера (как при открытии проекта)
   * и подгоняет viewport. Вызывается после импорта архива в проект.
   */
  onReloadGraph: () => Promise<void>;
}

const FloatingActionPanel_: React.FC<FloatingActionPanelProps> = ({
  onReloadGraph,
}) => {
  const dispatch = useAppDispatch();
  const { currentProject } = useCurrentProject();
  const { showNotification } = useAlert();
  const { skipHardStopConfirm } = useUiPreferences();
  const {
    projectTaskPending,
    projectTaskCancelPending,
    createProjectTask,
    cancelProjectTask,
  } = useProjectTask();
  const taskExecutionStatus = useTaskExecutionStatus();
  const hasPendingGraphChanges = useAppSelector(selectHasPendingGraphChanges);

  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [runRequested, setRunRequested] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [hardStopConfirmOpen, setHardStopConfirmOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const consoleUILayout = useAppSelector(selectConsoleUILayout);

  const CONSOLE_SAFE_GAP = 20;

  const bottomPosition = consoleUILayout.open
    ? consoleUILayout.height + CONSOLE_SAFE_GAP
    : 32;

  const projectId = currentProject?.id ?? null;

  const exportTarget = useMemo<ExportTarget | null>(() => {
    if (!projectId) {
      return null;
    }
    const target: ExportTarget = { projectIds: [projectId], folderIds: [] };
    if (currentProject?.name) {
      target.name = currentProject.name;
    }
    return target;
  }, [currentProject?.name, projectId]);

  const importTarget = useMemo<ImportTarget | null>(
    () => (projectId ? { mode: 'merge', projectId } : null),
    [projectId]
  );

  const isTerminal = TERMINAL_STATUSES.includes(taskExecutionStatus.status);
  const activeTaskId = taskExecutionStatus.taskId ?? currentTaskId;

  const handleExecute = useCallback(async () => {
    if (!currentProject?.id) return;

    const taskResponse = await createProjectTask(currentProject.id, 'full');
    if (!taskResponse.task_id) {
      showNotification({
        type: 'error',
        title: 'Не удалось запустить задачу',
        group: 'task-exec',
      });
      return;
    }

    setCurrentTaskId(taskResponse.task_id);
    setRunRequested(true);
    setCancelRequested(false);
  }, [createProjectTask, currentProject?.id, showNotification]);

  const handleCancel = useCallback(async () => {
    if (!currentProject?.id) return;
    if (!activeTaskId) return;

    const ok = await cancelProjectTask(currentProject.id, activeTaskId);
    if (ok) {
      setCancelRequested(true);
    } else {
      showNotification({
        type: 'error',
        title: 'Не удалось отправить запрос на отмену выполнения',
        group: 'task-exec',
      });
    }
  }, [activeTaskId, cancelProjectTask, currentProject?.id, showNotification]);

  const handleCancelClick = useCallback(() => {
    if (skipHardStopConfirm) {
      void handleCancel();
      return;
    }

    setHardStopConfirmOpen(true);
  }, [handleCancel, skipHardStopConfirm]);

  const handleHardStopConfirm = useCallback(() => {
    setHardStopConfirmOpen(false);
    void handleCancel();
  }, [handleCancel]);

  const handleHardStopCancel = useCallback(() => {
    setHardStopConfirmOpen(false);
  }, []);

  // Незавершённые операции графа должны уйти на сервер до импорта, иначе
  // они применятся поверх уже импортированного (или удалённого) графа.
  const handleBeforeImport = useCallback(async () => {
    if (!hasPendingGraphChanges) {
      return;
    }

    try {
      await dispatch(flushGraphOperations());
    } catch (error) {
      console.error('Failed to flush graph operations before import', error);
    }
  }, [dispatch, hasPendingGraphChanges]);

  const handleImported = useCallback(async () => {
    try {
      await onReloadGraph();
    } catch (error) {
      console.error('Failed to reload graph after import', error);
      showNotification({
        type: 'error',
        title: 'Граф импортирован, но не удалось перезагрузить редактор',
        description: 'Обновите страницу, чтобы увидеть изменения.',
        group: 'project-transfer',
      });
      return;
    }

    // Как при открытии проекта: метаданные для импортированных нод.
    if (projectId) {
      try {
        await createProjectTask(projectId, 'metadata_only', true);
      } catch (error) {
        console.error('Failed to create metadata task after import', error);
      }
    }
  }, [createProjectTask, onReloadGraph, projectId, showNotification]);

  const handleImportedEvent = useCallback(() => {
    void handleImported();
  }, [handleImported]);

  useEffect(() => {
    if (isTerminal) {
      setCurrentTaskId(null);
      setRunRequested(false);
      setCancelRequested(false);
      return;
    }

    if (taskExecutionStatus.status === 'RUNNING') {
      setRunRequested(false);
    }
  }, [isTerminal, taskExecutionStatus.status]);

  const uploadButton = useMemo(
    () => (
      <Tooltip {...TOOLTIP_BASE_PROPS} title='Загрузить проект'>
        <span>
          <ActionButton
            variant='default'
            aria-label='load'
            type='button'
            disabled={!importTarget}
            onClick={() => setImportOpen(true)}
          >
            <MdOutlineDriveFolderUpload />
          </ActionButton>
        </span>
      </Tooltip>
    ),
    [importTarget]
  );

  const exportButton = useMemo(
    () => (
      <Tooltip {...TOOLTIP_BASE_PROPS} title='Сохранить проект'>
        <span>
          <ActionButton
            variant='default'
            aria-label='save'
            type='button'
            disabled={!exportTarget}
            onClick={() => setExportOpen(true)}
          >
            <FaRegSave style={{ width: 18, height: 18 }} />
          </ActionButton>
        </span>
      </Tooltip>
    ),
    [exportTarget]
  );

  return (
    <PanelContainer style={{ bottom: bottomPosition }}>
      <Box sx={ACTION_CONTAINER_SX}>
        <ExecuteButton
          taskStatus={taskExecutionStatus.status}
          projectTaskPending={projectTaskPending}
          projectTaskCancelPending={projectTaskCancelPending}
          runRequested={runRequested}
          cancelRequested={cancelRequested}
          onExecute={handleExecute}
          onCancel={handleCancelClick}
        />
      </Box>

      {/* Загрузка */}
      {uploadButton}

      {/* Сохранение */}
      {exportButton}

      <ActionDivider aria-hidden='true' />

      {/* Сброс кэша проекта */}
      <ResetProjectCacheButton />

      <HardStopConfirmDialog
        open={hardStopConfirmOpen}
        onConfirm={handleHardStopConfirm}
        onCancel={handleHardStopCancel}
      />

      <ExportProjectsDialog
        open={exportOpen}
        target={exportTarget}
        onClose={() => setExportOpen(false)}
      />

      {importTarget ? (
        <ImportProjectsDialog
          open={importOpen}
          target={importTarget}
          onClose={() => setImportOpen(false)}
          onBeforeImport={handleBeforeImport}
          onImported={handleImportedEvent}
        />
      ) : null}
    </PanelContainer>
  );
};

export const FloatingActionPanel = memo(FloatingActionPanel_);
