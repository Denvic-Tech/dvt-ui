import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ConfirmDialog,
  type ConfirmDialogActionId,
  type ConfirmDialogCheckbox,
  ConfirmDialogContext,
  type ConfirmDialogContextValue,
  type ConfirmDialogMaxWidth,
  type ConfirmDialogResult,
  type CustomDialogAction,
  type CustomDialogOptions,
} from '@/shared/ui/confirm-dialog';

interface DialogRequest {
  actions: CustomDialogAction[];
  checkbox: ConfirmDialogCheckbox | undefined;
  maxWidth: ConfirmDialogMaxWidth;
  width: number;
  message: string;
  requestId: number;
  resolve: (result: ConfirmDialogResult) => void;
  reject: (reason?: unknown) => void;
  title: string;
}

const UNMOUNT_REJECT_REASON = new Error(
  'Confirm dialog provider was unmounted before the request resolved.'
);

const getFallbackActionId = (request: DialogRequest) =>
  request.actions.find(action => action.id === 'cancel')?.id ??
  request.actions[request.actions.length - 1]?.id;

const normalizeDialogRequest = (
  options: CustomDialogOptions,
  requestId: number,
  resolve: (result: ConfirmDialogResult) => void,
  reject: (reason?: unknown) => void
): DialogRequest => ({
  requestId,
  resolve,
  reject,
  title: options.title ?? 'Подтвердите действие',
  message: options.message ?? '',
  maxWidth: options.maxWidth ?? 'xs',
  width: options.width ?? 320,
  checkbox: options.checkbox,
  actions: options.actions,
});

export const ConfirmDialogProvider = ({ children }: PropsWithChildren) => {
  const queueRef = useRef<DialogRequest[]>([]);
  const activeRequestRef = useRef<DialogRequest | null>(null);
  const isResolvingRef = useRef(false);
  const nextRequestIdRef = useRef(0);

  const [activeRequest, setActiveRequest] = useState<DialogRequest | null>(
    null
  );
  const [isResolving, setIsResolving] = useState(false);
  // Read by handleAction, which may run before a re-render.
  const checkedRef = useRef(false);
  const [checked, setChecked] = useState(false);

  const updateChecked = useCallback((value: boolean) => {
    checkedRef.current = value;
    setChecked(value);
  }, []);

  const showRequest = useCallback(
    (request: DialogRequest | null) => {
      activeRequestRef.current = request;
      setActiveRequest(request);
      if (request) {
        updateChecked(request.checkbox?.defaultChecked ?? false);
      }
    },
    [updateChecked]
  );

  const activateNextRequest = useCallback(() => {
    showRequest(queueRef.current.shift() ?? null);
  }, [showRequest]);

  const settleCurrentRequest = useCallback(() => {
    isResolvingRef.current = false;
    setIsResolving(false);
    activateNextRequest();
  }, [activateNextRequest]);

  const openDialogWithResult = useCallback(
    (options: CustomDialogOptions) =>
      new Promise<ConfirmDialogResult>((resolve, reject) => {
        const request = normalizeDialogRequest(
          options,
          ++nextRequestIdRef.current,
          resolve,
          reject
        );

        if (activeRequestRef.current) {
          queueRef.current.push(request);
          return;
        }

        showRequest(request);
      }),
    [showRequest]
  );

  const openDialog = useCallback(
    (options: CustomDialogOptions) =>
      openDialogWithResult(options).then(result => result.actionId),
    [openDialogWithResult]
  );

  const handleAction = useCallback(
    async (actionId: ConfirmDialogActionId) => {
      if (isResolvingRef.current) {
        return;
      }

      const request = activeRequestRef.current;
      if (!request) {
        return;
      }

      const selectedAction = request.actions.find(
        action => action.id === actionId
      );

      isResolvingRef.current = true;
      setIsResolving(true);

      try {
        await selectedAction?.handler?.();
        request.resolve({ actionId, checked: checkedRef.current });
      } catch (error) {
        request.reject(error);
        console.error('Ошибка при обработке confirm dialog action', error);
      } finally {
        settleCurrentRequest();
      }
    },
    [settleCurrentRequest]
  );

  const handleClose = useCallback(() => {
    if (isResolvingRef.current) {
      return;
    }

    const request = activeRequestRef.current;
    if (!request) {
      return;
    }

    const fallbackActionId = getFallbackActionId(request);

    if (!fallbackActionId) {
      request.reject(
        new Error('Confirm dialog was closed without any available action.')
      );
      settleCurrentRequest();
      return;
    }

    void handleAction(fallbackActionId);
  }, [handleAction, settleCurrentRequest]);

  useEffect(
    () => () => {
      activeRequestRef.current?.reject(UNMOUNT_REJECT_REASON);
      queueRef.current.forEach(request =>
        request.reject(UNMOUNT_REJECT_REASON)
      );
      queueRef.current = [];
      activeRequestRef.current = null;
      isResolvingRef.current = false;
    },
    []
  );

  const contextValue = useMemo<ConfirmDialogContextValue>(
    () => ({
      openDialog,
      openDialogWithResult,
    }),
    [openDialog, openDialogWithResult]
  );

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}
      <ConfirmDialog
        open={Boolean(activeRequest)}
        title={activeRequest?.title ?? ''}
        message={activeRequest?.message ?? ''}
        actions={activeRequest?.actions ?? []}
        maxWidth={activeRequest?.maxWidth ?? 'xs'}
        width={activeRequest?.width ?? 320}
        checkbox={activeRequest?.checkbox}
        checked={checked}
        onCheckedChange={updateChecked}
        onAction={actionId => {
          void handleAction(actionId);
        }}
        onClose={handleClose}
        busy={isResolving}
      />
    </ConfirmDialogContext.Provider>
  );
};
