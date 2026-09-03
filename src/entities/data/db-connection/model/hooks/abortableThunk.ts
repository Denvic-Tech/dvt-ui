export const linkAbortSignalToThunkPromise = <T extends { abort: () => void }>(
  thunkPromise: T,
  signal?: AbortSignal
) => {
  if (!signal) {
    return thunkPromise;
  }

  if (signal.aborted) {
    thunkPromise.abort();
    return thunkPromise;
  }

  const abort = () => thunkPromise.abort();
  signal.addEventListener('abort', abort, { once: true });

  return thunkPromise;
};
