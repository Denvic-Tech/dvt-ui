import { useCallback } from 'react';
import { Connection, Edge } from '@xyflow/react';
import { useStore } from 'react-redux';

import { RootState } from '@/app/providers/store';

import { Io, NodeDefinition } from '@/shared/gatewayClient';
import { isIoTypeCompatible } from '@/shared/lib/node-io';

export const useNodeConnectionValidation = () => {
  const store = useStore<RootState>();

  // Вспомогательная функция для получения типа из ID хендла
  const getTypeFromHandle = useCallback(
    (
      handleId: string,
      nodeDefinition: NodeDefinition,
      ioType: 'input' | 'output'
    ): Io | Io[] | null => {
      if (ioType === 'input') {
        const inputName = handleId.replace(/^input-/, '');
        const inputConf =
          nodeDefinition.input_definitions?.[inputName] ??
          Object.values(nodeDefinition.input_definitions ?? {}).find(
            def => def.attr_name === inputName
          );
        return inputConf ? inputConf.type : null;
      } else {
        // output
        const outputName = handleId.replace(/^output-/, '');
        const outputConf =
          nodeDefinition.output_definitions?.[outputName] ??
          Object.values(nodeDefinition.output_definitions ?? {}).find(
            def => def.attr_name === outputName
          );
        return outputConf ? outputConf.type : null;
      }
    },
    []
  );

  // Функция проверки совместимости типов
  const checkTypeCompatibility = useCallback(
    (sourceType: Io | Io[], targetType: Io | Io[]): boolean =>
      isIoTypeCompatible(sourceType, targetType),
    []
  );

  // Функция проверки валидности соединения
  const isValidConnection = useCallback(
    (connection: Connection | Edge): boolean => {
      if (
        !connection.source ||
        !connection.target ||
        !connection.sourceHandle ||
        !connection.targetHandle
      )
        return false;

      const state = store.getState();

      const sourceNodeName: string | undefined =
        state.graph.nodeDataByID[connection.source]?.name;
      const targetNodeName: string | undefined =
        state.graph.nodeDataByID[connection.target]?.name;

      if (!sourceNodeName || !targetNodeName) return false;

      const sourceNodeDefinition: NodeDefinition | undefined =
        state.nodeDefinition.nodesDefinitionsMap[sourceNodeName];
      const targetNodeDefinition: NodeDefinition | undefined =
        state.nodeDefinition.nodesDefinitionsMap[targetNodeName];

      if (!sourceNodeDefinition || !targetNodeDefinition) return false;

      const sourceType = getTypeFromHandle(
        connection.sourceHandle,
        sourceNodeDefinition,
        'output'
      );
      const targetType = getTypeFromHandle(
        connection.targetHandle,
        targetNodeDefinition,
        'input'
      );

      if (!sourceType || !targetType) return false;

      return checkTypeCompatibility(sourceType, targetType);
    },
    [checkTypeCompatibility, getTypeFromHandle, store]
  );

  return {
    isValidConnection,
  };
};
