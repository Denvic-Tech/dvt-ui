import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, Box, Typography } from '@mui/material';
import equal from 'fast-deep-equal';

import {
  type NodeModalPresentationConfig,
  useNodeModalExtensions,
  useNodeModalStepperExtensions,
  useNodeVariableGroups,
} from '@/app/providers/node-extensions';

import { useNodeConnections } from '@/features/node/get-node-connections';
import { useNodeDefinition } from '@/features/node/get-node-definition';
import {
  useConnectedNodeMetadata,
  useNodeMetadata,
} from '@/features/node/get-node-metadata';
import { useNodeData } from '@/features/node/manage-node-data';
import { validateNodeData } from '@/features/node/validate-node';
import { useSelectNode } from '@/features/project-editor/select-node';
import { useNodeDataModalUI } from '@/features/ui-layout';

import { useNodeDocumentationViewer } from '@/entities/node/node-documentation-viewer';
import {
  requiresConnectedNodeMetadata,
  shouldCheckInputConnection,
} from '@/entities/node/node-io';
import { useCurrentProject } from '@/entities/project/projects';

import type { NodeInputValue } from '@/shared/gatewayClient';
import { callMaybeAsync } from '@/shared/lib/async';
import {
  isConst,
  isInputValue,
  unwrapInputValues,
  wrapConstInputValues,
} from '@/shared/lib/node-input-values';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';

import { CommentSection, CommentTrigger } from './CommentSection';
import { EditorSkeleton } from './EditorSkeleton';
import { ExtensionEditorProxy } from './ExtensionEditorProxy';
import { buildBeforeFinishInputValues, canCommitStepperFinish } from './finish';
import { Footer } from './Footer';
import { Header } from './Header';
import { NodeDataModalDialog } from './NodeDataModalDialog';
import { NodeDefaultEditor } from './NodeDefaultEditor';
import { NodeModalStepperRenderer } from './StepperModalRenderer';
import { AlertsContainer, Body, BodyContent } from './styles';
import { AnyDict, IsValid, Setter, StepperBeforeFinishHandler } from './types';

interface NodeDataModalContentProps {
  editorSubtitle: string;
  editorTitle: string;
  extensionName: string | null;
  getConnectedInputMetadata: ReturnType<
    typeof useNodeConnections
  >['getConnectedInputMetadata'];
  handleSave: () => Promise<void>;
  handleStepperSave: (
    beforeFinish?: StepperBeforeFinishHandler<AnyDict>
  ) => Promise<void>;
  isCommentOpen: boolean;
  isDirty: boolean;
  isMetadataLoading: boolean;
  localInputData: AnyDict;
  nodeData: NonNullable<ReturnType<typeof useNodeData>['nodeData']>;
  nodeDefinition: NonNullable<ReturnType<typeof useNodeDefinition>>;
  nodeModalExtensions: ReturnType<typeof useNodeModalExtensions>;
  nodeModalStepperExtensions: ReturnType<typeof useNodeModalStepperExtensions>;
  onClose: () => void;
  projectID: string;
  selectedNodeID: string;
  setIsCommentOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setLocalInputData: Setter<AnyDict>;
  openDocumentation: () => void;
  setValidationCallback: React.Dispatch<
    React.SetStateAction<(() => IsValid) | undefined>
  >;
  setValidationErrors: React.Dispatch<
    React.SetStateAction<Record<string, string[]>>
  >;
  uiIsOpen: boolean;
  updateComment: ReturnType<typeof useNodeData>['updateComment'];
  updateDisplayName: ReturnType<typeof useNodeData>['updateDisplayName'];
  updateInputValue: ReturnType<typeof useNodeData>['updateInputValue'];
  updateInputValues: ReturnType<typeof useNodeData>['updateInputValues'];
  validationErrors: Record<string, string[]>;
  variables: ReturnType<typeof useNodeVariableGroups>['variables'];
  inputVariables: ReturnType<typeof useNodeVariableGroups>['inputVariables'];
  projectVariables: ReturnType<
    typeof useNodeVariableGroups
  >['projectVariables'];
  warnings: string[];
  nodeOutputMetadata: ReturnType<typeof useNodeMetadata>['nodeMetadata'];
  nodeMetadataActuality: ReturnType<
    typeof useNodeMetadata
  >['nodeMetadataActuality'];
}

