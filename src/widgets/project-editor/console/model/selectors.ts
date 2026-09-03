import { createSelector } from '@reduxjs/toolkit';

import { RootState } from '@/app/providers/store';

import { selectLogs } from '@/entities/log';

export const filterLogsBySearchTerm = (
  logs: ReturnType<typeof selectLogs>,
  searchTerm: string | null
) => {
  if (!logs) return [];

  const searchTrim = searchTerm?.trim().toLowerCase() ?? null;
  if (!searchTrim) return logs;

  return logs.filter(
    log =>
      log.message.toLowerCase().includes(searchTrim) ||
      log.service_name.toLowerCase().includes(searchTrim) ||
      (log.logger_name
        ? log.logger_name.toLowerCase().includes(searchTrim)
        : true) ||
      (log.module ? log.module.toLowerCase().includes(searchTrim) : true) ||
      (log.function ? log.function.toLowerCase().includes(searchTrim) : true) ||
      log.level.toLowerCase().includes(searchTrim)
  );
};

export const selectFilteredLogs = createSelector(
  [selectLogs, (_state: RootState, searchTerm: string | null) => searchTerm],
  filterLogsBySearchTerm
);
