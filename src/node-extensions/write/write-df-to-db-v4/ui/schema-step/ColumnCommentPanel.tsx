import { type ReactNode, useEffect, useLayoutEffect, useRef } from 'react';
import { keyframes, styled } from '@mui/material/styles';

import { IconButtonBase } from '@/shared/ui/clean-minimal/controls';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CloseIcon,
} from '@/shared/ui/clean-minimal/icons';
import { MONO_FONT_FAMILY, tokens } from '@/shared/ui/clean-minimal/tokens';

import { normalizeComment } from '../../lib/columnComments';

import { LinkButton } from './SchemaStep.styles';

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(24px); }
  to { opacity: 1; transform: none; }
`;

const Panel = styled('aside')({
  position: 'absolute',
  top: 8,
  right: 8,
  bottom: 8,
  zIndex: 30,
  width: 380,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: `1px solid ${tokens.border}`,
  borderRadius: 12,
  backgroundColor: tokens.surface,
  boxShadow:
    '0 20px 48px -16px rgba(20, 24, 40, 0.28), 0 2px 6px rgba(20, 24, 40, 0.06)',
  animation: `${slideIn} .22s cubic-bezier(.2, .8, .2, 1)`,
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
});

const PanelHeader = styled('div')({
  height: 44,
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  padding: '0 8px 0 16px',
});

const PanelTitle = styled('div')({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'baseline',
  gap: 8,
  '& .panel-label': { fontSize: 13, fontWeight: 600, color: tokens.text },
  '& .panel-column': {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: MONO_FONT_FAMILY,
    fontSize: 12.5,
    color: tokens.textMuted,
  },
});

const HeaderDivider = styled('span')({
  width: 1,
  height: 16,
  margin: '0 2px',
  backgroundColor: tokens.border,
});

const PanelBody = styled('div')({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '0 16px 16px',
});

/**
 * Поле комментария: по умолчанию ~6 строк, растёт по содержимому
 * (высоту ставит useLayoutEffect в панели), а когда упирается в низ — сжимается
 * flex-ом и прокручивается внутри.
 */
const CommentTextarea = styled('textarea')({
  flex: '0 1 auto',
  minHeight: 136,
  width: '100%',
  boxSizing: 'border-box',
  display: 'block',
  padding: '10px 12px',
  border: `1px solid ${tokens.border}`,
  borderRadius: 8,
  outline: 'none',
  resize: 'none',
  overflowY: 'auto',
  backgroundColor: tokens.surface,
  color: tokens.text,
  fontSize: 13,
  lineHeight: '19px',
  '&:focus': { borderColor: tokens.accent, boxShadow: tokens.focusRing },
  '&::placeholder': { color: tokens.textSubtle, opacity: 1 },
  '&:disabled': {
    backgroundColor: tokens.hover,
    color: tokens.textSubtle,
  },
});

/** Блоки «В DF» прижаты к низу панели и не двигаются вслед за полем. */
const SourceBox = styled('div')({
  flex: 'none',
  marginTop: 'auto',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '10px 12px',
  borderRadius: 8,
  backgroundColor: tokens.surfaceMuted,
  '& .source-label': {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: tokens.textSubtle,
  },
  '& .source-value': {
    fontSize: 13,
    lineHeight: '18px',
    color: tokens.textSecondary,
    overflowWrap: 'anywhere',
  },
  '& button': { alignSelf: 'flex-start', marginTop: 2 },
});

const SourceEmpty = styled('div')({
  flex: 'none',
  marginTop: 'auto',
  height: 36,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px',
  borderRadius: 8,
  backgroundColor: tokens.surfaceMuted,
  fontSize: 12.5,
  color: tokens.textSubtle,
});

const DisabledNote = styled('div')({
  fontSize: 12.5,
  color: tokens.textSubtle,
});

type ColumnCommentPanelProps = {
  columnName: string;
  value: string | null;
  onChange: (value: string | null) => void;
  /** Комментарий колонки в DataFrame («В DF»). */
  sourceComment: string | null;
  onUseSource: () => void;
  /** Значок происхождения описания из каталога. */
  sourceAdornment?: ReactNode;
  disabled?: boolean;
  disabledReason?: string | undefined;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
};

/** Плавающая панель редактирования комментария колонки (макет: `.cpan`). */
export const ColumnCommentPanel = ({
  columnName,
  value,
  onChange,
  sourceComment,
  onUseSource,
  sourceAdornment,
  disabled = false,
  disabledReason,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onClose,
}: ColumnCommentPanelProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Высота поля по содержимому: сброс в auto, затем scrollHeight + рамки.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const borders = textarea.offsetHeight - textarea.clientHeight;
    textarea.style.height = `${textarea.scrollHeight + borders}px`;
  }, [value, columnName]);

  // При переключении колонки курсор остаётся в поле комментария.
  useEffect(() => {
    if (disabled) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    const end = textarea.value.length;
    textarea.setSelectionRange(end, end);
  }, [columnName, disabled]);

  const isSourceApplied =
    normalizeComment(value) === normalizeComment(sourceComment);

  return (
    <Panel
      aria-label='Комментарий к колонке'
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <PanelHeader>
        <PanelTitle>
          <span className='panel-label'>Комментарий</span>
          <span className='panel-column' title={columnName}>
            {columnName}
          </span>
        </PanelTitle>
        <IconButtonBase
          type='button'
          aria-label='Предыдущая колонка'
          title='Предыдущая колонка'
          disabled={!hasPrevious}
          onClick={onPrevious}
        >
          <ChevronUpIcon />
        </IconButtonBase>
        <IconButtonBase
          type='button'
          aria-label='Следующая колонка'
          title='Следующая колонка'
          disabled={!hasNext}
          onClick={onNext}
        >
          <ChevronDownIcon />
        </IconButtonBase>
        <HeaderDivider aria-hidden='true' />
        <IconButtonBase
          type='button'
          aria-label='Закрыть'
          title='Закрыть'
          onClick={onClose}
        >
          <CloseIcon size={13} />
        </IconButtonBase>
      </PanelHeader>
      <PanelBody>
        <CommentTextarea
          ref={textareaRef}
          value={value ?? ''}
          disabled={disabled}
          placeholder='Комментарий к колонке'
          aria-label='Комментарий к колонке'
          onChange={event => onChange(normalizeComment(event.target.value))}
        />
        {disabled && disabledReason ? (
          <DisabledNote>{disabledReason}</DisabledNote>
        ) : null}
        {sourceComment ? (
          <SourceBox>
            <span className='source-label'>
              В DF
              {sourceAdornment}
            </span>
            <span className='source-value'>{sourceComment}</span>
            <LinkButton
              type='button'
              disabled={disabled || isSourceApplied}
              onClick={onUseSource}
            >
              Подставить
            </LinkButton>
          </SourceBox>
        ) : (
          <SourceEmpty>В DF комментария нет</SourceEmpty>
        )}
      </PanelBody>
    </Panel>
  );
};
