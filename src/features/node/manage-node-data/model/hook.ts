import { useCallback, useMemo } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import { nodeMetadataActions } from '@/entities/node/node-metadata';
import { graphActions } from '@/entities/project-editor/graph';
import { makeNodeDataByIDSelector } from '@/entities/project-editor/graph/model/selectors.ts';

import { NodeInputValue } from '@/shared/gatewayClient';
import {
  makeConst,
  makeVariableExpressionValue,
} from '@/shared/lib/node-input-values';

export const useNodeData = (nodeID: string | null | undefined) => {
  const dispatch = useAppDispatch();

  const selectNodeDataByID = useMemo(makeNodeDataByIDSelector, []);
  const nodeData = useAppSelector(state => selectNodeDataByID(state, nodeID));

  const updateDisplayName = useCallback(
    (displayName: string) => {
      if (!nodeID) return;
      dispatch(graphActions.updateDisplayName({ nodeID, displayName }));
    },
    [dispatch, nodeID]
  );
  const updateComment = useCallback(
    (comment: string) => {
      if (!nodeID) return;
      dispatch(graphActions.updateComment({ nodeID, comment }));
    },
    [dispatch, nodeID]
  );
  const updateStoreEnabled = useCallback(
    (storeEnabled: boolean) => {
      if (!nodeID) return;
      dispatch(graphActions.updateStoreEnabled({ nodeID, storeEnabled }));
    },
    [dispatch, nodeID]
  );
  const updateShowSignalIo = useCallback(
    (showSignalIo: boolean) => {
      if (!nodeID) return;
      dispatch(graphActions.updateShowSignalIo({ nodeID, showSignalIo }));
    },
    [dispatch, nodeID]
  );
  const updateShowVariablesIo = useCallback(
    (showVariablesIo: boolean) => {
      if (!nodeID) return;
      dispatch(graphActions.updateShowVariablesIo({ nodeID, showVariablesIo }));
    },
    [dispatch, nodeID]
  );
  const updateInputValue = useCallback(
    (inputName: string, value: NodeInputValue) => {
      if (!nodeID) return;
      dispatch(graphActions.updateInputValue({ nodeID, inputName, value }));
      dispatch(
        nodeMetadataActions.setNodeMetadataActuality({ nodeID, actual: false })
      );
    },
    [dispatch, nodeID]
  );
  const updateInputValues = useCallback(
    (inputValues: { [inputName: string]: NodeInputValue }) => {
      if (!nodeID) return;
      dispatch(graphActions.updateInputValues({ nodeID, inputValues }));
      dispatch(
        nodeMetadataActions.setNodeMetadataActuality({ nodeID, actual: false })
      );
    },
    [dispatch, nodeID]
  );
  const replaceInputValues = useCallback(
    (inputValues: { [inputName: string]: NodeInputValue }) => {
      if (!nodeID) return;
      dispatch(graphActions.replaceInputValues({ nodeID, inputValues }));
      dispatch(
        nodeMetadataActions.setNodeMetadataActuality({ nodeID, actual: false })
      );
    },
    [dispatch, nodeID]
  );
  const updateInputValueWithVariable = useCallback(
    (inputName: string, name: string) => {
      if (!nodeID) return;
      dispatch(
        graphActions.updateInputValue({
          nodeID,
          inputName,
          value: makeVariableExpressionValue(name),
        })
      );
      dispatch(
        nodeMetadataActions.setNodeMetadataActuality({ nodeID, actual: false })
      );
    },
    [dispatch, nodeID]
  );
  const updateInputValueWithConstant = useCallback(
    (inputName: string, value: unknown) => {
      if (!nodeID) return;
      dispatch(
        graphActions.updateInputValue({
          nodeID,
          inputName,
          value: makeConst(value),
        })
      );
      dispatch(
        nodeMetadataActions.setNodeMetadataActuality({ nodeID, actual: false })
      );
    },
    [dispatch, nodeID]
  );

  return {
    nodeData,
    updateDisplayName,
    updateComment,
    updateStoreEnabled,
    updateShowSignalIo,
    updateShowVariablesIo,
    updateInputValue,
    updateInputValues,
    replaceInputValues,
    updateInputValueWithVariable,
    updateInputValueWithConstant,
  };
};
