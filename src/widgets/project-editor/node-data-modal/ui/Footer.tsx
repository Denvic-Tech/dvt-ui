import React from 'react';

import {
  FooterActions,
  FooterButton,
  FooterHint,
  FooterRoot,
} from './styles.ts';
import { UnsavedChangesIndicator } from './UnsavedChangesIndicator';

type Props = {
  hasUnsavedChanges: boolean;
  onCancel?: () => void;
  onSave: () => void;
  saveLabel?: React.ReactNode;
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
          <FooterHint>
            <b>Esc</b> — закрыть
            {showSaveShortcut && (
              <>
                <span style={{ margin: '0 8px', opacity: 0.72 }}>•</span>
                <b>Ctrl S</b> — сохранить
              </>
            )}
          </FooterHint>
        )}
        {onCancel && (
          <FooterButton
            type='button'
            tone='secondary'
            data-testid='widgets/project-editor/node-data-modal/cancel-button'
            onClick={onCancel}
          >
            Отмена
          </FooterButton>
        )}
        {children}

        <FooterButton
          type='button'
          tone='primary'
          data-testid={saveTestId}
          onClick={onSave}
          disabled={saveDisabled}
        >
          {saveLabel}
        </FooterButton>
      </FooterActions>
    </FooterRoot>
  );
};
