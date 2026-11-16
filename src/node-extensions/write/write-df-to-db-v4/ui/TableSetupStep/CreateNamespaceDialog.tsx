import { useId, useRef, useState } from 'react';

import { CloseIcon } from '@/shared/ui/clean-minimal/icons';

import { getCatalogNameError } from '../../lib/targetNames';
import {
  ButtonSpinner,
  ErrorText,
  IconCloseButton,
  InputBox,
  SmallButton,
  SmallDialog,
  SmallDialogBody,
  SmallDialogFooter,
  SmallDialogHeader,
  SmallDialogSubtitle,
  SmallDialogTitle,
} from '../kit.styles';

export type CreateNamespaceRequest =
  | { kind: 'database' }
  | { kind: 'schema'; databaseName: string | null };

type CreateNamespaceDialogProps = {
  request: CreateNamespaceRequest;
  /** Имена, которые уже есть рядом (для проверки дубликатов). */
  takenNames: readonly string[];
  /** Возвращает текст ошибки или null, если создание прошло. */
  onCreate: (name: string) => Promise<string | null>;
  onClose: () => void;
};

export const CreateNamespaceDialog = ({
  request,
  takenNames,
  onCreate,
  onClose,
}: CreateNamespaceDialogProps) => {
  const titleId = useId();
  const inputId = useId();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const isSchema = request.kind === 'schema';
  const location = isSchema ? (request.databaseName ?? '') : '';
  const validationError = getCatalogNameError(name, takenNames, location);
  const error = validationError || submitError;
  const canCreate = Boolean(name.trim()) && !validationError && !busy;

  const close = () => {
    if (!busyRef.current) onClose();
  };

  const create = async () => {
    if (!canCreate || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setSubmitError(null);
    const failure = await onCreate(name.trim());
    busyRef.current = false;
    setBusy(false);
    if (failure) {
      setSubmitError(failure);
      return;
    }
    onClose();
  };

  return (
    <SmallDialog
      open
      onClose={close}
      aria-labelledby={titleId}
      data-testid='node-extensions/write/write-df-to-db-v4/create-namespace-dialog'
    >
      <SmallDialogHeader>
        <SmallDialogTitle id={titleId}>
          {isSchema ? 'Новая схема' : 'Новая база данных'}
        </SmallDialogTitle>
        <SmallDialogSubtitle>
          {isSchema && location ? `в базе ${location}` : null}
        </SmallDialogSubtitle>
        <IconCloseButton
          type='button'
          aria-label='Закрыть'
          onClick={close}
          disabled={busy}
        >
          <CloseIcon size={13} strokeWidth={1.7} />
        </IconCloseButton>
      </SmallDialogHeader>
      <SmallDialogBody>
        <label htmlFor={inputId} style={{ fontSize: 13 }}>
          Название
        </label>
        <InputBox invalid={Boolean(error)} mono width='100%'>
          <input
            id={inputId}
            value={name}
            onChange={event => {
              setName(event.target.value);
              setSubmitError(null);
            }}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void create();
              }
            }}
            placeholder={isSchema ? 'new_schema' : 'new_database'}
            aria-invalid={Boolean(error)}
            spellCheck={false}
            autoComplete='off'
            autoFocus
          />
        </InputBox>
        {error ? <ErrorText role='alert'>{error}</ErrorText> : null}
      </SmallDialogBody>
      <SmallDialogFooter>
        <SmallButton
          type='button'
          tone='secondary'
          onClick={close}
          disabled={busy}
        >
          Отмена
        </SmallButton>
        <SmallButton
          type='button'
          tone='primary'
          onClick={() => void create()}
          disabled={!canCreate}
        >
          {busy ? (
            <>
              <ButtonSpinner />
              Создаём…
            </>
          ) : (
            'Создать'
          )}
        </SmallButton>
      </SmallDialogFooter>
    </SmallDialog>
  );
};
