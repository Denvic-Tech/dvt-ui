import { useCallback, useContext } from 'react';

import { ConfirmDialogContext } from '../context';
import type {
  ConfirmDialogCheckbox,
  ConfirmDialogOptions,
  CustomDialogAction,
  CustomDialogOptions,
} from '../types';

const buildConfirmDialogOptions = (
  options: ConfirmDialogOptions
): CustomDialogOptions => {
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

  if (options.width !== undefined) {
    dialogOptions.width = options.width;
  }

  if (options.checkbox !== undefined) {
    dialogOptions.checkbox = options.checkbox;
  }

  return dialogOptions;
};

export const useConfirmDialog = () => {
  const { openDialog, openDialogWithResult } = useContext(ConfirmDialogContext);

  const confirm = useCallback(
    (options: ConfirmDialogOptions = {}) =>
      openDialog(buildConfirmDialogOptions(options)).then(
        actionId => actionId === 'confirm'
      ),
    [openDialog]
  );

  // A confirm with an option to switch on, e.g. «Удалить данные».
  const confirmWithCheckbox = useCallback(
    (options: ConfirmDialogOptions & { checkbox: ConfirmDialogCheckbox }) =>
      openDialogWithResult(buildConfirmDialogOptions(options)).then(result => ({
        confirmed: result.actionId === 'confirm',
        checked: result.checked,
      })),
    [openDialogWithResult]
  );

  return { confirm, confirmWithCheckbox, openDialog };
};
