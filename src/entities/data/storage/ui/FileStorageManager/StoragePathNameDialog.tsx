import { useEffect, useMemo, useState } from 'react';
import { TextField } from '@mui/material';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/primitives';

type StoragePathNameDialogProps = {
  open: boolean;
  title: string;
  description: string;
  label: string;
  confirmLabel: string;
  initialValue?: string;
  onClose: () => void;
  onConfirm: (value: string) => Promise<void> | void;
  validate?: (value: string) => string | null;
};

export const StoragePathNameDialog = ({
  open,
  title,
  description,
  label,
  confirmLabel,
  initialValue = '',
  onClose,
  onConfirm,
  validate,
}: StoragePathNameDialogProps) => {
  const [value, setValue] = useState(initialValue);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setValue(initialValue);
    setErrorText(null);
    setSubmitting(false);
  }, [initialValue, open]);

  const trimmedValue = useMemo(() => value.trim(), [value]);

  const handleClose = () => {
    if (submitting) {
      return;
    }

    onClose();
  };

  const handleConfirm = async () => {
    const nextError = validate?.(trimmedValue) ?? null;
    if (nextError) {
      setErrorText(nextError);
      return;
    }

    try {
      setSubmitting(true);
      await onConfirm(trimmedValue);
    } catch (error) {
      console.error('StoragePathNameDialog confirm failed', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='xs'>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          size='small'
          label={label}
          value={value}
          onChange={event => {
            setValue(event.target.value);
            if (errorText) {
              setErrorText(null);
            }
          }}
          onKeyDown={event => {
            if (event.key === 'Enter' && trimmedValue && !submitting) {
              event.preventDefault();
              void handleConfirm();
            }

            if (event.key === 'Escape') {
              event.preventDefault();
              handleClose();
            }
          }}
          disabled={submitting}
          error={Boolean(errorText)}
          helperText={errorText ?? ' '}
        />
      </DialogContent>
      <DialogFooter>
        <Button
          type='button'
          variant='outline'
          onClick={handleClose}
          disabled={submitting}
        >
          Отмена
        </Button>
        <Button
          type='button'
          onClick={() => void handleConfirm()}
          disabled={submitting || trimmedValue.length === 0}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
