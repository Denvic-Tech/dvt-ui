import React from 'react';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import { CircularProgress } from '@mui/material';
import { ControlButton } from '@xyflow/react';

interface AutoLayoutControlButtonProps {
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}

export const AutoLayoutControlButton: React.FC<
  AutoLayoutControlButtonProps
> = ({ disabled = false, loading = false, onClick }) => (
  <ControlButton
    data-testid='features/project-editor/auto-layout/control-button'
    className='react-flow__controls-autolayout'
    type='button'
    title='Авторасстановка графа'
    aria-label='Авторасстановка графа'
    aria-busy={loading}
    disabled={disabled || loading}
    onClick={onClick}
  >
    {loading ? (
      <CircularProgress size={14} color='inherit' />
    ) : (
      <AutoFixHighRoundedIcon fontSize='small' />
    )}
  </ControlButton>
);
