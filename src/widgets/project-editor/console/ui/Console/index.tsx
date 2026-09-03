import React, { useCallback } from 'react';
import { Collapse } from '@mui/material';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import { selectConsoleUILayout, uiLayoutActions } from '@/features/ui-layout';

import { useLogs } from '@/entities/log';

import { usePointerResize } from '@/shared/lib/hooks/usePointerResize';
import { LogViewer } from '@/shared/ui/log-viewer';

import { ConsoleContainer, ResizeHandle } from './styles.ts';

interface ConsoleContentProps {
  localHeight: number;
  onCloseConsole: () => void;
}

const ConsoleContent: React.FC<ConsoleContentProps> = ({
  localHeight,
  onCloseConsole,
}) => {
  const { logs, clearLogs } = useLogs();

  const handleClear = useCallback(() => {
    clearLogs();
  }, [clearLogs]);

  return (
    <LogViewer
      logs={logs}
      title='Console'
      totalCount={logs.length}
      height={localHeight}
      onClose={onCloseConsole}
      onClear={handleClear}
      downloadFileNamePrefix='console-logs'
    />
  );
};

export const Console: React.FC = () => {
  const dispatch = useAppDispatch();
  const { open, height } = useAppSelector(selectConsoleUILayout);

  const {
    liveValue: localHeight,
    handlePointerDown: onDragStart,
    handlePointerMove: onDragMove,
    handlePointerUp: onDragEnd,
  } = usePointerResize({
    value: height,
    clamp: nextHeight =>
      Math.max(120, Math.min(window.innerHeight * 0.8, nextHeight)),
    getNextValue: ({ currentPointer, startPointer, startValue }) =>
      startValue + (startPointer.y - currentPointer.y),
    onCommit: nextHeight =>
      dispatch(uiLayoutActions.setConsoleHeight(nextHeight)),
    cursor: 'row-resize',
  });

  const handleCloseConsole = useCallback(() => {
    dispatch(uiLayoutActions.setConsoleOpen(false));
  }, [dispatch]);

  if (!open) {
    return null;
  }

  return (
    <ConsoleContainer>
      <Collapse in={open} unmountOnExit>
        <ResizeHandle
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          aria-label='Resize console'
        />

        <ConsoleContent
          localHeight={localHeight}
          onCloseConsole={handleCloseConsole}
        />
      </Collapse>
    </ConsoleContainer>
  );
};
