import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { Box, Button, Portal } from '@mui/material';

import {
  NodeModalStepperExtension,
  NodeModalStepperExtensionProps,
  StepBeforeFinishContext,
  StepLoadingConditionContext,
  StepOnContinueContext,
} from '@/app/providers/node-extensions';

import { StepLoadingOverlay } from '@/widgets/project-editor/node-data-modal/ui/LoadingStepOverlay';

import { useNodeMetadata } from '@/features/node/get-node-metadata';

import type { NodeInputValue } from '@/shared/gatewayClient';
import type { NodeInputValuesMap } from '@/shared/lib/node-input-values';
import { getControlRadius } from '@/shared/ui/primitives/components/theme-style-helpers';

import { Footer } from './Footer';
import { FooterStepProgress, type StepVisualState } from './FooterStepProgress';
import { AnyDict, StepperBeforeFinishHandler } from './types';

type ModalStepperRendererProps = Omit<
  NodeModalStepperExtensionProps<AnyDict, any>,
  'sharedState' | 'setSharedState'
> & {
  extension: NodeModalStepperExtension<any>;
  hasUnsavedChanges?: boolean;
  footerContainer?: HTMLDivElement | null;
  onCancel?: () => void;
  onFinish: (
    beforeFinish?: StepperBeforeFinishHandler<AnyDict>
  ) => void | Promise<void>;
};

