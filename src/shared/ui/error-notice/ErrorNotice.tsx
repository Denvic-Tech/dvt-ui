import { IconCopy, IconX } from '@tabler/icons-react';

import {
  NoticeActions,
  NoticeBody,
  NoticeButton,
  NoticeRoot,
  NoticeText,
  NoticeTitle,
} from './styles';

interface ErrorNoticeProps {
  title: string;
  message: string;
  onDismiss: () => void;
  // Spacing from the parent, e.g. through styled(ErrorNotice).
  className?: string;
}

// An inline error with «Скопировать ошибку» and «Закрыть» actions.
export const ErrorNotice = ({
  title,
  message,
  onDismiss,
  className,
}: ErrorNoticeProps) => (
  <NoticeRoot role='alert' className={className}>
    <NoticeBody>
      <NoticeTitle>{title}</NoticeTitle>
      <NoticeText>{message}</NoticeText>
    </NoticeBody>
    <NoticeActions>
      <NoticeButton
        disableRipple
        aria-label='Скопировать ошибку'
        title='Скопировать ошибку'
        onClick={() => {
          void navigator.clipboard?.writeText(message).catch(() => {});
        }}
      >
        <IconCopy size={13} stroke={1.5} />
      </NoticeButton>
      <NoticeButton
        disableRipple
        aria-label='Закрыть'
        title='Закрыть'
        onClick={onDismiss}
      >
        <IconX size={12} stroke={1.8} />
      </NoticeButton>
    </NoticeActions>
  </NoticeRoot>
);
