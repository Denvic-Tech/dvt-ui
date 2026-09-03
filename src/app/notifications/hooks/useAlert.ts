import { useCallback } from 'react';

import { useAppDispatch } from '@/app/providers/store/hooks.ts';
import { addAlert } from '@/app/notifications/model/slice.ts';
import {
  AlertCreate,
  NotificationCreate,
} from '@/app/notifications/model/types.ts';

export const useAlert = () => {
  const dispatch = useAppDispatch();

  const showAlert = useCallback(
    (alert: AlertCreate) => {
      dispatch(addAlert(alert));
    },
    [dispatch]
  );

  const showNotification = useCallback(
    (notification: NotificationCreate) => {
      dispatch(addAlert(notification));
    },
    [dispatch]
  );

  return { showAlert, showNotification };
};