const NodeDataModalContent = memo<NodeDataModalContentProps>(
  ({
    editorSubtitle,
    editorTitle,
    extensionName,
    getConnectedInputMetadata,
    handleSave,
    handleStepperSave,
    isCommentOpen,
    isDirty,
    isMetadataLoading,
    localInputData,
    nodeData,
    nodeDefinition,
    nodeModalExtensions,
    nodeModalStepperExtensions,
    onClose,
    openDocumentation,
    projectID,
    selectedNodeID,
    setIsCommentOpen,
    setLocalInputData,
    setValidationCallback,
    setValidationErrors,
    uiIsOpen,
    updateComment,
    updateDisplayName,
    updateInputValue,
    updateInputValues,
    validationErrors,
    variables,
    inputVariables,
    projectVariables,
    warnings,
    nodeOutputMetadata,
    nodeMetadataActuality,
  }) => {
    const presentation: NodeModalPresentationConfig =
      nodeModalStepperExtensions.length > 0 || extensionName
        ? { type: 'fluid' }
        : nodeModalExtensions.length > 0
          ? (nodeModalExtensions[0].presentation ?? { type: 'fluid' })
          : { type: 'centered', contentWidth: 'regular' };

    return (
      <>
        <Header
          title={editorTitle}
          subtitle={editorSubtitle}
          commentTrigger={
            <CommentTrigger
              value={nodeData.comment ?? ''}
              onClick={() => setIsCommentOpen(true)}
            />
          }
          onOpenDocumentation={
            nodeDefinition.documentation_available ? openDocumentation : null
          }
          onClose={onClose}
          onChangeTitle={updateDisplayName}
        />

        {(Object.keys(validationErrors).length > 0 || warnings.length > 0) && (
          <AlertsContainer>
            {Object.keys(validationErrors).length > 0 && (
              <Alert severity='error'>
                <Typography fontWeight={600} mb={0.5}>
                  Validation Errors
                </Typography>
                {Object.entries(validationErrors).map(([f, errs]) => (
                  <Box key={f}>
                    <strong>{f}:</strong>
                    <ul>
                      {errs.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </Box>
                ))}
              </Alert>
            )}

            {warnings.length > 0 && (
              <Alert severity='warning'>
                <Typography fontWeight={600} mb={0.5}>
                  Warnings
                </Typography>
                <ul>
                  {warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </Alert>
            )}
          </AlertsContainer>
        )}

        <Body presentationType={presentation.type}>
          <BodyContent
            presentationType={presentation.type}
            {...(presentation.type === 'centered'
              ? { contentWidth: presentation.contentWidth }
              : {})}
          >
            {isMetadataLoading ? (
              <EditorSkeleton />
            ) : extensionName ? (
              <ExtensionEditorProxy
                isOpen={uiIsOpen}
                projectID={projectID}
                id={selectedNodeID}
                data={nodeData}
                nodeDefinition={nodeDefinition}
                localInputData={localInputData}
                setLocalInputData={setLocalInputData}
                updateInputValue={updateInputValue}
                updateInputValues={updateInputValues}
                setValidationCallback={setValidationCallback}
                setValidationErrors={setValidationErrors}
                variables={variables}
                inputVariables={inputVariables}
                projectVariables={projectVariables}
                extensionName={extensionName}
                nodeName={nodeDefinition.name}
                getConnectedInputMetadata={getConnectedInputMetadata}
                nodeOutputMetadata={nodeOutputMetadata}
                nodeMetadataActuality={nodeMetadataActuality}
              />
            ) : nodeModalStepperExtensions.length > 0 ? (
              nodeModalStepperExtensions.map(ext => (
                <NodeModalStepperRenderer
                  key={ext.id}
                  extension={ext}
                  hasUnsavedChanges={isDirty}
                  onFinish={handleStepperSave}
                  isOpen={uiIsOpen}
                  projectID={projectID}
                  id={selectedNodeID}
                  data={nodeData}
                  nodeDefinition={nodeDefinition}
                  localInputData={localInputData}
                  setLocalInputData={setLocalInputData}
                  updateInputValue={updateInputValue}
                  updateInputValues={updateInputValues}
                  setValidationCallback={setValidationCallback}
                  setValidationErrors={setValidationErrors}
                  variables={variables}
                  inputVariables={inputVariables}
                  projectVariables={projectVariables}
                />
              ))
            ) : nodeModalExtensions.length > 0 ? (
              nodeModalExtensions.map(ext => (
                <ext.component
                  key={ext.id}
                  isOpen={uiIsOpen}
                  projectID={projectID}
                  id={selectedNodeID}
                  data={nodeData}
                  nodeDefinition={nodeDefinition}
                  localInputData={localInputData}
                  setLocalInputData={setLocalInputData}
                  updateInputValue={updateInputValue}
                  updateInputValues={updateInputValues}
                  setValidationCallback={setValidationCallback}
                  setValidationErrors={setValidationErrors}
                  variables={variables}
                  inputVariables={inputVariables}
                  projectVariables={projectVariables}
                  getConnectedInputMetadata={getConnectedInputMetadata}
                  nodeOutputMetadata={nodeOutputMetadata}
                  nodeMetadataActuality={nodeMetadataActuality}
                />
              ))
            ) : (
              <NodeDefaultEditor
                isOpen={uiIsOpen}
                projectID={projectID}
                id={selectedNodeID}
                data={nodeData}
                nodeDefinition={nodeDefinition}
                localInputData={localInputData}
                setLocalInputData={setLocalInputData}
                setValidationCallback={setValidationCallback}
                setValidationErrors={setValidationErrors}
                variables={variables}
                inputVariables={inputVariables}
                projectVariables={projectVariables}
              />
            )}
          </BodyContent>
        </Body>

        {nodeModalStepperExtensions.length === 0 && (
          <Footer
            hasUnsavedChanges={isDirty}
            onCancel={onClose}
            onSave={handleSave}
          />
        )}

        <CommentSection
          value={nodeData.comment ?? ''}
          open={isCommentOpen}
          onClose={() => setIsCommentOpen(false)}
          onChange={updateComment}
          nodeTitle={editorTitle}
        />
      </>
    );
  }
);

NodeDataModalContent.displayName = 'NodeDataModalContent';

interface NodeDataModalInnerProps {
  closePanel: () => void;
  selectedNodeID: string;
  uiIsOpen: boolean;
}

const NodeDataModalInner = ({
  closePanel,
  selectedNodeID,
  uiIsOpen,
}: NodeDataModalInnerProps) => {
  const {
    nodeData,
    updateDisplayName,
    updateComment,
    updateInputValue,
    updateInputValues,
    replaceInputValues,
  } = useNodeData(selectedNodeID);

  const nodeDefinition = useNodeDefinition(nodeData?.name);
  const { currentProject } = useCurrentProject();
  const { allConnectedNodeMetadataActual } =
    useConnectedNodeMetadata(selectedNodeID);
  const { connectedInputs, getConnectedInputMetadata } =
    useNodeConnections(selectedNodeID);
  const { nodeMetadata, nodeMetadataActuality } =
    useNodeMetadata(selectedNodeID);

  const nodeModalExtensions = useNodeModalExtensions(nodeDefinition);
  const nodeModalStepperExtensions =
    useNodeModalStepperExtensions(nodeDefinition);
  const { inputVariables, projectVariables, variables } = useNodeVariableGroups(
    selectedNodeID,
    { enabled: uiIsOpen }
  );
  const { openViewer: openDocumentationViewer } = useNodeDocumentationViewer();
  const extensionName = nodeDefinition?.extension_name?.trim() || null;

  const [localInputData, setLocalInputData] = useState<AnyDict>({});
  const [validationCallback, setValidationCallback] = useState<
    (() => IsValid) | undefined
  >(undefined);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const skipNextInputValuesHydrationRef = useRef(false);

  useEffect(() => {
    setIsCommentOpen(false);
  }, [selectedNodeID]);

  const connectionRequiredInputs = useMemo(
    () =>
      nodeDefinition
        ? Object.values(nodeDefinition.input_definitions ?? {}).filter(
            i => shouldCheckInputConnection(i) && !i.is_hidden && !i.optional
          )
        : [],
    [nodeDefinition]
  );
  const metadataRequiredInputs = useMemo(
    () =>
      nodeDefinition
        ? Object.values(nodeDefinition.input_definitions ?? {}).filter(
            i => requiresConnectedNodeMetadata(i) && !i.is_hidden && !i.optional
          )
        : [],
    [nodeDefinition]
  );

  useEffect(() => {
    if (!connectedInputs) return;

    const nextWarnings: string[] = [];
    for (const input of connectionRequiredInputs) {
      if (!connectedInputs[input.attr_name]) {
        nextWarnings.push(`Вход '${input.display_name}' не подключен`);
      }
    }

    setWarnings(nextWarnings);
  }, [connectedInputs, connectionRequiredInputs]);

  useEffect(() => {
    if (skipNextInputValuesHydrationRef.current) {
      skipNextInputValuesHydrationRef.current = false;
      return;
    }

    setLocalInputData(
      nodeData?.inputValues ? unwrapInputValues(nodeData.inputValues) : {}
    );
    setValidationErrors({});
  }, [selectedNodeID, nodeData?.inputValues]);

  useEffect(() => {
    setValidationCallback(undefined);
    setValidationErrors({});
  }, [selectedNodeID, nodeDefinition?.name]);

  const isDirty = useMemo(() => {
    const sourceRawInputValues = nodeData?.inputValues
      ? unwrapInputValues(nodeData.inputValues)
      : {};

    return !equal(sourceRawInputValues, localInputData);
  }, [nodeData?.inputValues, localInputData]);

  const handleClose = useCallback(() => {
    closePanel();
  }, [closePanel]);

  const handleOpenDocumentation = useCallback(() => {
    if (!nodeDefinition?.name) {
      return;
    }

    openDocumentationViewer({
      nodeName: nodeDefinition.name,
      nodeTitle:
        nodeData?.displayName ||
        nodeDefinition.display_name ||
        nodeDefinition.name,
    });
  }, [
    nodeData?.displayName,
    nodeDefinition?.display_name,
    nodeDefinition?.name,
    openDocumentationViewer,
  ]);

  const { openDialog } = useConfirmDialog();

  const updateInputValueFromModal = useCallback<
    ReturnType<typeof useNodeData>['updateInputValue']
  >(
    (inputName, value) => {
      skipNextInputValuesHydrationRef.current = true;
      updateInputValue(inputName, value);
    },
    [updateInputValue]
  );

  const updateInputValuesFromModal = useCallback<
    ReturnType<typeof useNodeData>['updateInputValues']
  >(
    inputValues => {
      skipNextInputValuesHydrationRef.current = true;
      updateInputValues(inputValues);
    },
    [updateInputValues]
  );

  const replaceInputValuesFromModal = useCallback<
    ReturnType<typeof useNodeData>['replaceInputValues']
  >(
    inputValues => {
      skipNextInputValuesHydrationRef.current = true;
      replaceInputValues(inputValues);
    },
    [replaceInputValues]
  );

  const saveInputData = useCallback(
    async (beforeFinish?: StepperBeforeFinishHandler<AnyDict>) => {
      if (!nodeData || !nodeDefinition) return;

      if (validationCallback) {
        const ok = await callMaybeAsync(validationCallback);
        if (!ok) return;
      }

      const inputValueBindings: Record<string, NodeInputValue> = {};

      for (const [inputName, value] of Object.entries(localInputData)) {
        if (isInputValue(value) && !isConst(value)) {
          inputValueBindings[inputName] = value;
        }
      }

      const res = validateNodeData(nodeDefinition, localInputData);
      if (!res.success) {
        setValidationErrors(res.errors);
        return;
      }

      const rawInputValues = (res.data ?? localInputData) as AnyDict;
      const beforeFinishInputValues = buildBeforeFinishInputValues(
        localInputData,
        rawInputValues
      );

      const shouldFinish = await canCommitStepperFinish(
        beforeFinish,
        beforeFinishInputValues
      );
      if (!shouldFinish) return;

      const sanitizedRawInputValues = Object.fromEntries(
        Object.entries(rawInputValues).filter(
          ([, value]) => value !== undefined
        )
      );
      const wrappedInputValues = wrapConstInputValues(sanitizedRawInputValues);

      for (const [inputName, value] of Object.entries(inputValueBindings)) {
        wrappedInputValues[inputName] = value;
      }

      replaceInputValuesFromModal(wrappedInputValues);
      handleClose();
    },
    [
      handleClose,
      localInputData,
      nodeData,
      nodeDefinition,
      replaceInputValuesFromModal,
      validationCallback,
    ]
  );

  const handleSave = useCallback(() => saveInputData(), [saveInputData]);

  useEffect(() => {
    if (!uiIsOpen || nodeModalStepperExtensions.length > 0) return;

    const handleSaveShortcut = (event: KeyboardEvent) => {
      if (
        event.code !== 'KeyS' ||
        (!event.ctrlKey && !event.metaKey) ||
        event.altKey ||
        event.repeat
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      void handleSave();
    };

    window.addEventListener('keydown', handleSaveShortcut, true);
    return () => {
      window.removeEventListener('keydown', handleSaveShortcut, true);
    };
  }, [handleSave, nodeModalStepperExtensions.length, uiIsOpen]);

  const handleStepperSave = useCallback(
    (beforeFinish?: StepperBeforeFinishHandler<AnyDict>) =>
      saveInputData(beforeFinish),
    [saveInputData]
  );

  const openUnsavedDialogOrClose = useCallback(() => {
    if (!isDirty) {
      handleClose();
      return;
    }

    void openDialog({
      title: 'Сохранить изменения?',
      message:
        'Есть несохранённые изменения. Несохранённые изменения будут потеряны.',
      actions: [
        { id: 'cancel', label: 'Отмена', autoFocus: true },
        { id: 'discard', label: 'Не сохранять', handler: handleClose },
        {
          id: 'save',
          label: 'Сохранить',
          emphasize: true,
          handler: handleSave,
        },
      ],
    });
  }, [handleClose, handleSave, isDirty, openDialog]);

  const hasEditorContext = Boolean(nodeData && nodeDefinition);
  const isMetadataLoading =
    hasEditorContext &&
    !allConnectedNodeMetadataActual &&
    metadataRequiredInputs.length > 0;

  useEffect(() => {
    if (uiIsOpen && !hasEditorContext) {
      closePanel();
    }
  }, [closePanel, hasEditorContext, uiIsOpen]);

  if (!hasEditorContext || !nodeData || !nodeDefinition) {
    return null;
  }

  const editorTitle =
    nodeData.displayName ||
    nodeDefinition.display_name ||
    nodeDefinition.name ||
    'Node Editor';
  const editorSubtitle = isMetadataLoading
    ? 'Загружаем метаданные входов'
    : nodeDefinition.display_name || nodeDefinition.name || 'Настройка ноды';

  return (
    <NodeDataModalDialog open={uiIsOpen} onClose={openUnsavedDialogOrClose}>
      <NodeDataModalContent
        editorSubtitle={editorSubtitle}
        editorTitle={editorTitle}
        extensionName={extensionName}
        getConnectedInputMetadata={getConnectedInputMetadata}
        handleSave={handleSave}
        handleStepperSave={handleStepperSave}
        isCommentOpen={isCommentOpen}
        isDirty={isDirty}
        isMetadataLoading={isMetadataLoading}
        localInputData={localInputData}
        nodeData={nodeData}
        nodeDefinition={nodeDefinition}
        nodeModalExtensions={nodeModalExtensions}
        nodeModalStepperExtensions={nodeModalStepperExtensions}
        onClose={openUnsavedDialogOrClose}
        openDocumentation={handleOpenDocumentation}
        projectID={currentProject?.id ?? ''}
        selectedNodeID={selectedNodeID}
        setIsCommentOpen={setIsCommentOpen}
        setLocalInputData={setLocalInputData as Setter<AnyDict>}
        setValidationCallback={setValidationCallback}
        setValidationErrors={setValidationErrors}
        uiIsOpen={uiIsOpen}
        updateComment={updateComment}
        updateDisplayName={updateDisplayName}
        updateInputValue={updateInputValueFromModal}
        updateInputValues={updateInputValuesFromModal}
        validationErrors={validationErrors}
        variables={variables}
        inputVariables={inputVariables}
        projectVariables={projectVariables}
        warnings={warnings}
        nodeOutputMetadata={nodeMetadata}
        nodeMetadataActuality={nodeMetadataActuality}
      />
    </NodeDataModalDialog>
  );
};

const NodeDataModal_ = () => {
  const { selectedNodeID } = useSelectNode();
  const uiLayout = useNodeDataModalUI();
  const isOpen = uiLayout.open;

  useEffect(() => {
    if (isOpen && !selectedNodeID) {
      uiLayout.setOpen(false);
    }
  }, [isOpen, selectedNodeID, uiLayout]);

  const closePanel = useCallback(() => {
    uiLayout.setOpen(false);
  }, [uiLayout]);

  const isVisible = isOpen && Boolean(selectedNodeID);

  return isVisible && selectedNodeID ? (
    <NodeDataModalInner
      closePanel={closePanel}
      selectedNodeID={selectedNodeID}
      uiIsOpen={isOpen}
    />
  ) : null;
};

export const NodeDataModal = memo(NodeDataModal_);
