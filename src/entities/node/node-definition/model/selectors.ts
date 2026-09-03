import { createSelector } from '@reduxjs/toolkit';

import { RootState } from '@/app/providers/store';

import { type NodeDefinitionSliceState } from './slice.ts';
import { type NodeDefinition } from '@/shared/gatewayClient';

export const selectNodeDefinitionState = (
  state: RootState
): NodeDefinitionSliceState => state.nodeDefinition;

export const selectNodeDefinitionsMap = (
  state: RootState
): { [nodeName: string]: NodeDefinition } =>
  state.nodeDefinition.nodesDefinitionsMap;

export const selectNodeDefinitionsStatus = (
  state: RootState
): NodeDefinitionSliceState['status'] => state.nodeDefinition.status;

export const selectNodeDefinitionLoading = (state: RootState): boolean =>
  state.nodeDefinition.status === 'loading';

export const selectNodeDefinitionError = (
  state: RootState
): NodeDefinitionSliceState['error'] => state.nodeDefinition.error;

export const selectNodeDefinitionByName = createSelector(
  [selectNodeDefinitionsMap, (_state: RootState, nodeName: string) => nodeName],
  (nodesMap, nodeName) => nodesMap[nodeName]
);

export const makeSelectNodeDefinitionByName = () =>
  createSelector(
    [selectNodeDefinitionsMap, (_: RootState, nodeName: string) => nodeName],
    (nodesMap, nodeName) => nodesMap[nodeName]
  );
