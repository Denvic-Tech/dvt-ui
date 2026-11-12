import React from 'react';
import { Box, Button, Modal } from '@mui/material';

import { EditableComment } from '@/shared/ui';

import {
  CommentModal,
  CommentModalBody,
  CommentModalCloseButton,
  CommentModalFooter,
  CommentModalHeader,
  CommentModalIcon,
  CommentModalSubtitle,
  CommentModalTitle,
  HeaderBadge,
  HeaderIconButton,
} from './styles';

const CommentIcon = ({
  size = 16,
  color = 'currentColor',
}: {
  color?: string;
  size?: number;
}) => (
  <svg width={size} height={size} viewBox='0 0 16 16' fill='none'>
    <path
      d='M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v6A1.5 1.5 0 0 1 12.5 11H6l-3 3V3.5z'
      stroke={color}
      strokeWidth='1.4'
      strokeLinejoin='round'
    />
  </svg>
);

const CloseIcon = ({
  size = 16,
  color = 'currentColor',
}: {
  color?: string;
  size?: number;
}) => (
  <svg width={size} height={size} viewBox='0 0 16 16' fill='none'>
    <path
      d='M4 4l8 8M12 4l-8 8'
      stroke={color}
      strokeWidth='1.6'
      strokeLinecap='round'
    />
  </svg>
);

/** Иконка комментария для кнопки в шапке модалки. */
const HeaderCommentIcon = () => (
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
    <path d='M13.5 10a1.5 1.5 0 0 1-1.5 1.5H5l-2.5 2.5V3.5A1.5 1.5 0 0 1 4 2h8a1.5 1.5 0 0 1 1.5 1.5z' />
  </svg>
);

type CommentTriggerProps = {
  value: string;
  onClick: () => void;
};

export const CommentTrigger: React.FC<CommentTriggerProps> = ({
  value,
  onClick,
}) => {
  const hasComment = (value ?? '').trim().length > 0;
  const label = hasComment ? 'Открыть комментарий' : 'Добавить комментарий';

  return (
    <HeaderIconButton
      type='button'
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <HeaderCommentIcon />
      {hasComment ? <HeaderBadge aria-hidden='true' /> : null}
    </HeaderIconButton>
  );
};

type Props = {
  value: string;
  open: boolean;
  onClose: () => void;
  onChange: (v: string) => void;
  nodeTitle: string;
};

export const CommentSection: React.FC<Props> = ({
  value,
  open,
  onClose,
  onChange,
  nodeTitle,
}) => {
  if (!open) {
    return null;
  }

  return (
    <Modal
      open
      onClose={onClose}
      aria-label='Комментарий'
      sx={theme => ({ zIndex: theme.zIndex.modal + 1 })}
      slotProps={{
        backdrop: {
          sx: { backgroundColor: 'rgba(15, 23, 42, 0.45)' },
        },
      }}
    >
      <CommentModal role='dialog' aria-modal='true' aria-label='Комментарий'>
        <CommentModalHeader>
          <CommentModalIcon>
            <CommentIcon size={15} color='#6366f1' />
          </CommentModalIcon>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <CommentModalTitle>Комментарий</CommentModalTitle>
            <CommentModalSubtitle noWrap title={nodeTitle}>
              {nodeTitle}
            </CommentModalSubtitle>
          </Box>

          <CommentModalCloseButton type='button' onClick={onClose}>
            <CloseIcon size={15} />
          </CommentModalCloseButton>
        </CommentModalHeader>

        <CommentModalBody>
          <EditableComment
            value={value}
            onChange={onChange}
            maxLength={20000}
            minRows={12}
            maxRows={18}
            placeholder='Add a comment...'
          />
        </CommentModalBody>

        <CommentModalFooter>
          <Button
            type='button'
            variant='outlined'
            color='inherit'
            onClick={() => onChange('')}
            sx={{ color: 'text.secondary' }}
          >
            Очистить
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            type='button'
            variant='outlined'
            color='inherit'
            onClick={onClose}
            sx={{ color: 'text.secondary' }}
          >
            Отмена
          </Button>
          <Button
            type='button'
            variant='contained'
            color='primary'
            disableElevation
            onClick={onClose}
            sx={{ fontWeight: 600 }}
          >
            Сохранить
          </Button>
        </CommentModalFooter>
      </CommentModal>
    </Modal>
  );
};
