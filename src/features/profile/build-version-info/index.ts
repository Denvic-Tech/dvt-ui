export { buildVersionApi } from './api';

export {
  type BuildVersionState,
  fetchBuildVersion,
  buildVersionReducer,
  buildVersionActions,
} from './model/slice.ts';

export {
  selectBuildVersionState,
  selectBuildVersionIsLoading,
  selectBuildVersionError,
} from './model/selectors.ts';

export { useBuildVersion } from './model/hook.ts';

export { BuildVersionInfo } from './ui/BuildVersionInfo.tsx';
