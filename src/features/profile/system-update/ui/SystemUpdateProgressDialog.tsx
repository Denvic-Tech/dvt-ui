import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import { IconArrowDown, IconCopy } from '@tabler/icons-react';

import type { UpdateStepSchema } from '@/shared/gatewayClient';
import { Spinner } from '@/shared/ui';

import type { SystemUpdateState } from '../model/types';

import {
  dialogBackdropSx,
  dialogPaperSx,
  HeaderAside,
  HeaderButton,
  HeaderCounter,
  HeaderSubtitle,
  HeaderText,
  HeaderTile,
  HeaderTitle,
  type HeaderTone,
  LOG_COPY_BUTTON_CLASS,
  LogColumn,
  LogCommand,
  LogCopyButton,
  LogJumpButton,
  LogLine,
  LogScroll,
  LogWrap,
  ModalBody,
  ModalEndSpacer,
  ModalHeader,
  StatusNotice,
  StepDetail,
  StepIcon,
  StepList,
  StepName,
  StepRow,
  StepsColumn,
  StepsNote,
  StepsPending,
  StepSpinner,
  StepText,
  type StepTone,
} from './styles';

export const SYSTEM_UPDATE_GATEWAY_TIMEOUT_MESSAGE =
  'Gateway не удалось восстановить. Обновление может продолжаться или завершиться ошибкой. Обратитесь к администратору и проверьте installation manager.';

const TITLE_ID = 'system-update-progress-title';

// Closer to the bottom than this counts as being at the bottom.
const LOG_BOTTOM_THRESHOLD = 8;

const HEADER_TITLES: Record<HeaderTone, string> = {
  run: 'Обновление DVT',
  error: 'Обновление не завершено',
  done: 'DVT обновлён',
};

const HeaderIcon = ({ tone }: { tone: HeaderTone }) => {
  if (tone === 'done') {
    return (
      <svg width='20' height='20' viewBox='0 0 16 16' fill='none' aria-hidden>
        <path
          d='M3.5 8.5l3 3 6-7'
          stroke='currentColor'
          strokeWidth='1.6'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    );
  }

  if (tone === 'error') {
    return (
      <svg width='20' height='20' viewBox='0 0 16 16' fill='none' aria-hidden>
        <g stroke='currentColor' strokeWidth='1.5' strokeLinecap='round'>
          <circle cx='8' cy='8' r='6' />
          <path d='M8 5v3.4M8 10.9v.1' />
        </g>
      </svg>
    );
  }

  return (
    <svg width='20' height='20' viewBox='0 0 16 16' fill='none' aria-hidden>
      <g
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <path d='M13.5 8a5.5 5.5 0 0 1-9.7 3.5M2.5 8a5.5 5.5 0 0 1 9.7-3.5' />
        <path d='M12.6 1.9v2.8H9.8M3.4 14.1v-2.8h2.8' />
      </g>
    </svg>
  );
};

const getStepTone = (status: UpdateStepSchema['status']): StepTone => {
  if (status === 'ok') {
    return 'done';
  }

  if (status === 'failed' || status === 'running') {
    return status;
  }

  return 'pending';
};

const StepStatusIcon = ({ tone }: { tone: StepTone }) => {
  if (tone === 'running') {
    return <StepSpinner aria-hidden />;
  }

  if (tone === 'done') {
    return (
      <svg width='16' height='16' viewBox='0 0 16 16' aria-hidden>
        <circle cx='8' cy='8' r='8' fill='#E6F6EE' />
        <path
          d='M4.8 8.3l2.2 2.2 4.2-4.6'
          fill='none'
          stroke='#1E9E63'
          strokeWidth='1.7'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    );
  }

  if (tone === 'failed') {
    return (
      <svg width='16' height='16' viewBox='0 0 16 16' aria-hidden>
        <circle cx='8' cy='8' r='8' fill='#FDECEC' />
        <path
          d='M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8'
          fill='none'
          stroke='#E5484D'
          strokeWidth='1.7'
          strokeLinecap='round'
        />
      </svg>
    );
  }

  return (
    <svg width='16' height='16' viewBox='0 0 16 16' aria-hidden>
      <circle
        cx='8'
        cy='8'
        r='6.5'
        fill='#fff'
        stroke='#D3D8E2'
        strokeWidth='1.5'
      />
    </svg>
  );
};

const isErrorLogLine = (line: string) => {
  const normalized = line.toLowerCase();

  return (
    normalized.includes('error') ||
    normalized.includes('failed') ||
    normalized.includes('ошиб')
  );
};

interface SystemUpdateProgressDialogProps {
  state: SystemUpdateState;
  // The installed version, shown before the target one.
  currentVersion?: string | null | undefined;
  onClear: () => void;
  onPause: () => void;
  onReload: () => void;
}

