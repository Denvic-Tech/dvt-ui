import React, { useMemo } from 'react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import { Box, Tooltip } from '@mui/material';

import { TaskExecutionStatus } from '@/shared/gatewayClient';

import {
  ActionButton,
  ActionButtonLoadingTone,
  ActionButtonVariant,
  BouncingDot,
  BouncingDotsContainer,
} from './styles';

const TOOLTIP_BASE_PROPS = Object.freeze({
  placement: 'left' as const,
  disableInteractive: true,
  enterTouchDelay: 0,
  arrow: true,
});

interface ExecuteButtonProps {
  taskStatus: TaskExecutionStatus | 'IDLE';
  projectTaskPending: boolean;
  projectTaskCancelPending: boolean;
  runRequested: boolean;
  cancelRequested: boolean;
  onExecute: () => void;
  onCancel: () => void;
}

interface ExecuteButtonCtx {
  title: string;
  variant: ActionButtonVariant;
  disabled: boolean;
  icon: React.JSX.Element | null;
  action: ExecuteButtonProps['onExecute'] | ExecuteButtonProps['onCancel'];
  loadingTone: ActionButtonLoadingTone;
  dotsColor: string | null;
}

interface BouncingDotsProps {
  color: string;
}

const BouncingDots: React.FC<BouncingDotsProps> = ({ color }) => (
  <BouncingDotsContainer>
    <BouncingDot color={color} delay={0} />
    <BouncingDot color={color} delay={0.15} />
    <BouncingDot color={color} delay={0.3} />
  </BouncingDotsContainer>
);

export const ExecuteButton: React.FC<ExecuteButtonProps> = ({
  taskStatus,
  projectTaskPending,
  projectTaskCancelPending,
  runRequested,
  cancelRequested,
  onExecute,
  onCancel,
}) => {
  const ctx: ExecuteButtonCtx = useMemo(() => {
    const isRunPending =
      projectTaskPending ||
      runRequested ||
      taskStatus === 'QUEUED' ||
      taskStatus === 'ASSIGNED' ||
      taskStatus === 'PENDING' ||
      taskStatus === 'STARTED';
    const isCancelPending =
      projectTaskCancelPending ||
      cancelRequested ||
      taskStatus === 'CANCEL_REQUESTED';

    const _ctx: ExecuteButtonCtx = {
      title: 'Выполнить',
      variant: 'primary',
      disabled: false,
      icon: <PlayArrowIcon />,
      action: onExecute,
      loadingTone: null,
      dotsColor: null,
    };

    if (isCancelPending) {
      _ctx.title = 'Останавливается';
      _ctx.action = onCancel;
      _ctx.variant = 'danger';
      _ctx.icon = null;
      _ctx.disabled = true;
      _ctx.loadingTone = 'danger';
      _ctx.dotsColor = '#ef4444';
      return _ctx;
    }

    if (taskStatus === 'RUNNING') {
      _ctx.title = 'Остановить';
      _ctx.action = onCancel;
      _ctx.variant = 'danger';
      _ctx.icon = <StopIcon />;
      return _ctx;
    }

    if (isRunPending) {
      _ctx.title = 'Запускается';
      _ctx.variant = 'primary';
      _ctx.icon = null;
      _ctx.disabled = true;
      _ctx.loadingTone = 'primary';
      _ctx.dotsColor = '#6366f1';
    }

    return _ctx;
  }, [
    cancelRequested,
    onCancel,
    onExecute,
    projectTaskCancelPending,
    projectTaskPending,
    runRequested,
    taskStatus,
  ]);

  return (
    <Box sx={{ position: 'relative', display: 'flex' }}>
      <Tooltip {...TOOLTIP_BASE_PROPS} title={ctx.title}>
        <span>
          <ActionButton
            data-testid='widgets/project-editor/graph-editor/project-run-button'
            data-action-state={ctx.title}
            variant={ctx.variant}
            loadingTone={ctx.loadingTone}
            aria-label={ctx.title}
            type='button'
            onClick={ctx.action}
            disabled={ctx.disabled}
          >
            {ctx.dotsColor ? <BouncingDots color={ctx.dotsColor} /> : ctx.icon}
          </ActionButton>
        </span>
      </Tooltip>
    </Box>
  );
};
