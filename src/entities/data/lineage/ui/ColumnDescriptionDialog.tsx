import { type KeyboardEvent, type ReactNode, useState } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { alpha, styled, type Theme } from '@mui/material/styles';

import { Dialog } from '@/shared/ui/primitives';

const FONT =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const tokens = (theme: Theme) => {
  const light = theme.palette.mode === 'light';
  const ink = theme.palette.text.primary;
  return {
    ink: light ? '#1d1f24' : ink,
    t2: light ? '#5a5e68' : theme.palette.text.secondary,
    t3: light ? '#8d919a' : alpha(ink, 0.5),
    t4: light ? '#b8bbc2' : alpha(ink, 0.32),
    border: light ? '#e9eaee' : theme.palette.divider,
    field: light ? '#f5f6f8' : alpha(ink, 0.05),
    accent: theme.palette.primary.main,
    accentHover: theme.palette.primary.dark,
    accentSoft: light ? '#eef0fe' : alpha(theme.palette.primary.main, 0.16),
    danger: theme.palette.error.main,
  };
};

const Root = styled('div')(({ theme }) => ({
  color: tokens(theme).ink,
  display: 'flex',
  flexDirection: 'column',
  fontFamily: FONT,
  minWidth: 0,
  position: 'relative',
  '& button, & textarea': { fontFamily: 'inherit' },
}));

const Header = styled('div')({
  alignItems: 'center',
  display: 'flex',
  gap: 14,
  padding: '24px 56px 24px 24px',
});

const HeaderIcon = styled('span')(({ theme }) => {
  const t = tokens(theme);
  return {
    alignItems: 'center',
    background: t.accentSoft,
    borderRadius: 12,
    color: t.accent,
    display: 'flex',
    flexShrink: 0,
    height: 44,
    justifyContent: 'center',
    width: 44,
  };
});

const Title = styled('h2')({
  fontSize: 17,
  fontWeight: 600,
  letterSpacing: '-.01em',
  lineHeight: '22px',
  margin: 0,
});

const Subtitle = styled('div')(({ theme }) => {
  const t = tokens(theme);
  return {
    color: t.t3,
    fontSize: 13,
    lineHeight: '18px',
    marginTop: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    '& b': { color: t.ink, fontWeight: 500, marginRight: 6 },
  };
});

const CloseButton = styled('button')(({ theme }) => {
  const t = tokens(theme);
  return {
    alignItems: 'center',
    background: 'none',
    border: 0,
    borderRadius: 8,
    color: t.t3,
    cursor: 'pointer',
    display: 'flex',
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 14,
    top: 14,
    width: 32,
    '&:hover': { background: t.field, color: t.ink },
  };
});

const Body = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '0 24px 20px',
});

const Previous = styled('div')(({ theme }) => {
  const t = tokens(theme);
  return {
    borderLeft: `2px solid ${t.border}`,
    color: t.t2,
    fontSize: 12.5,
    lineHeight: 1.45,
    padding: '2px 0 2px 10px',
    '& span': { color: t.t3, display: 'block', fontSize: 12 },
    '& p': { margin: 0 },
  };
});

const Field = styled('textarea')(({ theme }) => {
  const t = tokens(theme);
  return {
    background: t.field,
    border: '1px solid transparent',
    borderRadius: 12,
    color: t.ink,
    font: 'inherit',
    fontSize: 14,
    lineHeight: 1.5,
    minHeight: 100,
    outline: 0,
    padding: '12px 14px',
    resize: 'vertical',
    transition: 'border-color .12s, box-shadow .12s, background .12s',
    width: '100%',
    '&::placeholder': { color: t.t4 },
    '&:focus': {
      background: theme.palette.background.paper,
      borderColor: t.accent,
      boxShadow: `0 0 0 3px ${t.accentSoft}`,
    },
  };
});

const Hint = styled('div')(({ theme }) => ({
  color: tokens(theme).t3,
  fontSize: 12.5,
  lineHeight: 1.5,
}));

const ErrorText = styled('div')(({ theme }) => ({
  color: tokens(theme).danger,
  fontSize: 12.5,
}));

const Footer = styled('div')(({ theme }) => ({
  alignItems: 'center',
  borderTop: `1px solid ${tokens(theme).border}`,
  display: 'flex',
  gap: 8,
  padding: '14px 24px',
}));

const FooterButton = styled('button', {
  shouldForwardProp: prop => prop !== 'tone',
})<{ tone: 'primary' | 'plain' | 'danger' }>(({ theme, tone }) => {
  const t = tokens(theme);
  const base = {
    alignItems: 'center',
    border: 0,
    borderRadius: 10,
    cursor: 'pointer',
    display: 'inline-flex',
    fontSize: 14,
    fontWeight: 600,
    gap: 6,
    height: 38,
    padding: '0 14px',
    whiteSpace: 'nowrap' as const,
    '&:disabled': { cursor: 'default' },
  };
  if (tone === 'primary') {
    return {
      ...base,
      background: t.accent,
      color: '#fff',
      padding: '0 18px',
      '&:hover:not(:disabled)': { background: t.accentHover },
      '&:disabled': { background: t.field, color: t.t4, cursor: 'default' },
    };
  }
  if (tone === 'danger') {
    return {
      ...base,
      background: 'none',
      color: t.t3,
      fontWeight: 500,
      marginRight: 'auto',
      padding: '0 8px 0 4px',
      '&:hover:not(:disabled)': { color: t.danger },
      '&:disabled': { cursor: 'default', opacity: 0.5 },
    };
  }
  return {
    ...base,
    background: 'none',
    color: t.t2,
    '&:hover:not(:disabled)': { color: t.ink },
    '&:disabled': { cursor: 'default', opacity: 0.5 },
  };
});

