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
  actions: CustomDialogAction[];
}

export interface ConfirmDialogContextValue {
  openDialog: (options: CustomDialogOptions) => Promise<ConfirmDialogActionId>;
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  actions: ConfirmDialogActionConfig[];
  maxWidth: ConfirmDialogMaxWidth;
  onAction: (actionId: ConfirmDialogActionId) => void;
  onClose: () => void;
  onExited?: () => void;
  busy?: boolean;
}
