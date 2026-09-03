export interface QueueTopicColumn {
  name: string;
  dtype: string;
  nullable: boolean;
}

export interface QueueTopic {
  id: string;
  name: string;
  columns_schema: QueueTopicColumn[];
  created_at: string;
  updated_at: string;
}

export interface QueueTopicState {
  items: QueueTopic[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}