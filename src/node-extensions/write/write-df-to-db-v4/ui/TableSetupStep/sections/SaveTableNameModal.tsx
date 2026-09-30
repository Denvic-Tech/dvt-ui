import { useId, useRef, useState } from 'react';
import { Alert, CircularProgress } from '@mui/material';
import { Check, Table2 } from 'lucide-react';

import {
  CancelButton,
  CreateButton,
  HeaderContent,
  HeaderDescription,
  HeaderIcon,
  HeaderTitle,
  InputField,
  ModalContent,
  ModalFooter,
  ModalHeader,
  StyledDialog,
} from '@/shared/ui/create-entity-dialog/styles';

import { extractApiErrorMessage } from '../../../lib/helpers';

type Props = {
  name: string;
  onNameChange: (value: string) => void;
  onSave: () => Promise<void>;
  onClose: () => void;
};

export const SaveTableNameModal = ({
  name,
  onNameChange,
  onSave,
  onClose,
}: Props) => {
  const titleId = useId();
  const descriptionId = useId();
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (!savingRef.current) onClose();
  };

  const handleSave = async () => {
    if (!name.trim() || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await onSave();
    } catch (error: unknown) {
      setError(
        extractApiErrorMessage(error, 'Не удалось сохранить имя таблицы.')
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <StyledDialog
      open
      onClose={handleClose}
      disableEscapeKeyDown={saving}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <ModalHeader>
        <HeaderIcon>
          <Table2 size={24} strokeWidth={1.5} />
        </HeaderIcon>
        <HeaderContent>
          <HeaderTitle id={titleId}>Новая таблица</HeaderTitle>
          <HeaderDescription id={descriptionId}>
            Таблица будет создана после настройки схемы
          </HeaderDescription>
        </HeaderContent>
      </ModalHeader>
      <ModalContent aria-busy={saving}>
        <InputField
          autoFocus
          name='table_name'
          type='text'
          aria-label='Название новой таблицы'
          placeholder='Название новой таблицы'
          value={name}
          disabled={saving}
          onChange={event => {
            setError(null);
            onNameChange(event.target.value);
          }}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void handleSave();
            }
          }}
        />
        {error ? (
          <Alert severity='error' sx={{ overflowWrap: 'anywhere' }}>
            {error}
          </Alert>
        ) : null}
      </ModalContent>
      <ModalFooter>
        <CancelButton type='button' onClick={handleClose} disabled={saving}>
          Отмена
        </CancelButton>
        <CreateButton
          type='button'
          onClick={() => void handleSave()}
          disabled={!name.trim() || saving}
        >
          {saving ? (
            <CircularProgress size={16} color='inherit' aria-hidden />
          ) : (
            <Check size={16} />
          )}
          Сохранить
        </CreateButton>
      </ModalFooter>
    </StyledDialog>
  );
};
