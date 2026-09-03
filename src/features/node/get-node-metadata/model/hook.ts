import { useMemo } from 'react';
import { createSelector } from '@reduxjs/toolkit';

import { useAppSelector } from '@/app/providers/store';

import {
  makeMetadataActualityByNodeIDSelector,
  makeMetadataByNodeIDSelector,
} from '@/entities/node/node-metadata';
import { Input } from '@/entities/project-editor/graph';
import { selectGraphInputs } from '@/entities/project-editor/graph/model/selectors';

import type { NodeMetadata } from '@/shared/gatewayClient';

type NodeOutputMetadata = Exclude<NodeMetadata[string], null>;

interface ConnectedNodeMetadataResult {
  connectedNodeMetadataByInput: {
    [inputName: string]: NodeOutputMetadata;
  } | null;
  connectedNodeMetadataActualityByInput: {
    [inputName: string]: boolean;
  } | null;
}

const EMPTY_METADATA_BY_INPUT: {
  [connectedNodeID: string]: NodeOutputMetadata;
} | null = null;
const EMPTY_METADATA_ACTUALITY_BY_INPUT: {
  [connectedNodeID: string]: boolean;
} | null = null;
const EMPTY_CONNECTED_METADATA_RESULT: ConnectedNodeMetadataResult = {
  connectedNodeMetadataByInput: EMPTY_METADATA_BY_INPUT,
  connectedNodeMetadataActualityByInput: EMPTY_METADATA_ACTUALITY_BY_INPUT,
};

export const useNodeMetadata = (nodeID: string | null | undefined) => {
  const nodeMetadataSelector = useMemo(makeMetadataByNodeIDSelector, []);
  const nodeMetadataActualitySelector = useMemo(
    makeMetadataActualityByNodeIDSelector,
    []
  );

  const nodeMetadata = useAppSelector(state =>
    nodeID ? nodeMetadataSelector(state, nodeID) : null
  );
  const nodeMetadataActuality = useAppSelector(state =>
    nodeID ? nodeMetadataActualitySelector(state, nodeID) : null
  );

  return {
    nodeMetadata,
    nodeMetadataActuality,
  };
};

export const useConnectedNodeMetadata = (nodeID: string | null | undefined) => {
  const connectedMetadataSelector = useMemo(
    () =>
      createSelector(
        [
          selectGraphInputs,
          (state: Parameters<typeof selectGraphInputs>[0]) =>
            state.nodeMetadata.nodeMetadataByID,
          (state: Parameters<typeof selectGraphInputs>[0]) =>
            state.nodeMetadata.nodeMetadataActuality,
          (
            _state: Parameters<typeof selectGraphInputs>[0],
            nodeID: string | null | undefined
          ) => nodeID,
        ],
        (
          inputsByTargetNodeID,
          metadataByID,
          metadataActualityByID,
          targetNodeID
        ): ConnectedNodeMetadataResult => {
          const connectedInputs = targetNodeID
            ? inputsByTargetNodeID[targetNodeID]
            : null;
          if (!connectedInputs) {
            return EMPTY_CONNECTED_METADATA_RESULT;
          }

          const metadataByInput: {
            [inputName: string]: NodeOutputMetadata;
          } = {};
          const metadataActualityByInput: { [inputName: string]: boolean } = {};
          let hasMetadataEntries = false;
          let metadataActualityCount = 0;

          for (const inputName in connectedInputs) {
            if (
              !Object.prototype.hasOwnProperty.call(connectedInputs, inputName)
            ) {
              continue;
            }

            const connection: Input = connectedInputs[inputName];
            const sourceNodeID = connection.nodeID;
            const outputName = connection.outputName;

            const metadata = metadataByID[sourceNodeID]?.[outputName];
            if (metadata != null) {
              metadataByInput[inputName] = metadata;
            }
            hasMetadataEntries = hasMetadataEntries || metadata != null;

            metadataActualityByInput[inputName] =
              metadataActualityByID[sourceNodeID] ?? true;
            metadataActualityCount += 1;
          }

          return {
            connectedNodeMetadataByInput: hasMetadataEntries
              ? metadataByInput
              : EMPTY_METADATA_BY_INPUT,
            connectedNodeMetadataActualityByInput:
              metadataActualityCount > 0
                ? metadataActualityByInput
                : EMPTY_METADATA_ACTUALITY_BY_INPUT,
          };
        }
      ),
    []
  );

  const {
    connectedNodeMetadataByInput,
    connectedNodeMetadataActualityByInput,
  } = useAppSelector(state => connectedMetadataSelector(state, nodeID));

  const allConnectedNodeMetadataActual = useMemo(() => {
    if (
      !connectedNodeMetadataActualityByInput ||
      Object.values(connectedNodeMetadataActualityByInput).length === 0
    ) {
      return true;
    }
    return Object.values(connectedNodeMetadataActualityByInput).every(Boolean);
  }, [connectedNodeMetadataActualityByInput]);

  const actualConnectedNodeMetadataByInput = useMemo(() => {
    if (!connectedNodeMetadataByInput) {
      return null;
    }

    const actualEntries = Object.entries(connectedNodeMetadataByInput).filter(
      ([inputName]) =>
        connectedNodeMetadataActualityByInput?.[inputName] !== false
    );

    return actualEntries.length > 0
      ? Object.fromEntries(actualEntries)
      : EMPTY_METADATA_BY_INPUT;
  }, [connectedNodeMetadataActualityByInput, connectedNodeMetadataByInput]);

  return {
    connectedNodeMetadataByInput: actualConnectedNodeMetadataByInput,
    actualConnectedNodeMetadataByInput,
    connectedNodeMetadataActualityByInput,
    allConnectedNodeMetadataActual,
  };
};
