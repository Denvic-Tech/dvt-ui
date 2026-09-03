import { useMemo } from 'react';

import { isConnectRequiredType } from '@/entities/node/node-io';

import type {
  InputDefinitionModel,
  Io,
  OutputDefinitionModel,
} from '@/shared/gatewayClient';

interface UseCustomNodeInputsOutputsProps {
  inputDefinitions?: InputDefinitionModel[] | null;
  outputDefinitions?: OutputDefinitionModel[] | null;
  showSignalIO?: boolean;
  showVariablesIO?: boolean;
  showSignalInputDefinitions?: boolean;
  showSignalOutputDefinitions?: boolean;
  showVariableInputDefinitions?: boolean;
  showVariableOutputDefinitions?: boolean;
  connectedInputNamesSet?: ReadonlySet<string> | null;
  connectedOutputNamesSet?: ReadonlySet<string> | null;
}

const EMPTY_CONNECTED_NAMES_SET: ReadonlySet<string> = new Set();

type IoDefinitionType =
  | InputDefinitionModel['type']
  | OutputDefinitionModel['type'];

type SortableIoDefinition = {
  type: IoDefinitionType;
  attr_name: string;
};

const IO_ORDER_PRIORITY: Partial<Record<Io, number>> = {
  VARIABLE: 1,
  SIGNAL: 2,
};

const VARIABLE_INPUT_NAMES = new Set(['variables', 'input_variables']);

const isVariablesInputDefinition = (
  definition: Pick<InputDefinitionModel, 'attr_name' | 'type'>
): boolean =>
  VARIABLE_INPUT_NAMES.has(definition.attr_name) &&
  hasIoType(definition.type, 'VARIABLE');

export const hasIoType = (
  type: IoDefinitionType | null | undefined,
  ioType: Io
): boolean => {
  if (!type) {
    return false;
  }
  if (Array.isArray(type)) {
    return type.includes(ioType);
  }
  return type === ioType;
};

const getIoSortPriority = (type: IoDefinitionType): number => {
  if (hasIoType(type, 'SIGNAL')) {
    return IO_ORDER_PRIORITY.SIGNAL ?? 0;
  }
  if (hasIoType(type, 'VARIABLE')) {
    return IO_ORDER_PRIORITY.VARIABLE ?? 0;
  }
  return 0;
};

export const sortIoDefinitionsBySpecialTypesLast = <
  T extends SortableIoDefinition,
>(
  definitions: T[] | undefined | null
): T[] => {
  if (!definitions?.length) {
    return [];
  }

  return definitions
    .map((definition, index) => ({ definition, index }))
    .sort((left, right) => {
      const priorityDiff =
        getIoSortPriority(left.definition.type) -
        getIoSortPriority(right.definition.type);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return left.index - right.index;
    })
    .map(item => item.definition);
};

const shouldShowIoDefinitionByFlags = (
  type: IoDefinitionType,
  showSignalIO: boolean,
  showVariablesIO: boolean
): boolean =>
  (showSignalIO || !hasIoType(type, 'SIGNAL')) &&
  (showVariablesIO || !hasIoType(type, 'VARIABLE'));

export const useCustomNodeInputsOutputs = (
  props: UseCustomNodeInputsOutputsProps
) => {
  const {
    inputDefinitions,
    outputDefinitions,
    showSignalIO = false,
    showVariablesIO = false,
    showSignalInputDefinitions = showSignalIO,
    showSignalOutputDefinitions = showSignalIO,
    showVariableInputDefinitions = showVariablesIO,
    showVariableOutputDefinitions = showVariablesIO,
    connectedInputNamesSet = EMPTY_CONNECTED_NAMES_SET,
    connectedOutputNamesSet = EMPTY_CONNECTED_NAMES_SET,
  } = props;
  const effectiveConnectedInputNamesSet =
    connectedInputNamesSet ?? EMPTY_CONNECTED_NAMES_SET;
  const effectiveConnectedOutputNamesSet =
    connectedOutputNamesSet ?? EMPTY_CONNECTED_NAMES_SET;

  const sortedInputDefinitions = useMemo(
    () => sortIoDefinitionsBySpecialTypesLast(inputDefinitions),
    [inputDefinitions]
  );
  const sortedOutputDefinitions = useMemo(
    () => sortIoDefinitionsBySpecialTypesLast(outputDefinitions),
    [outputDefinitions]
  );

  const variablesInputDefinition = useMemo(() => {
    return (
      sortedInputDefinitions.find(
        inputDefinition =>
          isVariablesInputDefinition(inputDefinition) &&
          !inputDefinition.is_hidden &&
          (showVariablesIO ||
            showVariableInputDefinitions ||
            effectiveConnectedInputNamesSet.has(inputDefinition.attr_name))
      ) ?? null
    );
  }, [
    effectiveConnectedInputNamesSet,
    showVariableInputDefinitions,
    showVariablesIO,
    sortedInputDefinitions,
  ]);

  const visibleInputDefinitions = useMemo(() => {
    return sortedInputDefinitions.filter(inputDefinition => {
      if (isVariablesInputDefinition(inputDefinition)) {
        return false;
      }

      const isConnected = effectiveConnectedInputNamesSet.has(
        inputDefinition.attr_name
      );
      return (
        isConnected ||
        inputDefinition.force_handle_visible ||
        (isConnectRequiredType(inputDefinition) &&
          !inputDefinition.is_hidden &&
          shouldShowIoDefinitionByFlags(
            inputDefinition.type,
            showSignalInputDefinitions,
            showVariableInputDefinitions
          ))
      );
    });
  }, [
    effectiveConnectedInputNamesSet,
    showSignalInputDefinitions,
    showVariableInputDefinitions,
    sortedInputDefinitions,
  ]);

  const visibleInputNamesSet = useMemo(
    () =>
      new Set(
        visibleInputDefinitions.map(
          inputDefinition => inputDefinition.attr_name
        )
      ),
    [visibleInputDefinitions]
  );

  const visibleOutputDefinitions = useMemo(() => {
    return sortedOutputDefinitions.filter(outputDefinition => {
      return (
        effectiveConnectedOutputNamesSet.has(outputDefinition.attr_name) ||
        outputDefinition.force_handle_visible ||
        shouldShowIoDefinitionByFlags(
          outputDefinition.type,
          showSignalOutputDefinitions,
          showVariableOutputDefinitions
        )
      );
    });
  }, [
    effectiveConnectedOutputNamesSet,
    showSignalOutputDefinitions,
    showVariableOutputDefinitions,
    sortedOutputDefinitions,
  ]);

  return {
    visibleInputDefinitions,
    variablesInputDefinition,
    visibleOutputDefinitions,
  };
};
