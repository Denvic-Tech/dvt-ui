import React from 'react';
import FormatAlignLeftTwoToneIcon from '@mui/icons-material/FormatAlignLeftTwoTone';
import { Box } from '@mui/material';

import CSVLogo from '@/shared/assets/CSV-icon.svg';
import ExcelLogo from '@/shared/assets/Excel-icon.svg';

export const getFileIconElement = (filename: string, size = 20) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const imgSx = {
    width: size,
    height: size,
    display: 'inline-block',
    flexShrink: 0,
    objectFit: 'contain' as const,
  };

  if (ext === 'xlsx' || ext === 'xls') {
    return <Box component='img' src={ExcelLogo} alt='Excel' sx={imgSx} />;
  }

  if (ext === 'csv') {
    return <Box component='img' src={CSVLogo} alt='CSV' sx={imgSx} />;
  }

  return <FormatAlignLeftTwoToneIcon fontSize='small' />;
};
