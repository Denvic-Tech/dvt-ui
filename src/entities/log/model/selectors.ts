import { RootState } from '@/app/providers/store';

export const selectLogs = (state: RootState) => state.logs.logs;
