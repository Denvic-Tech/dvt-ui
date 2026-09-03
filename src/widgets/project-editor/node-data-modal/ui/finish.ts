import type { AnyDict, StepperBeforeFinishHandler } from './types';

export const buildBeforeFinishInputValues = <T extends AnyDict>(
  localInputValues: T,
  validatedInputValues: AnyDict
): T => ({
  ...localInputValues,
  ...validatedInputValues,
});

export const canCommitStepperFinish = async <T extends AnyDict>(
  beforeFinish: StepperBeforeFinishHandler<T> | undefined,
  validatedInputValues: T
): Promise<boolean> => {
  if (!beforeFinish) {
    return true;
  }

  return (await beforeFinish(validatedInputValues)) !== false;
};
