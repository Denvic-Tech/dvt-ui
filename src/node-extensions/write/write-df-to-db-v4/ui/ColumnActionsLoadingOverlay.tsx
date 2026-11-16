import React from 'react';

import type { StepLoadingConditionContext } from '@/app/providers/node-extensions';

import type { ExtensionState, WriteDataFrameToDBValues } from '../lib/helpers';

import {
  ApplyResultError,
  ApplyResultLoading,
  ApplyResultSuccess,
} from './apply-result/ApplyResultScreen';
import { APPLY_RESULT_TEXT } from './apply-result/applyResultText';

type ColumnActionsLoadingOverlayProps = {
  context: StepLoadingConditionContext<
    WriteDataFrameToDBValues,
    ExtensionState
  >;
  goToPreviousStep: () => void;
};

export const ColumnActionsLoadingOverlay: React.FC<
  ColumnActionsLoadingOverlayProps
> = ({ context, goToPreviousStep }) => {
  const applyError = context.sharedState?.applyColumnActionsError?.trim();
  const applySuccess = context.sharedState?.applyColumnActionsSuccess?.trim();

  if (applyError) {
    // Изменения применяются с шага «Настройка схемы» — он и есть предыдущий.
    return (
      <ApplyResultError
        title={APPLY_RESULT_TEXT.columnActionsFailed}
        errorMessage={applyError}
        onCheckSettings={goToPreviousStep}
      />
    );
  }

  if (applySuccess) {
    return (
      <ApplyResultSuccess
        title={APPLY_RESULT_TEXT.columnActionsDone}
        progressText={APPLY_RESULT_TEXT.goingToNextStep}
      />
    );
  }

  return (
    <ApplyResultLoading
      title={APPLY_RESULT_TEXT.columnActionsLoading}
      hint={APPLY_RESULT_TEXT.loadingHint}
    />
  );
};
