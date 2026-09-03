import React from 'react';
import { NodeProps } from '@xyflow/react';

import { ExtensionHost } from '@/app/extensions/types';
import { AppDispatch } from '@/app/providers/store';

import {
  CustomNodeData,
  CustomNodeType,
} from '@/entities/project-editor/graph';

import {
  InputDefinitionModel,
  NodeDefinition,
  NodeInputValue,
  NodeMetadata,
} from '@/shared/gatewayClient';
import type { NodeInputValuesMap } from '@/shared/lib/node-input-values';
import type { VariableOutput } from '@/shared/lib/variables';
import type { AllKeysOptional, StateSetter } from '@/shared/types';

export type NodeExtensionType =
  | 'node_content_top'
  | 'node_content_bottom'
  | 'modal'
  | 'modal_stepper'
  | 'context_menu'
  | 'input_definition';

export type NodeHeaderDescriptionContext = {
  nodeDefinition: NodeDefinition;
  data: CustomNodeData;
  variables: VariableOutput[];
};

type NodeExtensionBase<TType extends NodeExtensionType> = {
  id: string;
  name: string;
  description?: string;
  order?: number;
  type: TType;
  /**
   * Return:
   * - `string` to override the node description
   * - `null` to explicitly hide the description
   * - `undefined` to fall back to `nodeDefinition.description`
   */
  getHeaderDescription?: (
    context: NodeHeaderDescriptionContext
  ) => string | null | undefined;
};

export type NodeContentExtensionProps = NodeProps<CustomNodeType> & {
  nodeDefinition: NodeDefinition;
  variables: VariableOutput[];
};

export interface NodeContentExtension extends NodeExtensionBase<
  'node_content_top' | 'node_content_bottom'
> {
  condition: (nodeDefinition: NodeDefinition) => boolean;
  component: React.FC<NodeContentExtensionProps>;
}

export type NodeModalExtensionProps<
  T extends Partial<Record<string, any>> = Partial<Record<string, any>>,
> =
  AllKeysOptional<T> extends true
    ? {
        _typeCheck?: T;

        projectID: string;
        id: string;
        data: CustomNodeData;
        nodeDefinition: NodeDefinition;

        isOpen: boolean;

        localInputData: T;
        setLocalInputData: StateSetter<T>;

        variables: VariableOutput[];
        inputVariables?: VariableOutput[] | undefined;
        projectVariables?: VariableOutput[] | undefined;
        updateInputValue?: (inputName: string, value: NodeInputValue) => void;
        updateInputValues?: (inputValues: NodeInputValuesMap) => void;

        setValidationCallback?: (
          callback: () => () => boolean | Promise<boolean>
        ) => void;
        setValidationErrors?: StateSetter<Record<string, string[]>>;

        host?: ExtensionHost;

        getConnectedInputMetadata?: (
          inputName: string
        ) => NodeMetadata[string] | null;

        nodeOutputMetadata?: NodeMetadata | null;

        nodeMetadataActuality?: boolean | null;
      }
    : {
        ERROR: "All properties in 'localInputData' must be optional";
      };

export type NodeModalContentWidth = 'compact' | 'regular' | 'wide';

export type NodeModalPresentationConfig =
  | {
      type: 'fluid';
    }
  | {
      type: 'centered';
      contentWidth: NodeModalContentWidth;
    }
  | {
      type: 'workspace';
    };

export interface NodeModalExtension extends NodeExtensionBase<'modal'> {
  allowOpenWithoutConnectedMetadata?: boolean;
  presentation?: NodeModalPresentationConfig;
  condition: (nodeDefinition: NodeDefinition) => boolean;
  component: React.FC<NodeModalExtensionProps>;
}

export type NodeModalStepperExtensionProps<
  T extends Partial<Record<string, any>> = Partial<Record<string, any>>,
  S = undefined,
> = NodeModalExtensionProps<T> & {
  /**
   * Update a single input value immediately (saves to graph state)
   */
  updateInputValue?: (inputName: string, value: NodeInputValue) => void;
  /**
   * Update multiple input values immediately (saves to graph state)
   */
  updateInputValues?: (inputValues: NodeInputValuesMap) => void;
  /**
   * Shared local state for the modal stepper, available across all steps
   */
  sharedState: S;
  /**
   * Setter for the shared local state
   */
  setSharedState: React.Dispatch<React.SetStateAction<S>>;
};

/**
 * Context passed to loading conditions for evaluating step readiness
 */
