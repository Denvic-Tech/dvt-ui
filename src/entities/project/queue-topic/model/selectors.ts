import { RootState } from '@/app/providers/store';

export const selectQueueTopicsState = (state: RootState) => state.queueTopic;
export const selectAllQueueTopics = (state: RootState) => state.queueTopic.items;
export const selectQueueTopicLoading = (state: RootState) => state.queueTopic.isLoading;

// Мемоизированный селектор для поиска конкретного топика по ID
export const selectQueueTopicById = (state: RootState, id?: string | null) =>
  state.queueTopic.items.find(topic => topic.id === id);