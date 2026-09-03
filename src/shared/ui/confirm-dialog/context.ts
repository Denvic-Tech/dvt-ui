import { createContext } from 'react';

import type { ConfirmDialogContextValue } from './types';

const throwMissingProvider = async (): Promise<never> => {
  throw new Error(
    'useConfirmDialog must be used within ConfirmDialogProvider.'
  );
};

export const ConfirmDialogContext = createContext<ConfirmDialogContextValue>({
  openDialog: throwMissingProvider,
});
