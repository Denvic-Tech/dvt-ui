import { useBeforeUnload } from 'react-router-dom';

import { useAppSelector } from '@/app/providers/store';

import { selectHasPendingGraphChanges } from './selectors';

export const useGraphUnsavedChangesGuard = () => {
  const hasPendingGraphChanges = useAppSelector(selectHasPendingGraphChanges);

  useBeforeUnload(event => {
    if (!hasPendingGraphChanges) {
      return;
    }

    event.preventDefault();
    event.returnValue = '';
  });
};
