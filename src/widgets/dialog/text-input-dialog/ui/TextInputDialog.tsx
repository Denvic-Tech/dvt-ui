import React, { useEffect, useState } from 'react';
import {
  CancelButton,
  ConfirmButton,
  HeaderContent,
  HeaderDescription,
  HeaderIcon,
  HeaderTitle,
  InputField,
  ModalContent,
  ModalFooter,
  ModalHeader,
  StyledDialog,
} from './TextInputDialog.styles.ts';

interface TextInputDialogProps {
  open: boolean;
  title?: string;
  label?: string;
  initialValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  maxWidth?: 'xs' | 'sm' | 'md';
  onClose: () => void;
  onConfirm: (value: string) => void | Promise<void>;
}

const getDescription = (title: string, label: string) => {
  if (title.toLowerCase().includes('переимен')) {
    return 'Измените название проекта. Новое имя будет использоваться в списке проектов.';
  }

  return `Укажите значение в поле «${label}».`;
};

export const TextInputDialog: React.FC<TextInputDialogProps> = ({
  open,
  title = 'Введите значение',
  label = 'Значение',
  initialValue = '',
  confirmLabel = 'Сохранить',
  cancelLabel = 'Отмена',
  maxWidth = 'xs',
  onClose,
  onConfirm,
}) => {
  const [value, setValue] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
      setSubmitting(false);
    }
  }, [open, initialValue]);

  const handleConfirm = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    try {
      setSubmitting(true);
      await onConfirm(trimmed);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) {
      return;
    }

    onClose();
  };

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Enter' && value.trim() && !submitting) {
      event.preventDefault();
      await handleConfirm();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      handleClose();
    }
  };

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth
    >
      <ModalHeader>
        <HeaderIcon>
          <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1.5}
              d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
            />
          </svg>
        </HeaderIcon>
        <HeaderContent>
          <HeaderTitle>{title}</HeaderTitle>
          <HeaderDescription>{getDescription(title, label)}</HeaderDescription>
        </HeaderContent>
      </ModalHeader>

      <ModalContent>
        <InputField
          autoFocus
          type='text'
          placeholder={label}
          value={value}
          onChange={event => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={submitting}
        />
      </ModalContent>

      <ModalFooter>
        <CancelButton type='button' onClick={handleClose} disabled={submitting}>
          {cancelLabel}
        </CancelButton>
        <ConfirmButton
          type='button'
          onClick={handleConfirm}
          disabled={submitting || !value.trim()}
        >
          <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
            />
          </svg>
          {confirmLabel}
        </ConfirmButton>
      </ModalFooter>
    </StyledDialog>
  );
};
