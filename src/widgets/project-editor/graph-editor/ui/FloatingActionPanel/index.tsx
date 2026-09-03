import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import UploadIcon from '@mui/icons-material/Upload';
import { Box, Tooltip } from '@mui/material';
import { Edge } from '@xyflow/react';
import { FaDownload } from 'react-icons/fa';

import { useAlert } from '@/app/notifications';
import { useAppSelector } from '@/app/providers/store';

import { useExportGraph } from '@/features/project-editor/export-graph';
import { useImportGraph } from '@/features/project-editor/import-graph';
import { selectConsoleUILayout } from '@/features/ui-layout';

import { useProjectTask } from '@/entities/project/project-task';
import { useCurrentProject } from '@/entities/project/projects';
import { useTaskExecutionStatus } from '@/entities/project/task-execution-status';
import { CustomNodeType } from '@/entities/project-editor/graph';
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
  onCreate: (payload: {
    nodes?: CustomNodeType[];
    edges?: Edge[];
  }) => Promise<void>;
}

const FloatingActionPanel_: React.FC<FloatingActionPanelProps> = ({
  onCreate,
}) => {
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

  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [runRequested, setRunRequested] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [hardStopConfirmOpen, setHardStopConfirmOpen] = useState(false);

  const consoleUILayout = useAppSelector(selectConsoleUILayout);

  const CONSOLE_SAFE_GAP = 20;

  const bottomPosition = consoleUILayout.open
    ? consoleUILayout.height + CONSOLE_SAFE_GAP
    : 32;

  const { handleImport } = useImportGraph({ onCreate });
  const { handleExport } = useExportGraph();

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
      <Tooltip {...TOOLTIP_BASE_PROPS} title='Загрузить пайплайн'>
        <span>
          <ActionButton
            variant='default'
            aria-label='load'
            type='button'
            onClick={handleImport}
          >
            <UploadIcon />
          </ActionButton>
        </span>
      </Tooltip>
    ),
    [handleImport]
  );

  const exportButton = useMemo(
    () => (
      <Tooltip {...TOOLTIP_BASE_PROPS} title='Сохранить пайплайн'>
        <span>
          <ActionButton
            variant='default'
            aria-label='save'
            type='button'
            onClick={handleExport}
          >
            <FaDownload />
          </ActionButton>
        </span>
      </Tooltip>
    ),
    [handleExport]
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
    </PanelContainer>
  );
};

export const FloatingActionPanel = memo(FloatingActionPanel_);
