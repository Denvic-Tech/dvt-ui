import { RootState } from '@/app/providers/store';
import { createSelector } from '@reduxjs/toolkit';

export const selectNodeExecutionStatusByNodeID = (state: RootState) =>
  state.nodeExecutionStatus.statusByID;

export const selectNodeExecutionMessageByNodeID = (state: RootState) =>
  state.nodeExecutionStatus.messageByID;

export const makeNodeExecutionStatusSelector = () =>
  createSelector(
    [
      selectNodeExecutionStatusByNodeID,
      (_: RootState, nodeID: string) => nodeID,
    ],
    (statusByID, nodeID) => statusByID[nodeID]
  );

export const makeNodeExecutionMessageSelector = () =>
  createSelector(
    [
      selectNodeExecutionMessageByNodeID,
      (_: RootState, nodeID: string) => nodeID,
    ],
    (messageByID, nodeID) => messageByID[nodeID]
  );
