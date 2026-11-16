export type ConfirmDialogMaxWidth = 'xs' | 'sm' | 'md';

export type ConfirmDialogActionId = 'confirm' | 'cancel' | string;

export interface ConfirmDialogActionConfig {
  id: ConfirmDialogActionId;
  label: string;
  color?: 'primary' | 'error' | 'inherit';
  autoFocus?: boolean;
  emphasize?: boolean;
  disabled?: boolean;
}

// An option the user can switch on before confirming, e.g. «Удалить данные».
export interface ConfirmDialogCheckbox {
  label: string;
  defaultChecked?: boolean;
  // Shown under the checkbox while it is checked: what the option will do.
  checkedWarning?: string;
}

export interface ConfirmDialogResult {
  actionId: ConfirmDialogActionId;
  // The checkbox state at the moment of the action; false without a checkbox.
  checked: boolean;
}

export interface ConfirmDialogOptions {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: 'primary' | 'error' | 'inherit';
  cancelColor?: 'primary' | 'error' | 'inherit';
  confirmEmphasize?: boolean;
  cancelEmphasize?: boolean;
  confirmAutoFocus?: boolean;
  cancelAutoFocus?: boolean;
  hideCancel?: boolean;
  confirmDisabled?: boolean;
  maxWidth?: ConfirmDialogMaxWidth;
  /** Explicit dialog width in pixels; defaults to 320. */
  width?: number;
  checkbox?: ConfirmDialogCheckbox;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
}

export interface CustomDialogAction extends ConfirmDialogActionConfig {
  handler?: () => void | Promise<void>;
}

export interface CustomDialogOptions {
  title?: string;
  message?: string;
  maxWidth?: ConfirmDialogMaxWidth;
  /** Explicit dialog width in pixels; defaults to 320. */
  width?: number;
  checkbox?: ConfirmDialogCheckbox;
  actions: CustomDialogAction[];
}

export interface ConfirmDialogContextValue {
  openDialog: (options: CustomDialogOptions) => Promise<ConfirmDialogActionId>;
  // Same as openDialog, but also reports the checkbox state.
  openDialogWithResult: (
    options: CustomDialogOptions
  ) => Promise<ConfirmDialogResult>;
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  actions: ConfirmDialogActionConfig[];
  maxWidth: ConfirmDialogMaxWidth;
  width?: number;
  checkbox?: ConfirmDialogCheckbox | undefined;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onAction: (actionId: ConfirmDialogActionId) => void;
  onClose: () => void;
  onExited?: () => void;
  busy?: boolean;
}
