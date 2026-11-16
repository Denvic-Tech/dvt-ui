import React, { useRef, useState } from 'react';

import { NodeIcon } from '@/shared/ui/node-icon/NodeIcon';

import {
  HeaderDivider,
  HeaderIconButton,
  HeaderNodeIcon,
  HeaderRoot,
  HeaderSecondary,
  HeaderSpacer,
  TitleInput,
  TitleInputWrapper,
  TitleRow,
  TitleText,
} from './styles';

type Props = {
  documentationLinkLabel?: string;
  onOpenDocumentation?: (() => void) | null;
  title: string;
  /** Тип ноды или статус; показывается серым, только если отличается от названия. */
  subtitle: string;
  iconKey?: string | null | undefined;
  commentTrigger?: React.ReactNode;
  onClose: () => void;
  onChangeTitle: (v: string) => void;
};

const DocumentationIcon = () => (
  <svg
    aria-hidden='true'
    width={16}
    height={16}
    viewBox='0 0 16 16'
    fill='none'
    stroke='currentColor'
    strokeWidth={1.5}
    strokeLinejoin='round'
  >
    <path d='M8 4.2C6.8 3.3 5 3 2.5 3v9.5c2.5 0 4.3.3 5.5 1.2 1.2-.9 3-1.2 5.5-1.2V3C11 3 9.2 3.3 8 4.2zM8 4.2v9.5' />
  </svg>
);

const CloseIcon = () => (
  <svg
    aria-hidden='true'
    width={14}
    height={14}
    viewBox='0 0 16 16'
    fill='none'
    stroke='currentColor'
    strokeWidth={1.7}
    strokeLinecap='round'
  >
    <path d='M4 4l8 8M12 4l-8 8' />
  </svg>
);

const getCursorPositionFromClick = (
  element: HTMLElement,
  clientX: number,
  value: string
) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return value.length;

  const styles = window.getComputedStyle(element);
  context.font = `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;

  const clickX = clientX - element.getBoundingClientRect().left;
  let measuredWidth = 0;

  for (let index = 0; index < value.length; index += 1) {
    const characterWidth = context.measureText(value[index]).width;
    if (clickX < measuredWidth + characterWidth / 2) return index;
    measuredWidth += characterWidth;
  }

  return value.length;
};

export const Header: React.FC<Props> = ({
  documentationLinkLabel = 'Документация',
  onOpenDocumentation,
  title,
  subtitle,
  iconKey,
  commentTrigger,
  onClose,
  onChangeTitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const cursorPositionRef = useRef(0);
  const displayTitle = title || 'Node Editor';
  const secondary = subtitle && subtitle !== displayTitle ? subtitle : null;

  const startEdit = (event: React.MouseEvent<HTMLButtonElement>) => {
    const nextTitle = title || '';
    cursorPositionRef.current =
      event.detail === 0
        ? nextTitle.length
        : getCursorPositionFromClick(
            event.currentTarget,
            event.clientX,
            nextTitle
          );
    setEditedTitle(nextTitle);
    setIsEditingTitle(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.setSelectionRange(
        cursorPositionRef.current,
        cursorPositionRef.current
      );
    }, 0);
  };

  const save = () => {
    const next = editedTitle.trim();
    if (next) onChangeTitle(next);
    setIsEditingTitle(false);
  };

  const cancel = () => {
    setIsEditingTitle(false);
    setEditedTitle('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') save();
    else if (e.key === 'Escape') cancel();
  };

  return (
    <HeaderRoot>
      <HeaderNodeIcon>
        <NodeIcon iconKey={iconKey} size={16} />
      </HeaderNodeIcon>

      <TitleRow>
        <TitleText
          type='button'
          onClick={startEdit}
          aria-label='Переименовать ноду'
          aria-hidden={isEditingTitle}
          tabIndex={isEditingTitle ? -1 : 0}
          title={displayTitle}
          style={{ visibility: isEditingTitle ? 'hidden' : 'visible' }}
        >
          {displayTitle}
        </TitleText>
        {isEditingTitle ? (
          <TitleInputWrapper data-value={editedTitle || ' '}>
            <TitleInput
              ref={titleInputRef}
              value={editedTitle}
              onChange={e => setEditedTitle(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={save}
              aria-label='Название ноды'
            />
          </TitleInputWrapper>
        ) : null}
      </TitleRow>
      {secondary ? (
        <HeaderSecondary title={secondary}>{secondary}</HeaderSecondary>
      ) : null}

      <HeaderSpacer />

      {onOpenDocumentation ? (
        <HeaderIconButton
          type='button'
          onClick={onOpenDocumentation}
          aria-label={documentationLinkLabel}
          title={documentationLinkLabel}
        >
          <DocumentationIcon />
        </HeaderIconButton>
      ) : null}
      {commentTrigger ?? null}
      <HeaderDivider aria-hidden='true' />
      <HeaderIconButton
        type='button'
        onClick={onClose}
        aria-label='Закрыть'
        title='Закрыть'
      >
        <CloseIcon />
      </HeaderIconButton>
    </HeaderRoot>
  );
};
