import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import type { StepLoadingConditionContext } from '@/app/providers/node-extensions';

import type { ExtensionState, WriteDataFrameToDBValues } from '../lib/helpers';

import {
  AnimatedDot,
  AnimatedDotsContainer,
  ErrorActionButton,
  ErrorCopyButton,
  ErrorDetailsBox,
  ErrorDetailsCaption,
  ErrorDetailsContent,
  ErrorDetailsText,
  ErrorDetailsToolbar,
  ErrorDialogContainer,
  ErrorDialogContent,
  ErrorDialogFooter,
  ErrorHint,
  ErrorIconContainer,
  ErrorTitle,
  HintText,
  LoadingContainer,
  LoadingText,
  OverlayRoot,
  SpinnerIconContainer,
  SpinnerSvg,
  SuccessDialogContainer,
  SuccessIconContainer,
  SuccessSubtitle,
  SuccessTitle,
} from './WriteSettingsStep/WriteStepLoadingOverlay.styles';

type ColumnActionsLoadingOverlayProps = {
  context: StepLoadingConditionContext<
    WriteDataFrameToDBValues,
    ExtensionState
  >;
  goToPreviousStep: () => void;
};

type SuccessDialogProps = {
  title: string;
  subtitle?: string;
  hint?: string;
};

const SuccessDialog: React.FC<SuccessDialogProps> = ({
  title,
  subtitle,
  hint,
}) => {
  return (
    <SuccessDialogContainer>
      <SuccessIconContainer>
        <CheckIcon />
      </SuccessIconContainer>
      <SuccessTitle>{title}</SuccessTitle>
      {subtitle && <SuccessSubtitle>{subtitle}</SuccessSubtitle>}
      <AnimatedDotsContainer>
        <AnimatedDot delay={0} />
        <AnimatedDot delay={150} />
        <AnimatedDot delay={300} />
      </AnimatedDotsContainer>
      {hint && <HintText>{hint}</HintText>}
    </SuccessDialogContainer>
  );
};

type ErrorDialogProps = {
  title: string;
  errorMessage: string;
  hint?: string;
  actionLabel: string;
  onAction: () => void;
};

const ErrorDialog: React.FC<ErrorDialogProps> = ({
  title,
  errorMessage,
  hint,
  actionLabel,
  onAction,
}) => {
  const [isCopied, setIsCopied] = React.useState(false);
  const copyFeedbackTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(copyFeedbackTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyError = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(errorMessage);
      setIsCopied(true);

      if (copyFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(copyFeedbackTimeoutRef.current);
      }
      copyFeedbackTimeoutRef.current = window.setTimeout(() => {
        setIsCopied(false);
        copyFeedbackTimeoutRef.current = null;
      }, 1600);
    } catch {
      setIsCopied(false);
    }
  }, [errorMessage]);

  return (
    <ErrorDialogContainer>
      <ErrorDialogContent>
        <ErrorIconContainer>
          <WarningAmberIcon />
        </ErrorIconContainer>
        <ErrorTitle>{title}</ErrorTitle>
        <ErrorDetailsBox>
          <ErrorDetailsToolbar>
            <ErrorDetailsCaption>Ошибка</ErrorDetailsCaption>
            <ErrorCopyButton
              type='button'
              onClick={() => void handleCopyError()}
              aria-label='Копировать ошибку'
              title={isCopied ? 'Скопировано' : 'Копировать'}
            >
              <ContentCopyIcon
                sx={{ color: isCopied ? 'success.main' : 'inherit' }}
              />
            </ErrorCopyButton>
          </ErrorDetailsToolbar>
          <ErrorDetailsContent>
            <ErrorDetailsText>{errorMessage}</ErrorDetailsText>
          </ErrorDetailsContent>
        </ErrorDetailsBox>
        {hint && <ErrorHint>{hint}</ErrorHint>}
      </ErrorDialogContent>
      <ErrorDialogFooter>
        <ErrorActionButton type='button' onClick={onAction}>
          {actionLabel}
        </ErrorActionButton>
      </ErrorDialogFooter>
    </ErrorDialogContainer>
  );
};

const LoadingSpinner: React.FC<{ text?: string }> = ({
  text = 'Загрузка...',
}) => {
  return (
    <LoadingContainer>
      <SpinnerIconContainer>
        <SpinnerSvg viewBox='0 0 24 24' fill='none'>
          <circle
            cx='12'
            cy='12'
            r='10'
            stroke='currentColor'
            strokeWidth='3'
          />
          <path
            fill='currentColor'
            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
          />
        </SpinnerSvg>
      </SpinnerIconContainer>
      <LoadingText>{text}</LoadingText>
    </LoadingContainer>
  );
};

export const ColumnActionsLoadingOverlay: React.FC<
  ColumnActionsLoadingOverlayProps
> = ({ context, goToPreviousStep }) => {
  const applyError = context.sharedState?.applyColumnActionsError?.trim();
  const applySuccess = context.sharedState?.applyColumnActionsSuccess?.trim();

  if (applyError) {
    return (
      <OverlayRoot>
        <ErrorDialog
          title='Изменения схемы не применены'
          errorMessage={applyError}
          hint='Вернитесь к шагу «Настройка схемы», проверьте выбранные действия и повторите попытку.'
          actionLabel='Вернуться назад'
          onAction={goToPreviousStep}
        />
      </OverlayRoot>
    );
  }

  if (applySuccess) {
    return (
      <OverlayRoot>
        <SuccessDialog
          title='Изменения схемы применены'
          hint='Переход к следующему шагу...'
        />
      </OverlayRoot>
    );
  }

  return (
    <OverlayRoot>
      <LoadingSpinner text='Применение изменений схемы...' />
    </OverlayRoot>
  );
};
