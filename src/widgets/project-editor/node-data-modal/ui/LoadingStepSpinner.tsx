import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Check } from '@mui/icons-material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

type StepStatus = 'completed' | 'active' | 'pending' | 'error';
type StepIconValue = React.ReactNode | React.ElementType;

type StepCircleProps = {
  stepIndex: number;
  isActive: boolean;
  isCompleted: boolean;
  isError?: boolean;
  label?: string;
  activeIcon?: StepIconValue | undefined;
  completedIcon?: StepIconValue | undefined;
  errorIcon?: StepIconValue | undefined;
  onClick?: (() => void) | undefined;
  disabled?: boolean;
};

const StepItem = styled('button')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 7,
  background: 'none',
  border: 'none',
  padding: 0,
  fontFamily: 'inherit',
  cursor: 'pointer',
  '&:focus': {
    outline: 'none',
  },
  '&:focus-visible': {
    outline: '2px solid #6366f1',
    outlineOffset: 4,
    borderRadius: 8,
  },
  '&:disabled': {
    cursor: 'default',
    opacity: 1,
  },
  '&:not(:disabled):hover .step-icon-container[data-hoverable="true"]': {
    transform: 'scale(1.05)',
  },
});

const StepIconContainer = styled(Box, {
  shouldForwardProp: prop => prop !== 'status',
})<{ status: StepStatus }>(({ status }) => {
  const styles = {
    completed: {
      backgroundColor: '#d1fae5',
      color: '#059669',
    },
    active: {
      backgroundColor: '#e0e7ff',
      color: '#6366f1',
    },
    pending: {
      backgroundColor: '#f3f4f6',
      color: '#9ca3af',
    },
    error: {
      backgroundColor: '#fee2e2',
      color: '#dc2626',
    },
  };

  return {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 200ms ease',
    ...styles[status],
    '& .MuiSvgIcon-root': {
      fontSize: 19,
    },
    '& .step-icon-emoji': {
      fontSize: 17,
      lineHeight: 1,
    },
  };
});

const StepLabel = styled(Typography, {
  shouldForwardProp: prop => prop !== 'status',
})<{ status: StepStatus }>(({ status }) => {
  const colors = {
    completed: '#059669',
    active: '#6366f1',
    pending: '#9ca3af',
    error: '#dc2626',
  };

  return {
    fontSize: 11,
    fontWeight: 500,
    color: colors[status],
    transition: 'color 200ms ease',
    whiteSpace: 'nowrap',
    textAlign: 'center',
    lineHeight: 1.2,
    maxWidth: 120,
  };
});

const renderIconValue = (icon: StepIconValue | undefined): React.ReactNode => {
  if (icon === undefined || icon === null) {
    return null;
  }
  if (React.isValidElement(icon)) {
    return icon;
  }
  if (typeof icon === 'string' || typeof icon === 'number') {
    return <span className='step-icon-emoji'>{icon}</span>;
  }
  if (typeof icon === 'function' || typeof icon === 'object') {
    try {
      return React.createElement(icon as React.ElementType);
    } catch {
      return null;
    }
  }
  return null;
};

const getStepStatus = (
  isCompleted: boolean,
  isActive: boolean,
  isError?: boolean
): StepStatus => {
  if (isError) {
    return 'error';
  }
  if (isCompleted) {
    return 'completed';
  }
  if (isActive) {
    return 'active';
  }
  return 'pending';
};

export const LoadingStepSpinner: React.FC<StepCircleProps> = ({
  stepIndex,
  isActive,
  isCompleted,
  isError = false,
  label,
  activeIcon,
  completedIcon,
  errorIcon,
  onClick,
  disabled = false,
}) => {
  const status = getStepStatus(isCompleted, isActive, isError);
  const icon = isError
    ? (renderIconValue(errorIcon) ?? <ErrorOutlineIcon />)
    : isCompleted
      ? (renderIconValue(completedIcon) ?? <Check />)
      : (renderIconValue(activeIcon) ?? stepIndex + 1);

  const handleClick = () => {
    if (disabled || !onClick) {
      return;
    }
    onClick();
  };

  return (
    <StepItem onClick={handleClick} type='button' disabled={disabled}>
      <StepIconContainer
        className='step-icon-container'
        status={status}
        data-hoverable={status !== 'pending'}
      >
        {icon}
      </StepIconContainer>
      {label && <StepLabel status={status}>{label}</StepLabel>}
    </StepItem>
  );
};
