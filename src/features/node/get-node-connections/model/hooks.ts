import { useCallback, useMemo } from 'react';

import { useAppSelector } from '@/app/providers/store';

import { makeConnectedMetadataByInputNameSelector } from '@/entities/node/node-metadata';
import {
  Input,
  makeConnectedInputsByNodeIDSelector,
  makeConnectedOutputsByNodeIDSelector,
  Output,
  selectInputValues,
} from '@/entities/project-editor/graph';

import type { NodeMetadata } from '@/shared/gatewayClient';
import type { NodeInputValuesMap } from '@/shared/lib/node-input-values';

export const useNodeConnections = (nodeID: string | null) => {
  const selectConnectedInputs = useMemo(
    makeConnectedInputsByNodeIDSelector,
    []
  );
  const connectedInputs: { [inputName: string]: Input } | null = useAppSelector(
    state => (nodeID ? selectConnectedInputs(state, nodeID) : null)
  );

  const selectConnectedOutputs = useMemo(
    makeConnectedOutputsByNodeIDSelector,
    []
  );
  const connectedOutputs: { [outputName: string]: Output } | null =
    useAppSelector(state =>
      nodeID ? selectConnectedOutputs(state, nodeID) : null
    );

  const connectedParentNodeIDs: string[] | null = useMemo(
    () =>
      connectedInputs
        ? Object.values(connectedInputs).map(input => input.nodeID)
        : null,
    [connectedInputs]
  );

  const inputValues: NodeInputValuesMap | null = useAppSelector(state =>
    nodeID ? selectInputValues(state, nodeID) : null
  );

  const connectedNodesIDByInputName: { [inputName: string]: string } | null =
    useMemo(
      () =>
        connectedInputs
          ? Object.fromEntries(
              Object.entries(connectedInputs).map(([inputName, input]) => [
                inputName,
                input.nodeID,
              ])
            )
          : null,
      [connectedInputs]
    );

  const connectedMetadataSelector = useMemo(
    () => makeConnectedMetadataByInputNameSelector(),
    []
  );

  const connectedMetadataByInputName: NodeMetadata | null = useAppSelector(
    state =>
      connectedInputs ? connectedMetadataSelector(state, connectedInputs) : null
  );

  const getConnectedInputMetadata = useCallback(
    (inputName: string) =>
      connectedMetadataByInputName
        ? connectedMetadataByInputName[inputName] || null
        : null,
    [connectedMetadataByInputName]
  );

  const getConnectedInputNodeID = useCallback(
    (inputName: string) =>
      connectedNodesIDByInputName
        ? connectedNodesIDByInputName[inputName] || null
        : null,
    [connectedNodesIDByInputName]
  );

  return {
    connectedInputs,
    connectedOutputs,

    connectedParentNodeIDs,

    inputValues,

    connectedMetadataByInputName,

    getConnectedInputMetadata,
    getConnectedInputNodeID,
  };
};
