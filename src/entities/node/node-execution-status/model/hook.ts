import { useMemo } from 'react';
import { ExecutionStatus } from '@/shared/gatewayClient';
import { useAppSelector } from '@/app/providers/store';
import {
  makeNodeExecutionMessageSelector,
  makeNodeExecutionStatusSelector,
} from '@/entities/node/node-execution-status';

export const useNodeExecutionStatus = (nodeID: string): ExecutionStatus => {
  const selectNodeStatus = useMemo(makeNodeExecutionStatusSelector, []);
  return useAppSelector(state => selectNodeStatus(state, nodeID) || 'idle');
};

export const useNodeExecutionErrorMessage = (
  nodeID: string
): string | null | undefined => {
  const selectNodeMessage = useMemo(makeNodeExecutionMessageSelector, []);
  return useAppSelector(state => selectNodeMessage(state, nodeID));
};
