import React, { useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import EastRoundedIcon from '@mui/icons-material/EastRounded';
import StorageIcon from '@mui/icons-material/Storage';
import { useTheme } from '@mui/material/styles';

import {
  CloseButton,
  HeaderActions,
  HeaderLeft,
  HeaderRoot,
  IconWrapper,
  Subtitle,
  SubtitleLinkButton,
  SubtitleRow,
  TitleInput,
  TitleInputWrapper,
  TitleRow,
  TitleSection,
  TitleText,
} from './styles.ts';

type Props = {
  documentationLinkLabel?: string;
  onOpenDocumentation?: (() => void) | null;
  title: string;
  subtitle: string;
  commentTrigger?: React.ReactNode;
  onClose: () => void;
  onChangeTitle: (v: string) => void;
};

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
  commentTrigger,
  onClose,
  onChangeTitle,
}) => {
  const theme = useTheme();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const cursorPositionRef = useRef(0);

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
      <HeaderLeft>
        <IconWrapper>
          <StorageIcon
            sx={{
              color: theme.palette.primary.main,
              fontSize: 22,
            }}
          />
        </IconWrapper>

        <TitleSection>
          <TitleRow>
            <TitleText
              type='button'
              onClick={startEdit}
              aria-label='Переименовать ноду'
              aria-hidden={isEditingTitle}
              tabIndex={isEditingTitle ? -1 : 0}
              sx={{ visibility: isEditingTitle ? 'hidden' : 'visible' }}
            >
              {title || 'Node Editor'}
            </TitleText>
            {isEditingTitle ? (
              <TitleInputWrapper data-value={editedTitle || ' '}>
                <TitleInput
                  ref={titleInputRef}
                  value={editedTitle}
                  onChange={e => setEditedTitle(e.target.value)}
                  onKeyDown={onKeyDown}
                  onBlur={save}
                />
              </TitleInputWrapper>
            ) : null}
          </TitleRow>

          <SubtitleRow>
            <Subtitle>{subtitle}</Subtitle>
            {onOpenDocumentation ? (
              <SubtitleLinkButton
                type='button'
                onClick={onOpenDocumentation}
                aria-label={documentationLinkLabel}
              >
                {documentationLinkLabel}
                <EastRoundedIcon sx={{ fontSize: 14 }} />
              </SubtitleLinkButton>
            ) : null}
          </SubtitleRow>
        </TitleSection>
      </HeaderLeft>

      <HeaderActions>
        {commentTrigger ?? null}
        <CloseButton onClick={onClose}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </CloseButton>
      </HeaderActions>
    </HeaderRoot>
  );
};
