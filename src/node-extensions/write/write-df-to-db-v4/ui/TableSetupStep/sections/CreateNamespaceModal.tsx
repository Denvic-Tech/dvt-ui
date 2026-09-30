import { useEffect, useId, useRef, useState } from 'react';
import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import { Check, Copy, Database, Folder, Plus } from 'lucide-react';

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
import { IconButton, Tooltip } from '@/shared/ui/primitives';

import { extractApiErrorMessage } from '../../../lib/helpers';

export type NamespaceCreationResult = {
  severity: 'success' | 'error';
  message: string;
} | null;

type CreateNamespaceModalProps = {
  kind: 'database' | 'schema';
  name: string;
  isSaving: boolean;
  result: NamespaceCreationResult;
  onNameChange: (value: string) => void;
  onSave: () => Promise<void>;
  onClose: () => void;
};

export const CreateNamespaceModal = ({
  kind,
  name,
  isSaving,
  result,
  onNameChange,
  onSave,
  onClose,
}: CreateNamespaceModalProps) => {
  const titleId = useId();
  const descriptionId = useId();
  const submittingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>(
    'idle'
  );
  const busy = isSaving || submitting;
  const succeeded = result?.severity === 'success';
  const showSuccess = succeeded && !busy;
  const error =
    submitError ?? (result?.severity === 'error' ? result.message : null);
  const isDatabase = kind === 'database';
  const title = showSuccess
    ? isDatabase
      ? 'База данных создана'
      : 'Схема создана'
    : isDatabase
      ? 'Новая база данных'
      : 'Новая схема';
  const inputLabel = isDatabase ? 'Название базы данных' : 'Название схемы';
  const Icon = isDatabase ? Database : Folder;

  useEffect(() => {
    setCopyState('idle');
  }, [error, busy]);

  useEffect(() => {
    if (copyState !== 'copied') return;
    const timeout = setTimeout(() => setCopyState('idle'), 2000);
    return () => clearTimeout(timeout);
  }, [copyState]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!showSuccess) return;
    const timeout = setTimeout(() => onCloseRef.current(), 1200);
    return () => clearTimeout(timeout);
  }, [showSuccess]);

  const handleCopyError = async () => {
    if (!error) return;
    try {
      await navigator.clipboard.writeText(error);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };

  const handleClose = () => {
    if (!busy && !submittingRef.current) onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim() || busy || succeeded || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSave();
    } catch (error: unknown) {
      setSubmitError(
        extractApiErrorMessage(error, 'Не удалось выполнить запрос.')
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <StyledDialog
      open
      onClose={handleClose}
      disableEscapeKeyDown={busy}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <ModalHeader>
        <HeaderIcon
          sx={
            showSuccess
              ? {
                  backgroundColor: '#E8F6ED',
                  '& svg': { color: '#15803D' },
                }
              : {}
          }
        >
          {showSuccess ? (
            <Check size={24} />
          ) : (
            <Icon size={24} strokeWidth={1.5} />
          )}
        </HeaderIcon>
        <HeaderContent>
          <HeaderTitle id={titleId} aria-live='polite'>
            {title}
          </HeaderTitle>
          <HeaderDescription id={descriptionId}>
            {showSuccess
              ? isDatabase
                ? 'На сервере текущего подключения'
                : 'В выбранной базе данных'
              : isDatabase
                ? 'Создайте базу данных в текущем подключении'
                : 'Создайте схему в выбранной базе данных'}
          </HeaderDescription>
        </HeaderContent>
      </ModalHeader>

      <ModalContent aria-busy={busy}>
        <Box sx={{ position: 'relative' }}>
          <InputField
            autoFocus
            placeholder={inputLabel}
            type='text'
            name='name'
            aria-label={inputLabel}
            value={name}
            disabled={busy}
            readOnly={showSuccess}
            sx={{
              pr: '44px',
              ...(showSuccess
                ? {
                    backgroundColor: '#F7F7F8',
                    color: '#6B6B76',
                    fontFamily: 'ui-monospace, Consolas, monospace',
                    '&, &:hover, &:focus': {
                      borderColor: '#15803D',
                      backgroundColor: '#F7F7F8',
                      boxShadow: 'none',
                    },
                  }
                : {}),
            }}
            onChange={event => {
              setSubmitError(null);
              onNameChange(event.target.value);
            }}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleSubmit();
              }
            }}
          />
          {busy || showSuccess ? (
            <Box
              sx={{
                position: 'absolute',
                right: 16,
                top: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              {showSuccess ? (
                <Check size={16} color='#15803D' aria-hidden />
              ) : (
                <CircularProgress
                  size={16}
                  thickness={4}
                  aria-hidden
                  sx={{ color: '#6366F1' }}
                />
              )}
            </Box>
          ) : null}
        </Box>
        {busy ? (
          <Typography
            role='status'
            aria-live='polite'
            variant='body2'
            color='text.secondary'
          >
            {isDatabase ? 'Создаём базу данных…' : 'Создаём схему…'}
          </Typography>
        ) : null}
        {error && !busy && !showSuccess ? (
          <Alert
            severity='error'
            sx={{
              alignItems: 'flex-start',
              bgcolor: '#FEF2F2',
              color: '#B42318',
              borderRadius: '12px',
              px: 1.5,
              py: 1.25,
              overflowWrap: 'anywhere',
              '& .MuiAlert-icon': {
                color: '#DC2626',
                mr: 1.5,
                py: 0.25,
                '& svg': { fontSize: 18 },
              },
              '& .MuiAlert-message': { minWidth: 0, width: '100%', py: 0 },
            }}
          >
            <Stack direction='row' alignItems='flex-start' gap={1}>
              <Typography
                component='div'
                sx={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                  maxHeight: 42,
                  overflow: 'hidden',
                }}
              >
                {isDatabase
                  ? `Не удалось создать базу данных ${name.trim()}`
                  : `Не удалось создать схему ${name.trim()}`}
              </Typography>
              <Tooltip
                title={
                  copyState === 'copied'
                    ? 'Скопировано'
                    : 'Скопировать полный текст ошибки'
                }
              >
                <IconButton
                  size='xs'
                  aria-label='Скопировать полный текст ошибки'
                  onClick={() => void handleCopyError()}
                  sx={{
                    width: 24,
                    height: 24,
                    minWidth: 24,
                    minHeight: 24,
                    flexShrink: 0,
                    color: 'inherit',
                  }}
                >
                  {copyState === 'copied' ? (
                    <Check size={15} />
                  ) : (
                    <Copy size={15} />
                  )}
                </IconButton>
              </Tooltip>
            </Stack>
            <Typography
              component='div'
              sx={{
                mt: 0.5,
                fontFamily: 'Consolas, monospace',
                fontSize: 12,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 4,
                maxHeight: '6.4em',
                overflow: 'hidden',
              }}
            >
              {error}
            </Typography>
            {copyState === 'error' ? (
              <Typography
                role='status'
                variant='caption'
                sx={{ display: 'block', mt: 0.5 }}
              >
                Не удалось скопировать текст ошибки
              </Typography>
            ) : null}
          </Alert>
        ) : null}
      </ModalContent>

      <ModalFooter>
        {showSuccess ? (
          <>
            <CancelButton
              type='button'
              disabled
              sx={{ border: '1px solid #E5E7EB', opacity: 0.6 }}
            >
              Отмена
            </CancelButton>
            <CreateButton
              type='button'
              onClick={handleClose}
              sx={{
                backgroundColor: '#15803D',
                '&:hover': { backgroundColor: '#166534' },
              }}
            >
              <Check size={16} />
              Создано
            </CreateButton>
          </>
        ) : (
          <>
            <CancelButton type='button' onClick={handleClose} disabled={busy}>
              {error ? 'Закрыть' : 'Отмена'}
            </CancelButton>
            <CreateButton
              type='button'
              onClick={() => void handleSubmit()}
              disabled={!name.trim() || busy}
              aria-busy={busy}
              sx={
                busy
                  ? {
                      '&:disabled': {
                        backgroundColor: '#6366F1',
                        color: '#FFFFFF',
                        opacity: 1,
                        cursor: 'wait',
                      },
                    }
                  : {}
              }
            >
              {busy ? (
                <CircularProgress
                  size={16}
                  thickness={4}
                  color='inherit'
                  aria-hidden
                />
              ) : (
                <Plus size={16} />
              )}
              {busy ? 'Создаём...' : error ? 'Повторить' : 'Создать'}
            </CreateButton>
          </>
        )}
      </ModalFooter>
    </StyledDialog>
  );
};
