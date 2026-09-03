export const SYSTEM_UPDATE_IN_PROGRESS_KEY = 'dvt-update-in-progress';

export const hasSystemUpdateMarker = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(SYSTEM_UPDATE_IN_PROGRESS_KEY) != null;
  } catch {
    return false;
  }
};

export const markSystemUpdateInProgress = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(SYSTEM_UPDATE_IN_PROGRESS_KEY, '1');
  } catch {
    // The in-memory state still keeps the current tab in update mode.
  }
};

export const clearSystemUpdateMarker = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(SYSTEM_UPDATE_IN_PROGRESS_KEY);
  } catch {
    // The current tab can still finish using the in-memory state.
  }
};
