import {
  type AsyncThunkOptions,
  type AsyncThunkPayloadCreator,
  createAsyncThunk,
  type GetThunkAPI,
} from '@reduxjs/toolkit';

import type { ApiErrorPayload } from '@/shared/lib/errors';
import { isApiError } from '@/shared/lib/errors';

import type { RootState } from './rootReducer';

interface ThunkConfig {
  state: RootState;
  rejectValue: ApiErrorPayload;
}

type UnknownErrorMapper<ThunkArg, Returned> = (params: {
  arg: ThunkArg;
  error: unknown;
  thunkApi: GetThunkAPI<ThunkConfig>;
}) => ApiErrorPayload | undefined;

interface CreateAppAsyncThunkOptions<
  ThunkArg,
  Returned,
> extends AsyncThunkOptions<ThunkArg, ThunkConfig> {
  handleRejection?: boolean;
  mapUnknownError?: UnknownErrorMapper<ThunkArg, Returned>;
}

export type AppAsyncThunkConfig = ThunkConfig;

const baseCreateAsyncThunk = createAsyncThunk.withTypes<ThunkConfig>();

export const createAppAsyncThunk = <Returned, ThunkArg = void>(
  typePrefix: string,
  payloadCreator: AsyncThunkPayloadCreator<Returned, ThunkArg, ThunkConfig>,
  options?: CreateAppAsyncThunkOptions<ThunkArg, Returned>
) => {
  const {
    handleRejection = true,
    mapUnknownError,
    ...asyncOptions
  } = options ?? {};

  const shouldWrap = handleRejection || Boolean(mapUnknownError);

  const wrappedPayloadCreator = (async (
    arg: ThunkArg,
    thunkApi: GetThunkAPI<ThunkConfig>
  ) => {
    try {
      const result = await payloadCreator(arg, thunkApi);
      return result;
    } catch (error) {
      if (handleRejection && isApiError(error)) {
        return thunkApi.rejectWithValue(error.toPayload());
      }

      if (mapUnknownError) {
        const fallback = mapUnknownError({ arg, error, thunkApi });
        if (fallback) {
          return thunkApi.rejectWithValue(fallback);
        }
      }

      throw error;
    }
  }) as AsyncThunkPayloadCreator<Returned, ThunkArg, ThunkConfig>;

  const effectivePayloadCreator = shouldWrap
    ? wrappedPayloadCreator
    : payloadCreator;

  return baseCreateAsyncThunk<Returned, ThunkArg>(
    typePrefix,
    effectivePayloadCreator,
    asyncOptions
  );
};
