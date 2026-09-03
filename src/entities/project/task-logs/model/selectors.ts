import type { RootState } from '@/app/providers/store';

export const selectTaskLogsState = (state: RootState) => state.taskLogs;
