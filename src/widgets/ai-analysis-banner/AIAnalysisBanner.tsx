import { useEffect, useMemo, useRef, useState } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BoltIcon from '@mui/icons-material/Bolt';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';

import { useAlert } from '@/app/notifications';
import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import {
  dismissAIAnalysisBannerForTask,
  selectHasActiveAIAnalysis,
  startAIAnalysis,
} from '@/entities/ai-analysis';
import { selectIsAIAnalysisEnabled } from '@/entities/config/runtime-config';
import { useCurrentProject } from '@/entities/project/projects';
import {
  selectTaskExecutionStatus,
  selectTaskExecutionTaskId,
} from '@/entities/project/task-execution-status';

import { Button, Tooltip } from '@/shared/ui';

import { shouldCaptureLiveErrorTask, shouldResetLiveErrorTask } from './lib';

const BannerContainer = styled('div')({
  position: 'fixed',
  bottom: 20,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 14px 10px 16px',
  backgroundColor: '#ffffff',
  borderRadius: 24,
  boxShadow:
    '0 12px 32px rgba(99, 102, 241, 0.18), 0 2px 6px rgba(0, 0, 0, 0.04)',
  border: '1px solid #e5e7eb',
  zIndex: 1100,
  animation: 'aiBannerEnter 240ms cubic-bezier(0.16, 1, 0.3, 1)',

  '@keyframes aiBannerEnter': {
    from: {
      opacity: 0,
      transform: 'translate(-50%, 24px)',
    },
    to: {
      opacity: 1,
      transform: 'translate(-50%, 0)',
    },
  },
});

const IconWrapper = styled('div')({
  width: 32,
  height: 32,
  borderRadius: 10,
  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
  color: '#ffffff',
});

const TextBlock = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
});

const Title = styled('div')({
  fontSize: 13,
  fontWeight: 600,
  color: '#111827',
  lineHeight: 1.3,
  whiteSpace: 'nowrap',
});

const Subtitle = styled('div')({
  fontSize: 12,
  color: '#6b7280',
  lineHeight: 1.3,
  whiteSpace: 'nowrap',
});

const DismissButton = styled('button')({
  width: 28,
  height: 28,
  backgroundColor: 'transparent',
  border: 'none',
  color: '#9ca3af',
  cursor: 'pointer',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  transition: 'all 150ms ease',

  '&:hover': {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
});

export const AIAnalysisBanner = () => {
  const dispatch = useAppDispatch();
  const { showNotification } = useAlert();
  const { currentProject } = useCurrentProject();
  const projectId = currentProject?.id;
  const isAIAnalysisEnabled = useAppSelector(selectIsAIAnalysisEnabled);
  const [liveErrorTaskId, setLiveErrorTaskId] = useState<string | null>(null);
  const taskExecutionStatus = useAppSelector(selectTaskExecutionStatus);
  const taskExecutionTaskId = useAppSelector(selectTaskExecutionTaskId);
  const previousTaskStatusRef = useRef(taskExecutionStatus);
  const previousTaskIdRef = useRef<string | null>(taskExecutionTaskId);
  const isFirstRenderRef = useRef(true);
  const hasActive = useAppSelector(state =>
    selectHasActiveAIAnalysis(state, projectId)
  );
  const dismissedTaskIds = useAppSelector(
    state => state.aiAnalysis.bannerDismissedForTaskIds
  );

  useEffect(() => {
    setLiveErrorTaskId(null);
    previousTaskStatusRef.current = taskExecutionStatus;
    previousTaskIdRef.current = taskExecutionTaskId;
    isFirstRenderRef.current = true;
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    if (
      shouldResetLiveErrorTask({
        liveErrorTaskId,
        nextStatus: taskExecutionStatus,
        nextTaskId: taskExecutionTaskId,
      })
    ) {
      setLiveErrorTaskId(null);
    }

    if (
      shouldCaptureLiveErrorTask({
        isFirstRender: isFirstRenderRef.current,
        previousStatus: previousTaskStatusRef.current,
        previousTaskId: previousTaskIdRef.current,
        nextStatus: taskExecutionStatus,
        nextTaskId: taskExecutionTaskId,
      })
    ) {
      setLiveErrorTaskId(taskExecutionTaskId);
    }

    previousTaskStatusRef.current = taskExecutionStatus;
    previousTaskIdRef.current = taskExecutionTaskId;
    isFirstRenderRef.current = false;
  }, [projectId, taskExecutionStatus, taskExecutionTaskId, liveErrorTaskId]);

  const visibleTaskId = useMemo(
    () =>
      isAIAnalysisEnabled &&
      projectId &&
      liveErrorTaskId &&
      !hasActive &&
      !dismissedTaskIds.includes(liveErrorTaskId)
        ? liveErrorTaskId
        : null,
    [
      dismissedTaskIds,
      hasActive,
      isAIAnalysisEnabled,
      liveErrorTaskId,
      projectId,
    ]
  );

  const isVisible = Boolean(visibleTaskId);

  if (!isVisible || !projectId || !visibleTaskId) {
    return null;
  }

  const handleRun = async () => {
    try {
      await dispatch(
        startAIAnalysis({
          projectId,
          task_id: visibleTaskId,
        })
      ).unwrap();
      dispatch(dismissAIAnalysisBannerForTask(visibleTaskId));
      setLiveErrorTaskId(null);
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'AI-анализ не запущен',
        description:
          error instanceof Error
            ? error.message
            : 'Не удалось запустить анализ ошибки',
      });
    }
  };

  return (
    <BannerContainer role='status' aria-live='polite'>
      <IconWrapper>
        <AutoAwesomeIcon sx={{ fontSize: 16 }} />
      </IconWrapper>
      <TextBlock>
        <Title>Не понятна причина ошибки?</Title>
        <Subtitle>AI разберёт лог и предложит решение</Subtitle>
      </TextBlock>
      <Tooltip title={hasActive ? 'Уже есть активный анализ' : ''}>
        <span>
          <Button
            size='sm'
            onClick={handleRun}
            disabled={hasActive}
            sx={{ borderRadius: '12px', fontSize: 12, fontWeight: 600 }}
          >
            <BoltIcon sx={{ fontSize: 14 }} />
            Запустить анализ
          </Button>
        </span>
      </Tooltip>
      <DismissButton
        type='button'
        onClick={() => dispatch(dismissAIAnalysisBannerForTask(visibleTaskId))}
        aria-label='Закрыть'
      >
        <CloseIcon sx={{ fontSize: 16 }} />
      </DismissButton>
    </BannerContainer>
  );
};
