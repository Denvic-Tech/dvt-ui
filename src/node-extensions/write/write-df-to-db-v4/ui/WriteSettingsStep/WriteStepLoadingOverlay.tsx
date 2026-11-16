import React from 'react';

import type { StepLoadingConditionContext } from '@/app/providers/node-extensions';

import {
  dismissCreateTableError,
  type ExtensionState,
  type WriteDataFrameToDBValues,
} from '../../lib/helpers';
import {
  ApplyResultError,
  ApplyResultLoading,
  ApplyResultSuccess,
} from '../apply-result/ApplyResultScreen';
import { APPLY_RESULT_TEXT } from '../apply-result/applyResultText';

type WriteStepLoadingOverlayProps = {
  context: StepLoadingConditionContext<
    WriteDataFrameToDBValues,
    ExtensionState
  >;
  goToPreviousStep: () => void;
};

export const WriteStepLoadingOverlay: React.FC<
  WriteStepLoadingOverlayProps
> = ({ context }) => {
  const { setSharedState } = context;
  const createTableError = context.sharedState?.createTableError?.trim();
  const createTableSuccess = context.sharedState?.createTableSuccess?.trim();

  // Возврат к форме этого шага — так же, как «Назад» в футере.
  const handleCheckSettings = React.useCallback(() => {
    dismissCreateTableError({ setSharedState });
  }, [setSharedState]);

  if (createTableError) {
    return (
      <ApplyResultError
        title={APPLY_RESULT_TEXT.createTableFailed}
        errorMessage={createTableError}
        onCheckSettings={handleCheckSettings}
      />
    );
  }

  if (createTableSuccess) {
    return (
      <ApplyResultSuccess
        title={APPLY_RESULT_TEXT.createTableDone}
        progressText={APPLY_RESULT_TEXT.savingSettings}
      />
    );
  }

  return (
    <ApplyResultLoading
      title={APPLY_RESULT_TEXT.createTableLoading}
      hint={APPLY_RESULT_TEXT.loadingHint}
    />
  );
};