export const SystemUpdateProgressDialog = ({
  state,
  currentVersion,
  onClear,
  onPause,
  onReload,
}: SystemUpdateProgressDialogProps) => {
  const logRef = React.useRef<HTMLDivElement | null>(null);
  // Follow new lines only while the log is scrolled to the bottom.
  const [followLog, setFollowLog] = React.useState(true);
  const steps = state.snapshot?.steps ?? [];
  const finishedSteps = steps.filter(
    step => step.status === 'ok' || step.status === 'failed'
  ).length;
  const targetVersion =
    state.snapshot?.version || state.marker?.targetVersion || '';
  const isFailed = state.phase === 'failed' || state.phase === 'status_error';
  const isSucceeded = state.phase === 'succeeded';
  const tone: HeaderTone = isSucceeded ? 'done' : isFailed ? 'error' : 'run';
  const commandLine = `$ dvt-installer update --tag ${targetVersion}`;
  const subtitle = currentVersion
    ? `${currentVersion} → ${targetVersion}`
    : targetVersion;
  const errorMessage =
    state.phase === 'failed'
      ? state.snapshot?.error ||
        'Installation manager не сообщил подробности ошибки.'
      : state.phase === 'status_error'
        ? state.error?.message || 'Получен неожиданный статус обновления.'
        : null;
  const reconnectMessage =
    state.phase === 'reconnecting'
      ? state.reconnectTimedOut
        ? SYSTEM_UPDATE_GATEWAY_TIMEOUT_MESSAGE
        : 'Переподключение к gateway…'
      : null;

  const scrollLogToBottom = React.useCallback(() => {
    const logElement = logRef.current;

    if (logElement) {
      logElement.scrollTop = logElement.scrollHeight;
    }
  }, []);

  React.useLayoutEffect(() => {
    if (followLog) {
      scrollLogToBottom();
    }
  }, [followLog, scrollLogToBottom, state.logs.length]);

  const handleLogScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollHeight, scrollTop, clientHeight } = event.currentTarget;
    setFollowLog(
      scrollHeight - scrollTop - clientHeight <= LOG_BOTTOM_THRESHOLD
    );
  };

  const handleCopyLog = () => {
    const text = [commandLine, ...state.logs].join('\n');
    void navigator.clipboard?.writeText(text).catch(() => {});
  };

  const renderHeaderAside = () => {
    if (isSucceeded) {
      return (
        <HeaderButton disableRipple onClick={onReload}>
          Закрыть
        </HeaderButton>
      );
    }

    if (isFailed) {
      return (
        <HeaderButton disableRipple onClick={onClear}>
          Закрыть
        </HeaderButton>
      );
    }

    return (
      <>
        {steps.length > 0 ? (
          <HeaderCounter>
            {finishedSteps} из {steps.length}
          </HeaderCounter>
        ) : null}
        {state.phase === 'reconnecting' && state.reconnectTimedOut ? (
          <HeaderButton disableRipple onClick={onPause}>
            Вернуться и продолжить позже
          </HeaderButton>
        ) : null}
      </>
    );
  };

  return (
    <Dialog
      aria-labelledby={TITLE_ID}
      disableEscapeKeyDown
      maxWidth={false}
      open
      slotProps={{
        backdrop: { sx: dialogBackdropSx },
        paper: { sx: dialogPaperSx },
      }}
    >
      <ModalHeader>
        <HeaderTile tone={tone}>
          <HeaderIcon tone={tone} />
        </HeaderTile>
        <HeaderText>
          <HeaderTitle id={TITLE_ID}>{HEADER_TITLES[tone]}</HeaderTitle>
          {subtitle ? <HeaderSubtitle>{subtitle}</HeaderSubtitle> : null}
        </HeaderText>
        <HeaderAside>{renderHeaderAside()}</HeaderAside>
      </ModalHeader>

      {errorMessage ? (
        <StatusNotice role='alert' tone='error'>
          {errorMessage}
        </StatusNotice>
      ) : null}
      {reconnectMessage ? (
        <StatusNotice role='status' tone='warning'>
          {reconnectMessage}
        </StatusNotice>
      ) : null}

      <ModalBody>
        <StepsColumn>
          <StepList aria-label='Этапы обновления'>
            {steps.length === 0 ? (
              <StepsPending>
                <Spinner size={14} />
                Ожидаем первый статус от installation manager…
              </StepsPending>
            ) : (
              steps.map(step => {
                const stepTone = getStepTone(step.status);

                return (
                  <StepRow key={step.id}>
                    <StepIcon>
                      <StepStatusIcon tone={stepTone} />
                    </StepIcon>
                    <StepText>
                      <StepName tone={stepTone}>{step.title}</StepName>
                      {step.detail ? (
                        <StepDetail>{step.detail}</StepDetail>
                      ) : null}
                    </StepText>
                  </StepRow>
                );
              })
            )}
          </StepList>
          {isSucceeded || isFailed ? null : (
            <StepsNote>
              Не закрывайте приложение до завершения обновления.
            </StepsNote>
          )}
        </StepsColumn>

        <LogColumn>
          <LogWrap>
            <LogScroll
              ref={logRef}
              aria-live='polite'
              role='log'
              tabIndex={0}
              onScroll={handleLogScroll}
            >
              <LogCommand>{commandLine}</LogCommand>
              {state.logs.map((line, index) => (
                <LogLine key={`${index}-${line}`} error={isErrorLogLine(line)}>
                  {line}
                </LogLine>
              ))}
            </LogScroll>

            <LogCopyButton
              disableRipple
              className={LOG_COPY_BUTTON_CLASS}
              aria-label='Скопировать лог'
              title='Скопировать лог'
              onClick={handleCopyLog}
            >
              <IconCopy size={13} stroke={1.5} />
            </LogCopyButton>

            {followLog ? null : (
              <LogJumpButton
                disableRipple
                onClick={() => {
                  setFollowLog(true);
                  scrollLogToBottom();
                }}
              >
                <IconArrowDown size={12} stroke={2} />К последним строкам
              </LogJumpButton>
            )}
          </LogWrap>
        </LogColumn>
      </ModalBody>

      <ModalEndSpacer />
    </Dialog>
  );
};
