import React, { useEffect, useState } from 'react';

import { useUiPreferences } from '@/entities/ui-preferences';
import {
  CancelButton,
  CheckboxArea,
  CheckboxBox,
  CheckboxLabel,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  IconContainer,
  StopButton,
  StyledHardStopDialog,
} from './HardStopConfirmDialog.styles';

interface HardStopConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const StopOctagonIcon = () => (
  <svg
    width='26'
    height='26'
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    aria-hidden='true'
  >
    <path
      d='M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2z'
      fill='#ef4444'
      opacity='0.1'
      stroke='#ef4444'
      strokeWidth='1.5'
    />
    <rect x='8.5' y='8.5' width='7' height='7' rx='1.2' fill='#ef4444' />
  </svg>
);

const CheckboxCheckIcon = () => (
  <svg
    width='11'
    height='8'
    viewBox='0 0 11 8'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    aria-hidden='true'
  >
    <path
      d='M1 3.5L4 6.5L10 1'
      stroke='white'
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const HardStopConfirmDialog: React.FC<HardStopConfirmDialogProps> = ({
  open,
  onConfirm,
  onCancel,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { setSkipHardStopConfirm } = useUiPreferences();

  useEffect(() => {
    if (open) {
      setDontShowAgain(false);
    }
  }, [open]);

  const handleConfirm = () => {
    if (dontShowAgain) {
      setSkipHardStopConfirm(true);
    }
    onConfirm();
  };

  return (
    <StyledHardStopDialog open={open} onClose={onCancel}>
      <DialogContent>
        <IconContainer>
          <StopOctagonIcon />
        </IconContainer>

        <DialogTitle>Остановить выполнение?</DialogTitle>

        <DialogDescription>
          Это <strong>жёсткая остановка</strong>. Все текущие операции будут
          немедленно прерваны — незавершённые процессы могут оборваться с
          потерей промежуточных результатов.
        </DialogDescription>
      </DialogContent>

      <CheckboxArea>
        <CheckboxLabel>
          <input
            type='checkbox'
            checked={dontShowAgain}
            onChange={event => setDontShowAgain(event.target.checked)}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
          />
          <CheckboxBox checked={dontShowAgain}>
            {dontShowAgain ? <CheckboxCheckIcon /> : null}
          </CheckboxBox>
          Больше не спрашивать
        </CheckboxLabel>
      </CheckboxArea>

      <DialogFooter>
        <CancelButton type='button' onClick={onCancel}>
          Отмена
        </CancelButton>
        <StopButton type='button' onClick={handleConfirm}>
          Остановить
        </StopButton>
      </DialogFooter>
    </StyledHardStopDialog>
  );
};
