import type { RootState } from '@/app/providers/store';

export const selectMcpTokenState = (state: RootState) => state.mcpTokens;
export const selectMcpTokens = (state: RootState) =>
  selectMcpTokenState(state).items;
export const selectMcpTokensStatus = (state: RootState) =>
  selectMcpTokenState(state).status;
export const selectMcpTokensError = (state: RootState) =>
  selectMcpTokenState(state).error;
export const selectMcpTokenCreationStatus = (state: RootState) =>
  selectMcpTokenState(state).creationStatus;
export const selectMcpTokenCreatedSecret = (state: RootState) =>
  selectMcpTokenState(state).createdSecret;
export const selectMcpTokenDeletionStatus = (state: RootState) =>
  selectMcpTokenState(state).deletionStatus;