export type StepLoadingConditionContext<
  T extends Partial<Record<string, any>> = Partial<Record<string, any>>,
  S = undefined,
> = {
  projectID: string;
  nodeID: string;
  inputValues: T;
  nodeDefinition: NodeDefinition;
  data: CustomNodeData;
  variables: VariableOutput[];
  /**
   * Whether the node's own metadata is actual (from useNodeMetadata hook)
   */
  nodeMetadataActuality: boolean | null;
  /**
   * Shared local state for the modal stepper
   */
  sharedState: S;
  /**
   * Setter for the shared local state
   */
  setSharedState: React.Dispatch<React.SetStateAction<S>>;
  /**
   * Optional local draft input updater for step callbacks.
   */
  setLocalInputData?: StateSetter<T>;
};

/**
 * Context passed to onContinue callback
 */
export type StepOnContinueContext<
  T extends Partial<Record<string, any>> = Partial<Record<string, any>>,
  S = undefined,
> = {
  nodeID: string;
  inputValues: T;
  nodeDefinition: NodeDefinition;
  data: CustomNodeData;
  variables: VariableOutput[];
  /**
   * Update a single input value immediately (saves to graph state)
   */
  updateInputValue: (inputName: string, value: NodeInputValue) => void;
  /**
   * Update multiple input values immediately (saves to graph state)
   */
  updateInputValues: (inputValues: NodeInputValuesMap) => void;
  /**
   * Shared local state for the modal stepper
   */
  sharedState: S;
  /**
   * Setter for the shared local state
   */
  setSharedState: React.Dispatch<React.SetStateAction<S>>;
};

/**
 * Context passed to the final step hook before the modal commits validated data.
 */
export type StepBeforeFinishContext<
  T extends Partial<Record<string, any>> = Partial<Record<string, any>>,
  S = undefined,
> = {
  nodeID: string;
  inputValues: T;
  nodeDefinition: NodeDefinition;
  data: CustomNodeData;
  variables: VariableOutput[];
  /**
   * Shared local state for the modal stepper
   */
  sharedState: S;
  /**
   * Setter for the shared local state
   */
  setSharedState: React.Dispatch<React.SetStateAction<S>>;
};

export type NodeModalStepperStep<
  T extends Partial<Record<string, any>> = Partial<Record<string, any>>,
  S = undefined,
> = {
  id?: string;
  label?: string;
  component: React.FC<NodeModalStepperExtensionProps<T, S>>;
  /**
   * Condition to check if user can proceed to the next step.
   * Evaluated when user clicks "Next".
   * Receives shared state and its setter as additional arguments.
   */
  condition?: (
    inputValues: T,
    sharedState: S,
    setSharedState: React.Dispatch<React.SetStateAction<S>>
  ) => boolean | Promise<boolean>;
  /**
   * Loading condition to check if the step content is ready to be displayed.
   * When returns false, a loading spinner is shown instead of the step component.
   * Useful for steps that depend on async data.
   */
  loadingCondition?: (
    context: StepLoadingConditionContext<T, S>
  ) => boolean | Promise<boolean>;
  /**
   * Optional synchronous guard for loadingCondition/loadingOverlay.
   * When it returns false, the step content is rendered immediately without
   * briefly entering the loading state.
   */
  shouldShowLoadingOverlay?: (
    context: StepLoadingConditionContext<T, S>
  ) => boolean;
  /**
   * Custom loading overlay shown while loadingCondition returns false.
   */
  loadingOverlay?: React.FC<{
    context: StepLoadingConditionContext<T, S>;
    goToPreviousStep: () => void;
  }>;
  /**
   * Full-step overlay shown while the final onBeforeFinish action is running.
   */
  finishOverlay?: React.FC<{
    context: StepLoadingConditionContext<T, S>;
    goToPreviousStep: () => void;
  }>;
  /**
   * Controls finishOverlay visibility during finalization and retained
   * success/error states.
   */
  shouldShowFinishOverlay?: (
    context: StepLoadingConditionContext<T, S>,
    isFinishing: boolean
  ) => boolean;
  /**
   * Callback called when entering this step.
   */
  onEnter?: (
    context: StepLoadingConditionContext<T, S>
  ) => void | Promise<void>;
  /**
   * Callback called when user clicks "Continue/Next" and condition passes.
   */
  onContinue?: (
    context: StepOnContinueContext<T, S>
  ) => boolean | void | Promise<boolean | void>;
  /** Optional dynamic label for the non-final step action button. */
  getContinueLabel?: (inputValues: T, sharedState: S) => string | null;
  /**
   * Callback called only on the final step before the modal commits validated data.
   * Return `false` to stop the finish flow.
   */
  onBeforeFinish?: (
    context: StepBeforeFinishContext<T, S>
  ) => boolean | void | Promise<boolean | void>;

  activeIcon?: React.ReactNode | React.ElementType;
  completedIcon?: React.ReactNode | React.ElementType;
  errorIcon?: React.ReactNode | React.ElementType;
};

