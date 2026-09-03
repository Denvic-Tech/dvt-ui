import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Box, Button, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';

import {
  NodeModalStepperExtension,
  NodeModalStepperExtensionProps,
  StepBeforeFinishContext,
  StepLoadingConditionContext,
  StepOnContinueContext,
} from '@/app/providers/node-extensions';

import { StepLoadingOverlay } from '@/widgets/project-editor/node-data-modal/ui/LoadingStepOverlay';
import { UnsavedChangesIndicator } from '@/widgets/project-editor/node-data-modal/ui/UnsavedChangesIndicator';

import { useNodeMetadata } from '@/features/node/get-node-metadata';

import type { NodeInputValue } from '@/shared/gatewayClient';
import type { NodeInputValuesMap } from '@/shared/lib/node-input-values';

import { AnyDict, StepperBeforeFinishHandler } from './types';

type StepVisualState = 'done' | 'active' | 'future';

const StepperBar = styled('div')({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '1px 20px',
  overflow: 'hidden',
});

const StepTab = styled('button', {
  shouldForwardProp: prop =>
    prop !== 'state' && prop !== 'clickable' && prop !== 'hasLabel',
})<{
  state: StepVisualState;
  clickable: boolean;
  hasLabel: boolean;
}>(({ state, clickable, hasLabel }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: hasLabel ? 6 : 0,
  flexShrink: 0,
  padding: hasLabel ? '6px 10px' : '6px 6px',
  borderRadius: 8,
  border: 'none',
  background: state === 'active' ? '#eef2ff' : 'transparent',
  color:
    state === 'active' ? '#6366f1' : state === 'done' ? '#1e293b' : '#94a3b8',
  cursor: clickable ? 'pointer' : 'default',
  fontFamily: 'inherit',
  fontSize: 12.5,
  fontWeight: 600,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
  transition: 'all 150ms ease',
  outline: 'none',
  '&:hover': clickable
    ? {
        background: '#eef2ff',
      }
    : {},
  '&:focus-visible': clickable
    ? {
        boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.25)',
      }
    : {},
}));

const StepDot = styled('span', {
  shouldForwardProp: prop => prop !== 'state',
})<{ state: StepVisualState }>(({ state }) => ({
  width: 16,
  height: 16,
  borderRadius: '50%',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 10,
  fontWeight: 700,
  background:
    state === 'done' ? '#10b981' : state === 'active' ? '#6366f1' : '#e2e8f0',
  color: state === 'future' ? '#64748b' : '#ffffff',
}));

const StepSeparator = styled('span')({
  flexShrink: 0,
  fontSize: 13,
  color: '#e2e8f0',
  lineHeight: 1,
});

const HiddenMeasureLayer = styled('div')({
  position: 'absolute',
  visibility: 'hidden',
  pointerEvents: 'none',
  left: -9999,
  top: -9999,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
});

