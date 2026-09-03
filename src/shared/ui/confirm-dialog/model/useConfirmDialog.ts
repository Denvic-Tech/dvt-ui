import { useCallback, useContext } from 'react';

import { ConfirmDialogContext } from '../context';
import type {
  ConfirmDialogActionId,
  ConfirmDialogOptions,
  CustomDialogAction,
  CustomDialogOptions,
} from '../types';

const openConfirmDialogInternal = (
  openDialog: (options: CustomDialogOptions) => Promise<ConfirmDialogActionId>,
  options: ConfirmDialogOptions = {}
) => {
  const actions: CustomDialogAction[] = [];

  if (!options.hideCancel) {
    const cancelAction: CustomDialogAction = {
      id: 'cancel',
      label: options.cancelLabel ?? 'Отмена',
      color: options.cancelColor ?? 'inherit',
      emphasize: options.cancelEmphasize ?? false,
      autoFocus: options.cancelAutoFocus ?? false,
    };

    if (options.onCancel) {
      cancelAction.handler = options.onCancel;
    }

    actions.push(cancelAction);
  }

  const confirmAction: CustomDialogAction = {
    id: 'confirm',
    label: options.confirmLabel ?? 'Подтвердить',
    color: options.confirmColor ?? 'error',
    emphasize: options.confirmEmphasize ?? true,
    autoFocus:
      options.confirmAutoFocus ??
      (options.hideCancel ? true : !options.cancelAutoFocus),
    disabled: options.confirmDisabled ?? false,
  };

  if (options.onConfirm) {
    confirmAction.handler = options.onConfirm;
  }

  actions.push(confirmAction);

  const dialogOptions: CustomDialogOptions = { actions };

  if (options.title !== undefined) {
    dialogOptions.title = options.title;
  }

  if (options.message !== undefined) {
    dialogOptions.message = options.message;
  }

  if (options.maxWidth !== undefined) {
    dialogOptions.maxWidth = options.maxWidth;
  }

  return openDialog(dialogOptions).then(actionId => actionId === 'confirm');
};

export const useConfirmDialog = () => {
  const { openDialog } = useContext(ConfirmDialogContext);

  const confirm = useCallback(
    (options: ConfirmDialogOptions = {}) =>
      openConfirmDialogInternal(openDialog, options),
    [openDialog]
  );

  return { confirm, openDialog };
};
