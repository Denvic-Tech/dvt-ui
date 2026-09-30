import React, { useState } from 'react';
import { Box } from '@mui/material';
import { keyframes, styled } from '@mui/material/styles';

export type StepVisualState = 'done' | 'active' | 'future';

type Props = {
  steps: readonly { id?: string; label?: string }[];
  activeStep: number;
  navigationDisabled: boolean;
  getStepState: (index: number) => StepVisualState;
  onStepClick: (index: number) => void;
};

const labelEnter = keyframes({
  from: { opacity: 0, transform: 'translateY(-4px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

const ProgressRoot = styled('div')({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  gap: 10,
  overflow: 'visible',
  '--stepper-accent': '#6c63ff',
  '--stepper-text-2': '#6b6b76',
  '--stepper-text-3': '#9b9ba6',
  '--stepper-text-4': '#c0c0c8',
  '--stepper-border-strong': '#d4d4dc',
  '--stepper-mono': 'ui-monospace, Consolas, monospace',
});

const StepLabel = styled('span')({
  whiteSpace: 'nowrap',
  color: 'var(--stepper-text-2)',
  fontSize: 12.5,
  fontWeight: 600,
  animation: `${labelEnter} 0.2s ease both`,
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
});

const StepTrigger = styled('button', {
  shouldForwardProp: prop => prop !== 'clickable',
})<{ clickable: boolean }>(({ clickable }) => ({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  height: 22,
  padding: '0 3px',
  border: 0,
  borderRadius: 4,
  background: 'transparent',
  fontFamily: 'inherit',
  cursor: clickable ? 'pointer' : 'default',
  overflow: 'visible',
  '&:focus-visible': {
    outline: '2px solid var(--stepper-accent)',
    outlineOffset: 2,
  },
}));

const StepDot = styled('span', {
  shouldForwardProp: prop => prop !== 'state' && prop !== 'highlighted',
})<{ state: StepVisualState; highlighted: boolean }>(
  ({ state, highlighted }) => ({
    display: 'block',
    flexShrink: 0,
    width: state === 'active' ? 18 : highlighted ? 10 : 6,
    height: state === 'active' ? 6 : highlighted ? 8 : 6,
    borderRadius: 999,
    backgroundColor:
      state === 'active'
        ? 'var(--stepper-accent)'
        : state === 'done'
          ? highlighted
            ? 'var(--stepper-text-3)'
            : 'var(--stepper-text-4)'
          : highlighted
            ? 'var(--stepper-text-4)'
            : 'var(--stepper-border-strong)',
    transition: 'all .2s cubic-bezier(.3,.9,.4,1.3)',
    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
  })
);

const StepTooltip = styled('span', {
  shouldForwardProp: prop => prop !== 'visible',
})<{ visible: boolean }>(({ visible }) => ({
  position: 'absolute',
  bottom: 'calc(100% + 6px)',
  left: '50%',
  zIndex: 1,
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
  padding: '5px 9px',
  borderRadius: 7,
  backgroundColor: '#1f2030',
  color: '#fff',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 1.4,
  boxShadow: '0 6px 18px -6px rgba(20,22,34,.45)',
  opacity: visible ? 1 : 0,
  transform: visible
    ? 'translateX(-50%) translateY(0) scale(1)'
    : 'translateX(-50%) translateY(4px) scale(.96)',
  transformOrigin: 'center bottom',
  transition: 'opacity .14s, transform .18s cubic-bezier(.2,.9,.3,1.2)',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    borderTop: '4px solid #1f2030',
    borderLeft: '4px solid transparent',
    borderRight: '4px solid transparent',
  },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
}));

export const FooterStepProgress: React.FC<Props> = ({
  steps,
  activeStep,
  navigationDisabled,
  getStepState,
  onStepClick,
}) => {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [focusedStep, setFocusedStep] = useState<number | null>(null);
  const highlightedStep = hoveredStep ?? focusedStep;

  return (
    <ProgressRoot>
      <Box
        aria-live='polite'
        aria-atomic
        sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <Box
          component='span'
          sx={{
            fontFamily: 'var(--stepper-mono)',
            fontSize: 11,
            color: 'var(--stepper-text-4)',
          }}
        >
          {activeStep + 1}/{steps.length}
        </Box>
        <StepLabel key={activeStep}>
          {steps[activeStep]?.label ?? `Шаг ${activeStep + 1}`}
        </StepLabel>
      </Box>
      <Box
        component='nav'
        aria-label='Шаги настройки'
        onMouseLeave={() => setHoveredStep(null)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          height: 22,
          flexShrink: 0,
          overflow: 'visible',
        }}
      >
        {steps.map((step, index) => {
          const state = getStepState(index);
          const clickable = index < activeStep && !navigationDisabled;
          const label = step.label ?? `Шаг ${index + 1}`;
          const highlighted = highlightedStep === index;
          const suffix =
            state === 'active' ? ' · текущий' : clickable ? ' · перейти' : '';

          return (
            <StepTrigger
              key={step.id ?? index}
              type='button'
              clickable={clickable}
              tabIndex={clickable ? 0 : -1}
              aria-label={`${index + 1}. ${label}${suffix}`}
              aria-current={state === 'active' ? 'step' : undefined}
              aria-disabled={!clickable}
              onMouseEnter={() => setHoveredStep(index)}
              onFocus={event => {
                if (event.currentTarget.matches(':focus-visible')) {
                  setFocusedStep(index);
                }
              }}
              onBlur={() => setFocusedStep(null)}
              onClick={clickable ? () => onStepClick(index) : undefined}
            >
              <StepDot state={state} highlighted={highlighted} aria-hidden />
              <StepTooltip visible={highlighted} aria-hidden>
                <Box
                  component='span'
                  sx={{
                    mr: 0.75,
                    fontFamily: 'var(--stepper-mono)',
                    color: '#a3a3b5',
                  }}
                >
                  {index + 1}
                </Box>
                {label}
                {suffix}
              </StepTooltip>
            </StepTrigger>
          );
        })}
      </Box>
    </ProgressRoot>
  );
};
