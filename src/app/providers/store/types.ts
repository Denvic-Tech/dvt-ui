import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from './rootReducer';

export type { RootState } from './rootReducer';

export type AppDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;
