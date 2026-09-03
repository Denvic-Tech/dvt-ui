import React from 'react';
import { Box } from '@mui/material';

type StepConnectorProps = {
  isCompleted: boolean;
};

export const StepConnector: React.FC<StepConnectorProps> = ({
  isCompleted,
}) => (
  <Box
    sx={{
      width: 'clamp(28px, 8vw, 64px)',
      height: 2,
      marginLeft: 1,
      marginRight: 1,
      marginTop: '18px',
      borderRadius: 1,
      backgroundColor: isCompleted ? '#a7f3d0' : '#e5e7eb',
      transition: 'background-color 300ms ease',
      flexShrink: 0,
    }}
  />
);
