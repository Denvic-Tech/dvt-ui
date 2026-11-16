import { useCallback, useEffect, useRef, useState } from 'react';

import { CheckIcon, CopyIcon } from '@/shared/ui/clean-minimal/icons';

import {
  ErrorBoxWrap,
  ErrorCopyButton,
  ErrorText,
  LoadingRing,
  ResultIcon,
  ResultLink,
  ResultProgress,
  ResultRoot,
  ResultSubtitle,
  ResultTitle,
  SuccessSpinner,
} from './ApplyResultScreen.styles';
import { APPLY_RESULT_TEXT } from './applyResultText';

const COPY_FEEDBACK_MS = 1500;

const ErrorOutlineIcon = () => (
  <svg
    width={24}
    height={24}
    viewBox='0 0 16 16'
    fill='none'
    stroke='currentColor'
    strokeWidth={1.6}
    strokeLinecap='round'
    aria-hidden='true'
  >
    <circle cx='8' cy='8' r='6.2' />
    <path d='M8 4.8v3.8' />
    <circle cx='8' cy='11.2' r='.5' fill='currentColor' />
  </svg>
);

type ApplyResultErrorProps = {
  title: string;
  /** Ответ сервера — показывается и копируется как есть. */
  errorMessage: string;
  /** Возврат к шагу, с которого запускалось применение. */
  onCheckSettings: () => void;
};

/** Экран ошибки применения (макет WdbResA, state = Ошибка). */
export const ApplyResultError = ({
  title,
  errorMessage,
  onCheckSettings,
}: ApplyResultErrorProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    },
    []
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(errorMessage);
    } catch {
      return;
    }
    setIsCopied(true);
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      setIsCopied(false);
      copyTimerRef.current = null;
    }, COPY_FEEDBACK_MS);
  }, [errorMessage]);

  const copyLabel = isCopied
    ? APPLY_RESULT_TEXT.copied
    : APPLY_RESULT_TEXT.copy;

  return (
    <ResultRoot>
      <ResultIcon tone='error'>
        <ErrorOutlineIcon />
      </ResultIcon>
      <ResultTitle>{title}</ResultTitle>
      <ResultSubtitle>
        <ResultLink type='button' onClick={onCheckSettings}>
          {APPLY_RESULT_TEXT.checkSettings}
        </ResultLink>{' '}
        {APPLY_RESULT_TEXT.tryAgain}
      </ResultSubtitle>
      <ErrorBoxWrap>
        <ErrorText>{errorMessage}</ErrorText>
        <ErrorCopyButton
          type='button'
          aria-label={copyLabel}
          title={copyLabel}
          onClick={() => void handleCopy()}
        >
          {isCopied ? (
            <CheckIcon size={14} strokeWidth={1.8} />
          ) : (
            <CopyIcon size={14} />
          )}
        </ErrorCopyButton>
      </ErrorBoxWrap>
    </ResultRoot>
  );
};

type ApplyResultLoadingProps = {
  title: string;
  hint: string;
};

/**
 * Ожидание результата (макет WdbResA, state = Загрузка). Раскладка и высоты
 * как у экрана успеха: кольцо 24px вместо иконки, подстрока в одну строку
 * 20px, — поэтому при смене состояния иконка и заголовок не сдвигаются.
 */
export const ApplyResultLoading = ({
  title,
  hint,
}: ApplyResultLoadingProps) => (
  <ResultRoot role='status'>
    <ResultIcon tone='loading'>
      <LoadingRing aria-hidden='true' />
    </ResultIcon>
    <ResultTitle>{title}</ResultTitle>
    <ResultProgress>{hint}</ResultProgress>
  </ResultRoot>
);

type ApplyResultSuccessProps = {
  title: string;
  /** Строка под заголовком, пока идёт автопереход. */
  progressText: string;
};

/** Экран успеха применения (макет WdbResA, state = Успех). */
export const ApplyResultSuccess = ({
  title,
  progressText,
}: ApplyResultSuccessProps) => (
  <ResultRoot role='status'>
    <ResultIcon tone='success'>
      <CheckIcon size={24} strokeWidth={1.8} />
    </ResultIcon>
    <ResultTitle>{title}</ResultTitle>
    <ResultProgress>
      <SuccessSpinner size={12} aria-hidden='true' />
      {progressText}
    </ResultProgress>
  </ResultRoot>
);
