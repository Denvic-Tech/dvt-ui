import type { RootState } from '@/app/providers/store/rootReducer';

export const selectSystemAvailability = (state: RootState) =>
  state.systemAvailability;

export const selectIsSystemUpdateKnown = (state: RootState): boolean =>
  state.systemAvailability.knownUpdate;

export const selectIsSystemAvailabilityBlocking = (
  state: RootState
): boolean => {
  const phase = state.systemAvailability.phase;

  return (
    state.systemAvailability.knownUpdate &&
    (phase === 'checking' || phase === 'updating' || phase === 'reconnecting')
  );
};
