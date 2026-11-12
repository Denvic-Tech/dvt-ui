export type ExclusiveConfirmRunner = (
  openConfirm: () => Promise<boolean>
) => Promise<boolean>;

/**
 * Keeps at most one confirmation open: a request that arrives while the
 * previous dialog is still pending resolves to `false` without opening a new
 * one (e.g. repeated Delete presses must not stack «Удалить элементы?»).
 */
export const createExclusiveConfirm = (): ExclusiveConfirmRunner => {
  let isPending = false;

  return async openConfirm => {
    if (isPending) {
      return false;
    }

    isPending = true;
    try {
      return await openConfirm();
    } finally {
      isPending = false;
    }
  };
};
