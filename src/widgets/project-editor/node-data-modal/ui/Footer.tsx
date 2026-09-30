import React from 'react';
import { Box, Button, Typography } from '@mui/material';

import { getControlRadius } from '@/shared/ui/primitives/components/theme-style-helpers';

import { FooterActions, FooterRoot } from './styles.ts';
import { UnsavedChangesIndicator } from './UnsavedChangesIndicator';

type Props = {
  hasUnsavedChanges: boolean;
  onCancel?: () => void;
  onSave: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  saveTestId?: string;
  showSaveShortcut?: boolean;
  children?: React.ReactNode;
  progress?: React.ReactNode;
};

export const Footer: React.FC<Props> = ({
  hasUnsavedChanges,
  onCancel,
  onSave,
  saveLabel = 'Сохранить',
  saveDisabled = false,
  saveTestId = 'widgets/project-editor/node-data-modal/save-button',
  showSaveShortcut = true,
  children,
  progress,
}) => {
  return (
    <FooterRoot>
      {hasUnsavedChanges ? <UnsavedChangesIndicator /> : null}
      <FooterActions>
        {progress ?? (
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
            {showSaveShortcut && (
              <>
                <Box component='span' sx={{ mx: 1, opacity: 0.72 }}>
                  •
                </Box>
                <Box component='span' sx={{ fontWeight: 600 }}>
                  Ctrl S
                </Box>{' '}
                — сохранить
              </>
            )}
          </Typography>
        )}
        {onCancel && (
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
        )}
        {children}

        <Button
          data-testid={saveTestId}
          onClick={onSave}
          disabled={saveDisabled}
          variant='contained'
          color='primary'
          disableElevation
          sx={{
            borderRadius: theme => getControlRadius(theme, 'sm'),
            fontWeight: 600,
          }}
        >
          {saveLabel}
        </Button>
      </FooterActions>
    </FooterRoot>
  );
};
