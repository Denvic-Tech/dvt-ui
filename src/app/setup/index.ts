export {
  type SetupStatus,
  type SetupStep,
  type SetupStepField,
  type SetupStepSubmitRequest,
  zSetupStatus,
  zSetupStep,
  zSetupStepField,
  zSetupStepSubmitRequest,
} from '@/shared/gatewayClient';

export { setupApi, type SubmitSetupStepArgs } from './api';

export {
  setupReducer,
  fetchSetupStatus,
  submitSetupStep,
  resetSetupState,
  resetSetupMutationState,
  type RequestStatus,
  type SetupSliceState,
} from './model/slice';

export {
  selectSetupState,
  selectSetupStatus,
  selectSetupLoadStatus,
  selectSetupLoadError,
  selectSetupSubmitStatusByCodeMap,
  selectSetupSubmitErrorByCodeMap,
  selectSetupSubmitStatusByCode,
  selectSetupSubmitErrorByCode,
  selectSetupSteps,
  selectSetupIsInitialized,
  selectSetupHasResolved,
  selectSetupIsLoading,
} from './model/selectors';

export { useSetup } from './model/hook';

export {
  buildSetupPayload,
  createSetupFormValues,
  getSetupFieldDescriptors,
  validateSetupFormValues,
  type SetupFieldDescriptor,
  type SetupFormErrors,
  type SetupFormValue,
  type SetupFormValues,
} from './lib/form';
