// The store instance itself is intentionally not re-exported here: the barrel
// is imported by almost every slice hook, and re-exporting `store` from it
// would create a runtime cycle (store -> rootReducer -> entity -> this barrel)
// that breaks execution order once the app is split into chunks.
// Import it from '@/app/providers/store/store' when you really need it.
export { createAppAsyncThunk } from './helpers';
export { useAppDispatch, useAppSelector } from './hooks';
export { type AppDispatch, type RootState } from './types';