const CheckIcon = ({
  size = 10,
  color = '#ffffff',
}: {
  size?: number;
  color?: string;
}) => (
  <svg width={size} height={size} viewBox='0 0 16 16' fill='none'>
    <path
      d='M3 8.5l3.5 3.5L13 4'
      stroke={color}
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

type ModalStepperRendererProps = Omit<
  NodeModalStepperExtensionProps<AnyDict, any>,
  'sharedState' | 'setSharedState'
> & {
  extension: NodeModalStepperExtension<any>;
  hasUnsavedChanges?: boolean;
  onFinish: (
    beforeFinish?: StepperBeforeFinishHandler<AnyDict>
  ) => void | Promise<void>;
};

export const NodeModalStepperRenderer: React.FC<ModalStepperRendererProps> = ({
  extension,
  hasUnsavedChanges = false,
  onFinish,
  ...props
}) => {
  const { steps } = extension;
  const [activeStep, setActiveStep] = useState(0);
  const [isStepLoading, setIsStepLoading] = useState(false);
  const [canProceedState, setCanProceedState] = useState(false);
  // Track when we just transitioned to force fresh loading check
  const [justTransitioned, setJustTransitioned] = useState(false);
  const [isStepperCollapsed, setIsStepperCollapsed] = useState(false);
  const [isFinishingStep, setIsFinishingStep] = useState(false);
  const stepperBarRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);

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

  useLayoutEffect(() => {
    const fallbackCollapsed = steps.length > 4;

    const recompute = () => {
      if (!stepperBarRef.current || !measureRef.current) {
        setIsStepperCollapsed(fallbackCollapsed);
        return;
      }

      const availableWidth = stepperBarRef.current.clientWidth;
      const fullWidth = measureRef.current.scrollWidth;

      setIsStepperCollapsed(fullWidth > availableWidth);
    };

    recompute();

    if (typeof ResizeObserver === 'undefined') {
      setIsStepperCollapsed(fallbackCollapsed);
      return;
    }

    const resizeObserver = new ResizeObserver(recompute);
    if (stepperBarRef.current) {
      resizeObserver.observe(stepperBarRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [steps]);

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

  const shouldShowStepLabel = useCallback(
    (stepIndex: number) =>
      !isStepperCollapsed ||
      stepIndex === activeStep ||
      stepIndex === activeStep - 1,
    [activeStep, isStepperCollapsed]
  );

  const renderStepTab = useCallback(
    (
      step: (typeof steps)[number],
      index: number,
      withLabel: boolean,
      key: string,
      isMeasurement = false
    ) => {
      const state = getStepState(index);
      const clickable =
        index < activeStep && !isFinishingStep && !isFinishOverlayVisible;
      const label = step.label ?? `Шаг ${index + 1}`;

      return (
        <React.Fragment key={key}>
          {index > 0 && <StepSeparator>›</StepSeparator>}
          <StepTab
            type='button'
            state={state}
            clickable={clickable}
            hasLabel={withLabel}
            title={withLabel ? undefined : label}
            onClick={
              !isMeasurement && clickable
                ? () => handleStepClick(index)
                : undefined
            }
            aria-current={state === 'active' ? 'step' : undefined}
            tabIndex={isMeasurement ? -1 : undefined}
          >
            <StepDot state={state}>
              {state === 'done' ? <CheckIcon size={10} /> : index + 1}
            </StepDot>
            {withLabel ? label : null}
          </StepTab>
        </React.Fragment>
      );
    },
    [
      activeStep,
      getStepState,
      handleStepClick,
      isFinishOverlayVisible,
      isFinishingStep,
    ]
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
      }}
    >
      <StepperBar ref={stepperBarRef}>
        {steps.map((step, index) =>
          renderStepTab(
            step,
            index,
            shouldShowStepLabel(index),
            step.id ?? `step-${index}`
          )
        )}

        <HiddenMeasureLayer ref={measureRef} aria-hidden>
          {steps.map((step, index) =>
            renderStepTab(
              step,
              index,
              true,
              `measure-${step.id ?? index}`,
              true
            )
          )}
        </HiddenMeasureLayer>
      </StepperBar>

      {/* Step content */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
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

      {/* Navigation footer */}
      <Box
        sx={theme => ({
          height: 66,
          px: 3,
          py: 0,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          '& > *': {
            width: '100%',
          },
        })}
      >
        <Stack direction='row' spacing={2} justifyContent='space-between'>
          <Stack direction='row' spacing={2} alignItems='center'>
            {hasUnsavedChanges ? <UnsavedChangesIndicator /> : null}
            <Button
              data-testid='widgets/project-editor/node-data-modal/back-button'
              variant='text'
              onClick={handleBack}
              disabled={
                activeStep === 0 ||
                isStepLoading ||
                isFinishingStep ||
                isFinishOverlayVisible
              }
            >
              ← Назад
            </Button>
          </Stack>
          <Stack direction='row' spacing={1.5} alignItems='center'>
            <Button
              data-testid={
                isLastStep
                  ? 'widgets/project-editor/node-data-modal/save-button'
                  : 'widgets/project-editor/node-data-modal/continue-button'
              }
              variant='contained'
              onClick={handleNext}
              disabled={
                isStepLoading ||
                isFinishingStep ||
                isFinishOverlayVisible ||
                !canProceedState
              }
            >
              {continueButtonLabel}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};