export interface NodeModalStepperExtension<
  S = undefined,
> extends NodeExtensionBase<'modal_stepper'> {
  allowOpenWithoutConnectedMetadata?: boolean;
  condition: (nodeDefinition: NodeDefinition) => boolean;
  steps: NodeModalStepperStep<any, S>[];
}

export type NodeContextMenuBuildContext = {
  nodeID: string;
  nodeDefinition: NodeDefinition;
  data: CustomNodeData;
  variables: VariableOutput[];
  closeMenu: () => void;
  dispatch: AppDispatch;
  duplicateNode?: (nodeID: string) => Promise<void>;
};

interface NodeContextMenuItemBase {
  id: string;
  order?: number | undefined;
  disabled?: boolean | undefined;
  tooltip?: string | undefined;
  icon?: React.ReactNode | undefined;
}

export interface NodeContextMenuActionItem extends NodeContextMenuItemBase {
  type: 'action';
  label: React.ReactNode;
  closeOnSelect?: boolean;
  onSelect: (context: NodeContextMenuBuildContext) => void | Promise<void>;
}

export interface NodeContextMenuToggleItem extends NodeContextMenuItemBase {
  type: 'toggle';
  label: React.ReactNode;
  checked: boolean;
  closeOnToggle?: boolean;
  onToggle: (
    context: NodeContextMenuBuildContext,
    nextChecked: boolean
  ) => void | Promise<void>;
}

export interface NodeContextMenuSubmenuItem extends NodeContextMenuItemBase {
  type: 'submenu';
  label: React.ReactNode;
  items: NodeContextMenuItem[];
}

export interface NodeContextMenuSeparatorItem extends NodeContextMenuItemBase {
  type: 'separator';
  icon?: never;
  label?: never;
  items?: never;
  onSelect?: never;
  closeOnSelect?: never;
  checked?: never;
  closeOnToggle?: never;
  onToggle?: never;
}

export type NodeContextMenuItem =
  | NodeContextMenuActionItem
  | NodeContextMenuToggleItem
  | NodeContextMenuSubmenuItem
  | NodeContextMenuSeparatorItem;

export interface NodeContextMenuExtension extends NodeExtensionBase<'context_menu'> {
  condition: (nodeDefinition: NodeDefinition) => boolean;
  getItems: (context: NodeContextMenuBuildContext) => NodeContextMenuItem[];
}

export type NodeLevelExtension =
  | NodeContentExtension
  | NodeModalExtension
  | NodeModalStepperExtension<any>
  | NodeContextMenuExtension;

export type NodeHeaderDescriptionExtension = NodeLevelExtension & {
  getHeaderDescription: NonNullable<
    NodeExtensionBase<NodeExtensionType>['getHeaderDescription']
  >;
};

export type NodeInputExtensionUsageContext = 'modal' | 'node';

export type NodeInputExtensionConditionContext = {
  nodeDefinition: NodeDefinition;
  inputDefinition: InputDefinitionModel;
};

export type NodeInputExtensionProps = {
  nodeId: string;
  nodeName: string;
  inputDefinition: InputDefinitionModel;
  value: NodeInputValue | undefined;
  onChange: (value: NodeInputValue) => void;
  context: NodeInputExtensionUsageContext;
  variables: VariableOutput[];
  inputVariables?: VariableOutput[] | undefined;
  projectVariables?: VariableOutput[] | undefined;
  errors?: string[];
  isConnected?: boolean;
};

export interface NodeInputDefinitionExtension extends NodeExtensionBase<'input_definition'> {
  allowInModal?: boolean;
  allowInNode?: boolean;
  condition: (context: NodeInputExtensionConditionContext) => boolean;
  component: React.FC<NodeInputExtensionProps>;
}

export type NodeExtension =
  | NodeContentExtension
  | NodeModalExtension
  | NodeModalStepperExtension<any>
  | NodeContextMenuExtension
  | NodeInputDefinitionExtension;