export interface ColumnDescriptionDialogProps {
  open: boolean;
  /** Заголовок окна; по умолчанию «Описание колонки». */
  title?: string;
  columnName: string;
  /** Серый текст после имени: тип колонки или контекст строки. */
  meta?: string | null;
  /** Текст до этой ноды — для уточнений ниже по цепочке. */
  previous?: string | null;
  showPrevious?: boolean;
  initialValue: string;
  placeholder?: string;
  /** Подсказка под полем: куда запишется текст и как он наследуется. */
  hint: ReactNode;
  canDelete: boolean;
  deleteLabel?: string;
  isSaving: boolean;
  errorMessage?: string | null;
  /** `null` удаляет описание. */
  onSave: (description: string | null) => void;
  onClose: () => void;
}

/**
 * Окно описания колонки — общее для каталога данных и окна колонок ноды.
 * Esc закрывает только это окно, Ctrl+Enter сохраняет.
 */
export const ColumnDescriptionDialog = ({
  open,
  title = 'Описание колонки',
  columnName,
  meta = null,
  previous = null,
  showPrevious = false,
  initialValue,
  placeholder = 'Что значит эта колонка для бизнеса',
  hint,
  canDelete,
  deleteLabel = 'Удалить',
  isSaving,
  errorMessage = null,
  onSave,
  onClose,
}: ColumnDescriptionDialogProps) => {
  const [draft, setDraft] = useState(initialValue);
  const dirty = draft.trim() !== initialValue.trim();

  const close = () => {
    if (!isSaving) {
      onClose();
    }
  };

  const submit = () => {
    if (!dirty || isSaving) {
      return;
    }
    const description = draft.trim();
    if (!description && !canDelete) {
      onClose();
      return;
    }
    onSave(description || null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Клавиши не уходят к обработчикам родительских окон: Esc закрывает
    // только это окно, стрелки не переключают колонки под ним.
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth={false}
      aria-labelledby='column-description-dialog-title'
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(3px)',
            backgroundColor: 'rgba(22, 24, 46, 0.34)',
          },
        },
        paper: {
          sx: {
            borderRadius: '20px',
            boxShadow: '0 24px 64px rgba(22, 24, 46, 0.24)',
            maxWidth: 'calc(100% - 48px)',
            width: 480,
          },
        },
      }}
      onClose={close}
    >
      <Root
        data-testid='entities/lineage/column-description-dialog'
        onKeyDown={handleKeyDown}
      >
        <Header>
          <HeaderIcon>
            <EditOutlinedIcon sx={{ fontSize: 20 }} />
          </HeaderIcon>
          <div style={{ minWidth: 0 }}>
            <Title id='column-description-dialog-title'>{title}</Title>
            <Subtitle title={meta ? `${columnName} ${meta}` : columnName}>
              <b>{columnName}</b>
              {meta}
            </Subtitle>
          </div>
        </Header>
        <CloseButton type='button' aria-label='Закрыть' onClick={close}>
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </CloseButton>
        <Body>
          {showPrevious ? (
            <Previous>
              <span>До этой ноды</span>
              <p>{previous ? `«${previous}»` : 'Описания нет'}</p>
            </Previous>
          ) : null}
          <Field
            autoFocus
            rows={4}
            value={draft}
            disabled={isSaving}
            placeholder={placeholder}
            aria-label={`Описание колонки ${columnName}`}
            onFocus={event => {
              const { length } = event.currentTarget.value;
              event.currentTarget.setSelectionRange(length, length);
            }}
            onChange={event => setDraft(event.target.value)}
          />
          <Hint>{hint}</Hint>
          {errorMessage ? (
            <ErrorText role='alert'>{errorMessage}</ErrorText>
          ) : null}
        </Body>
        <Footer>
          {canDelete ? (
            <FooterButton
              type='button'
              tone='danger'
              disabled={isSaving}
              onClick={() => onSave(null)}
            >
              <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
              {deleteLabel}
            </FooterButton>
          ) : (
            <span style={{ marginRight: 'auto' }} />
          )}
          <FooterButton
            type='button'
            tone='plain'
            disabled={isSaving}
            onClick={close}
          >
            Отмена
          </FooterButton>
          <FooterButton
            type='button'
            tone='primary'
            disabled={!dirty || isSaving}
            onClick={submit}
          >
            Сохранить
          </FooterButton>
        </Footer>
      </Root>
    </Dialog>
  );
};