export const NodeModalStepperRenderer: React.FC<ModalStepperRendererProps> = ({
  extension,
  hasUnsavedChanges = false,
  footerContainer,
  onCancel,
  onFinish,
  ...props
}) => {
  const { steps } = extension;
  const [activeStep, setActiveStep] = useState(0);
  const [isStepLoading, setIsStepLoading] = useState(false);
  const [canProceedState, setCanProceedState] = useState(false);
  // Track when we just transitioned to force fresh loading check
  const [justTransitioned, setJustTransitioned] = useState(false);
  const [isFinishingStep, setIsFinishingStep] = useState(false);

  // Shared local state available across all stepper steps
  const [sharedState, setSharedState] = useState<any>(undefined);

  // Noop functions for when callbacks are not provided
  const noopUpdateInputValue = useCallback(
    (_inputName: string, _value: NodeInputValue) => {},
    []
  );
  const noopUpdateInputValues = useCallback(
    (_inputValues: NodeInputValuesMap) => {},
    []
  );

  const updateInputValue = props.updateInputValue ?? noopUpdateInputValue;
  const updateInputValues = props.updateInputValues ?? noopUpdateInputValues;

  // Get node metadata actuality using the hook
  const { nodeMetadataActuality } = useNodeMetadata(props.id);

  // Track if modal was just opened to trigger initial validation
  const wasOpenRef = React.useRef(false);

  // Reset step when modal opens or node changes
  useLayoutEffect(() => {
    if (!props.isOpen) {
      wasOpenRef.current = false;
      return;
    }

    // Only reset if modal just opened (not on every localInputData change)
    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      setActiveStep(0);
      setIsStepLoading(false);
      setJustTransitioned(false);
      setSharedState(undefined);
    }
  }, [extension.id, props.id, props.isOpen]);

  // Check condition for initial state when modal opens
  useEffect(() => {
    if (!props.isOpen) return;

    // Only run initial validation on first render after modal opens
    const step = steps[0];
    if (step?.condition) {
      void Promise.resolve(
        step.condition(props.localInputData, sharedState, setSharedState)
      ).then(result => {
        setCanProceedState(result);
      });
    } else {
      setCanProceedState(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isOpen, extension.id, props.id]);

  // Build loading condition context
  const loadingConditionContext = useMemo<
    StepLoadingConditionContext<AnyDict, any>
  >(
    () => ({
      projectID: props.projectID,
      nodeID: props.id,
      inputValues: props.localInputData,
      nodeDefinition: props.nodeDefinition,
      data: props.data,
      variables: props.variables,
      nodeMetadataActuality,
      sharedState,
      setSharedState,
      setLocalInputData: props.setLocalInputData,
    }),
    [
      props.projectID,
      props.id,
      props.localInputData,
      props.nodeDefinition,
      props.data,
      props.variables,
      nodeMetadataActuality,
      sharedState,
      setSharedState,
      props.setLocalInputData,
    ]
  );

  // Build onContinue context with update callbacks
  const onContinueContext = useMemo<StepOnContinueContext<AnyDict, any>>(
    () => ({
      nodeID: props.id,
      inputValues: props.localInputData,
      nodeDefinition: props.nodeDefinition,
      data: props.data,
      variables: props.variables,
      updateInputValue,
      updateInputValues,
      sharedState,
      setSharedState,
    }),
    [
      props.id,
      props.localInputData,
      props.nodeDefinition,
      props.data,
      props.variables,
      updateInputValue,
      updateInputValues,
      sharedState,
      setSharedState,
    ]
  );

  const buildBeforeFinishHandler = useCallback(
    (stepIndex: number): StepperBeforeFinishHandler<AnyDict> | undefined => {
      const step = steps[stepIndex];
      if (!step?.onBeforeFinish) {
        return undefined;
      }

      return async validatedInputValues => {
        const result = await step.onBeforeFinish?.({
          nodeID: props.id,
          inputValues: validatedInputValues,
          nodeDefinition: props.nodeDefinition,
          data: props.data,
          variables: props.variables,
          sharedState,
          setSharedState,
        } satisfies StepBeforeFinishContext<AnyDict, any>);

        return result;
      };
    },
    [
      props.data,
      props.id,
      props.nodeDefinition,
      props.variables,
      sharedState,
      steps,
    ]
  );

  // Track previous step to detect step changes
  const prevStepRef = React.useRef<number | null>(null);

  // Call onEnter when step changes
  useEffect(() => {
    const step = steps[activeStep];

    // Only call onEnter if step actually changed (not on initial render for step 0)
    if (prevStepRef.current !== null && prevStepRef.current !== activeStep) {
      if (step?.onEnter) {
        void step.onEnter(loadingConditionContext);
      }
    }

    prevStepRef.current = activeStep;
  }, [activeStep, loadingConditionContext, steps]);

  // Check loading condition for current step
  useEffect(() => {
    const step = steps[activeStep];
    if (!step?.loadingCondition) {
      setIsStepLoading(false);
      setJustTransitioned(false);
      return;
    }
    if (
      step.shouldShowLoadingOverlay &&
      !step.shouldShowLoadingOverlay(loadingConditionContext)
    ) {
      setIsStepLoading(false);
      setJustTransitioned(false);
      return;
    }

    let cancelled = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const checkLoadingCondition = async () => {
      // Always show loading when we just transitioned to this step
      // This ensures we don't show stale data
      setIsStepLoading(true);

      // If we just transitioned, wait a bit before checking to allow state to propagate
      if (justTransitioned) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (cancelled) return;
      }

      try {
        const isReady = await step.loadingCondition!(loadingConditionContext);
        if (!cancelled) {
          // Only stop loading if ready AND not just transitioned
          // (or if we've already waited)
          setIsStepLoading(!isReady);
          setJustTransitioned(false);

          // If not ready, poll for updates
          if (!isReady && !pollInterval) {
            pollInterval = setInterval(async () => {
              if (cancelled) return;
              try {
                const ready = await step.loadingCondition!(
                  loadingConditionContext
                );
                if (!cancelled && ready) {
                  setIsStepLoading(false);
                  if (pollInterval) {
                    clearInterval(pollInterval);
                    pollInterval = null;
                  }
                }
              } catch {
                // Ignore polling errors
              }
            }, 1000);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setIsStepLoading(false);
          setJustTransitioned(false);
        }
      }
    };

    void checkLoadingCondition();

    return () => {
      cancelled = true;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [activeStep, loadingConditionContext, steps, justTransitioned]);

  // Check condition for current step and update canProceedState
  useEffect(() => {
    const step = steps[activeStep];

    const checkCondition = async () => {
      if (!step?.condition) {
        setCanProceedState(true);
        return;
      }
      try {
        const result = await step.condition(
          props.localInputData,
          sharedState,
          setSharedState
        );
        setCanProceedState(result);
      } catch {
        setCanProceedState(false);
      }
    };

    void checkCondition();
  }, [activeStep, props.localInputData, steps, sharedState]);

  const handleNext = useCallback(async () => {
    if (!canProceedState || isFinishingStep) {
      return;
    }

    const step = steps[activeStep];

    // Call onContinue callback before transitioning
    if (step?.onContinue) {
      try {
        const shouldContinue = await step.onContinue(onContinueContext);
        if (shouldContinue === false) {
          return;
        }
      } catch (error) {
        console.error('[StepperModal] onContinue callback failed:', error);
        return;
      }
    }

    if (activeStep < steps.length - 1) {
      // Mark that we just transitioned to force fresh loading check
      setJustTransitioned(true);
      setActiveStep(prev => prev + 1);
      return;
    }

    const beforeFinish = buildBeforeFinishHandler(activeStep);
    const shouldGuardFinish = Boolean(beforeFinish);

    if (shouldGuardFinish) {
      setIsFinishingStep(true);
    }

    try {
      await onFinish(beforeFinish);
    } finally {
      if (shouldGuardFinish) {
        setIsFinishingStep(false);
      }
    }
  }, [
    activeStep,
    buildBeforeFinishHandler,
    canProceedState,
    isFinishingStep,
    onContinueContext,
    onFinish,
    steps,
  ]);

  const handleBack = useCallback(() => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  }, []);

  const handleGoToPreviousStepFromLoading = useCallback(() => {
    setIsStepLoading(false);
    setJustTransitioned(false);
    setActiveStep(prev => Math.max(prev - 1, 0));
  }, []);

  const handleStepClick = useCallback(
    (stepIndex: number) => {
      // Only allow navigating to completed (previous) steps
      if (stepIndex < activeStep) {
        setActiveStep(stepIndex);
      }
    },
    [activeStep]
  );

  const isLastStep = activeStep === steps.length - 1;
  const activeStepConfig = steps[activeStep];
  const continueButtonLabel = isLastStep
    ? 'Сохранить'
    : (activeStepConfig?.getContinueLabel?.(
        props.localInputData,
        sharedState
      ) ?? 'Продолжить →');
  const ActiveStepComponent = activeStepConfig?.component;
  const ActiveLoadingOverlay = activeStepConfig?.loadingOverlay;
  const ActiveFinishOverlay = activeStepConfig?.finishOverlay;
  const isFinishOverlayVisible = Boolean(
    ActiveFinishOverlay &&
    (activeStepConfig?.shouldShowFinishOverlay?.(
      loadingConditionContext,
      isFinishingStep
    ) ??
      isFinishingStep)
  );
  const hasCreateTableError =
    Boolean(sharedState?.isTableNew) && Boolean(sharedState?.createTableError);

  const getStepState = useCallback(
    (stepIndex: number): StepVisualState => {
      const isPrepareStepWithCreateError =
        steps[stepIndex]?.id === 'target-setup' &&
        stepIndex < activeStep &&
        hasCreateTableError;

      if (isPrepareStepWithCreateError) {
        return 'future';
      }
      if (stepIndex < activeStep) {
        return 'done';
      }
      if (stepIndex === activeStep) {
        return 'active';
      }
      return 'future';
    },
    [activeStep, hasCreateTableError, steps]
  );

  if (steps.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      {/* Step content */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          pt: activeStep <= 3 ? 0 : 2,
          px: activeStep <= 3 ? 0 : 2,
          pb: activeStep <= 3 ? 0 : 2,
        }}
      >
        {isFinishOverlayVisible && ActiveFinishOverlay ? (
          <ActiveFinishOverlay
            context={loadingConditionContext}
            goToPreviousStep={handleGoToPreviousStepFromLoading}
          />
        ) : isStepLoading ? (
          ActiveLoadingOverlay ? (
            <ActiveLoadingOverlay
              context={loadingConditionContext}
              goToPreviousStep={handleGoToPreviousStepFromLoading}
            />
          ) : (
            <StepLoadingOverlay />
          )
        ) : (
          ActiveStepComponent && (
            <ActiveStepComponent
              key={steps[activeStep]?.id ?? activeStep}
              {...props}
              sharedState={sharedState}
              setSharedState={setSharedState}
            />
          )
        )}
      </Box>

      <Portal
        container={footerContainer ?? null}
        disablePortal={!footerContainer}
      >
        <Footer
          hasUnsavedChanges={hasUnsavedChanges}
          {...(onCancel ? { onCancel } : {})}
          onSave={handleNext}
          saveLabel={continueButtonLabel}
          saveDisabled={
            isStepLoading ||
            isFinishingStep ||
            isFinishOverlayVisible ||
            !canProceedState
          }
          saveTestId={
            isLastStep
              ? 'widgets/project-editor/node-data-modal/save-button'
              : 'widgets/project-editor/node-data-modal/continue-button'
          }
          showSaveShortcut={false}
          progress={
            <FooterStepProgress
              steps={steps}
              activeStep={activeStep}
              navigationDisabled={isFinishingStep || isFinishOverlayVisible}
              getStepState={getStepState}
              onStepClick={handleStepClick}
            />
          }
        >
          <Button
            data-testid='widgets/project-editor/node-data-modal/back-button'
            variant='outlined'
            color='inherit'
            onClick={handleBack}
            disabled={
              activeStep === 0 ||
              isStepLoading ||
              isFinishingStep ||
              isFinishOverlayVisible
            }
            sx={{
              borderRadius: theme => getControlRadius(theme, 'sm'),
              color: 'text.secondary',
            }}
          >
            ← Назад
          </Button>
        </Footer>
      </Portal>
    </Box>
  );
};
