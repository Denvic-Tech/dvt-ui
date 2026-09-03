import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/providers/store';
import { fetchQueueTopics } from './slice.ts';
import {
  selectAllQueueTopics,
  selectQueueTopicLoading,
  selectQueueTopicById,
} from './selectors.ts';

export const useQueueTopics = () => {
  const dispatch = useAppDispatch();
  const topics = useAppSelector(selectAllQueueTopics);
  const isLoading = useAppSelector(selectQueueTopicLoading);

  const refresh = useCallback(() => {
    dispatch(fetchQueueTopics());
  }, [dispatch]);

  // Авто-загрузка при первом использовании, если данных еще нет
  useEffect(() => {
    if (topics.length === 0 && !isLoading) {
      refresh();
    }
  }, []);

  return {
    topics,
    isLoading,
    refresh,
    getTopicById: (id?: string | null) => topics.find(t => t.id === id),
  };
};
