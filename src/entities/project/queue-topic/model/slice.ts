import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { client } from '@/shared/gatewayClient';
import { QueueTopicState } from './types.ts';

export const fetchQueueTopics = createAsyncThunk(
  'queueTopic/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      // Путь /queue-topics соответствует роутеру в crud.py
      const response = await client.queueTopics.get();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch topics');
    }
  }
);

const initialState: QueueTopicState = {
  items: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

export const queueTopicSlice = createSlice({
  name: 'queueTopic',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchQueueTopics.pending, state => {
        state.isLoading = true;
      })
      .addCase(fetchQueueTopics.fulfilled, (state, action: any) => {
        state.isLoading = false;
        state.items = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchQueueTopics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const queueTopicReducer = queueTopicSlice.reducer;
