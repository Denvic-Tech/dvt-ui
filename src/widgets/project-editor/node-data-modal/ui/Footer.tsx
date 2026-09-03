import React from 'react';
import { Box, Button, Typography } from '@mui/material';

import { getControlRadius } from '@/shared/ui/primitives/components/theme-style-helpers';

import { FooterActions, FooterRoot } from './styles.ts';
import { UnsavedChangesIndicator } from './UnsavedChangesIndicator';

type Props = {
  hasUnsavedChanges: boolean;
  onCancel: () => void;
  onSave: () => void;
};

export const Footer: React.FC<Props> = ({
  hasUnsavedChanges,
  onCancel,
  onSave,
}) => {
  return (
    <FooterRoot>
      {hasUnsavedChanges ? <UnsavedChangesIndicator /> : null}
      <FooterActions>
        <Typography
          color='text.disabled'
          sx={{
            mr: 0.5,
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
          }}
        >
          <Box component='span' sx={{ fontWeight: 600 }}>
            Esc
          </Box>{' '}
          — закрыть
          <Box component='span' sx={{ mx: 1, opacity: 0.72 }}>
            •
          </Box>
          <Box component='span' sx={{ fontWeight: 600 }}>
            Ctrl S
          </Box>{' '}
          — сохранить
        </Typography>
        <Button
          data-testid='widgets/project-editor/node-data-modal/cancel-button'
          onClick={onCancel}
          variant='outlined'
          color='inherit'
          sx={{
            borderRadius: theme => getControlRadius(theme, 'sm'),
            color: 'text.secondary',
          }}
        >
          Отмена
        </Button>

        <Button
          data-testid='widgets/project-editor/node-data-modal/save-button'
          onClick={onSave}
          variant='contained'
          color='primary'
          disableElevation
          sx={{
            borderRadius: theme => getControlRadius(theme, 'sm'),
            fontWeight: 600,
          }}
        >
          Сохранить
        </Button>
      </FooterActions>
    </FooterRoot>
  );
};
