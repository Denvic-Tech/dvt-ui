import { Box, styled } from '@mui/material';

import type { ColumnBaseType } from './columnSelectUtils';

export const ColumnTypeBadge = styled(Box, {
  shouldForwardProp: prop => prop !== 'colorType',
})<{ colorType?: ColumnBaseType }>(({ theme, colorType }) => {
  const getColors = () => {
    switch (colorType) {
      case 'DATETIME':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
      case 'STRING':
        return { bg: '#F3F4F6', text: '#6B7280' };
      case 'FLOAT':
        return { bg: '#E0F2FE', text: '#0369A1' };
      case 'INT':
        return { bg: '#DBEAFE', text: '#1D4ED8' };
      case 'BOOLEAN':
        return { bg: '#EDE9FE', text: '#6D28D9' };
      default:
        return {
          bg: theme.palette.grey[100],
          text: theme.palette.grey[700],
        };
    }
  };

  const colors = getColors();

  return {
    padding: '1px 6px',
    borderRadius: 3,
    backgroundColor: colors.bg,
    color: colors.text,
    border: 'none',
    fontSize: '0.625rem',
    fontWeight: 600,
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    lineHeight: 1.4,
    flexShrink: 0,
  };
});
