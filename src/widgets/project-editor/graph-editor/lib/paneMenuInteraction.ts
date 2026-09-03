export const isSecondaryMouseButtonEvent = (event: unknown): boolean => {
  if (typeof event !== 'object' || event === null) {
    return false;
  }

  const eventLike = event as {
    button?: unknown;
    nativeEvent?: {
      button?: unknown;
    } | null;
  };
  const nativeButton = eventLike.nativeEvent?.button;
  if (typeof nativeButton === 'number') {
    return nativeButton === 2;
  }

  return eventLike.button === 2;
};
