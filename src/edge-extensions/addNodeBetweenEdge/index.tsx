import React, { useCallback, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import type { Edge } from '@xyflow/react';
import { useStore } from 'react-redux';

import {
  EdgeContextMenuBuildContext,
  EdgeContextMenuExtension,
} from '@/app/providers/edge-extensions/lib/types.ts';
import { RootState } from '@/app/providers/store';

import { buildInitialInputValues } from '@/entities/node/node-definition';
import {
  applyCustomNodeDataDefaults,
  CustomNodeType,
  generateShortEdgeID,
  generateShortNodeID,
  graphActions,
} from '@/entities/project-editor/graph';
import { NodeLibraryContextMenu } from '@/entities/project-editor/node-library/ui/NodeLibraryContextMenu/NodeLibraryContextMenu.tsx';

import type { Io, NodeDefinition } from '@/shared/gatewayClient';
import { isIoTypeCompatible } from '@/shared/lib/node-io';

type IoType = Io | Io[];

type EdgeInsertionHandles = {
  inputAttrName: string;
  outputAttrName: string;
};

const computePosition = (
  context: EdgeContextMenuBuildContext
): { x: number; y: number } => {
  if (context.flowPosition) {
    return context.flowPosition;
  }

  if (context.geometry) {
    return {
      x: (context.geometry.sourceX + context.geometry.targetX) / 2,
      y: (context.geometry.sourceY + context.geometry.targetY) / 2,
    };
  }

  return { x: 0, y: 0 };
};

const checkTypeCompatibility = (
  sourceType: IoType,
  targetType: IoType
): boolean => isIoTypeCompatible(sourceType, targetType);

const getTypeFromHandle = (
  handleId: string,
  nodeDefinition: NodeDefinition,
  ioType: 'input' | 'output'
): IoType | null => {
  if (ioType === 'input') {
    const inputName = handleId.replace(/^input-/, '');
    const inputDefinition =
      nodeDefinition.input_definitions?.[inputName] ??
      Object.values(nodeDefinition.input_definitions ?? {}).find(
        definition => definition.attr_name === inputName
      );

    return inputDefinition ? inputDefinition.type : null;
  }

  const outputName = handleId.replace(/^output-/, '');
  const outputDefinition =
    nodeDefinition.output_definitions?.[outputName] ??
    Object.values(nodeDefinition.output_definitions ?? {}).find(
      definition => definition.attr_name === outputName
    );

  return outputDefinition ? outputDefinition.type : null;
};

const findCompatibleHandles = (
  nodeDefinition: NodeDefinition,
  leftOutputType: IoType,
  rightInputType: IoType
): EdgeInsertionHandles | null => {
  const compatibleInput = Object.values(
    nodeDefinition.input_definitions ?? {}
  ).find(input => checkTypeCompatibility(leftOutputType, input.type));
  const compatibleOutput = Object.values(
    nodeDefinition.output_definitions ?? {}
  ).find(output => checkTypeCompatibility(output.type, rightInputType));

  if (!compatibleInput || !compatibleOutput) {
    return null;
  }

  return {
    inputAttrName: compatibleInput.attr_name,
    outputAttrName: compatibleOutput.attr_name,
  };
};

const buildEdgesForInsertion = (
  edge: Edge,
  newNode: CustomNodeType,
  handles: EdgeInsertionHandles
): Edge[] => {
  const newEdges: Edge[] = [];

  const copyOptionalProps = <T extends Edge>(base: T): T => {
    if (edge.markerEnd !== undefined) {
      base.markerEnd = edge.markerEnd;
    }
    if (edge.style !== undefined) {
      base.style = edge.style;
    }
    if (edge.data !== undefined) {
      base.data = edge.data;
    }
    return base;
  };

  if (edge.source && edge.sourceHandle) {
    newEdges.push(
      copyOptionalProps({
        id: generateShortEdgeID(),
        type: 'custom',
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: newNode.id,
        targetHandle: `input-${handles.inputAttrName}`,
      })
    );
  }

  if (edge.target && edge.targetHandle) {
    newEdges.push(
      copyOptionalProps({
        id: generateShortEdgeID(),
        type: 'custom',
        source: newNode.id,
        sourceHandle: `output-${handles.outputAttrName}`,
        target: edge.target,
        targetHandle: edge.targetHandle,
      })
    );
  }

  return newEdges;
};

const insertNodeBetweenEdge = async (
  nodeDefinition: NodeDefinition,
  context: EdgeContextMenuBuildContext,
  handles: EdgeInsertionHandles
) => {
  const position = computePosition(context);
  const inputValues = buildInitialInputValues(nodeDefinition);
  const newNode: CustomNodeType = {
    id: generateShortNodeID(),
    type: 'custom',
    position,
    data: applyCustomNodeDataDefaults({
      name: nodeDefinition.name,
      displayName: nodeDefinition.display_name || nodeDefinition.name,
      inputValues,
    }),
  };

  const replacementEdges = buildEdgesForInsertion(
    context.edge,
    newNode,
    handles
  );

  context.reactFlow.setNodes(nodes => [...nodes, newNode]);
  context.reactFlow.setEdges(edges => [
    ...edges.filter(e => e.id !== context.edge.id),
    ...replacementEdges,
  ]);

  context.dispatch(graphActions.createNodes({ nodes: [newNode] }));
  if (replacementEdges.length) {
    context.dispatch(graphActions.createEdges({ edges: replacementEdges }));
  }
  context.dispatch(graphActions.deleteEdges({ edges: [context.edge] }));

  context.closeMenu();
};

const EdgeAddNodePanel: React.FC<{
  context: EdgeContextMenuBuildContext;
}> = ({ context }) => {
  const store = useStore<RootState>();
  const [error, setError] = useState<string | null>(null);

  const compatibility = useMemo(() => {
    const { edge } = context;

    if (!edge.sourceHandle || !edge.targetHandle) {
      return {
        leftOutputType: null as IoType | null,
        rightInputType: null as IoType | null,
        message: 'У соединения отсутствуют хэндлы для вставки.',
      };
    }

    const state = store.getState();
    const sourceNodeName = state.graph.nodeDataByID[edge.source]?.name;
    const targetNodeName = state.graph.nodeDataByID[edge.target]?.name;

    if (!sourceNodeName || !targetNodeName) {
      return {
        leftOutputType: null as IoType | null,
        rightInputType: null as IoType | null,
        message: 'Не удалось определить ноды источника и назначения.',
      };
    }

    const sourceNodeDefinition =
      state.nodeDefinition.nodesDefinitionsMap[sourceNodeName];
    const targetNodeDefinition =
      state.nodeDefinition.nodesDefinitionsMap[targetNodeName];

    if (!sourceNodeDefinition || !targetNodeDefinition) {
      return {
        leftOutputType: null as IoType | null,
        rightInputType: null as IoType | null,
        message: 'Не найдены определения нод для проверки совместимости.',
      };
    }

    const leftOutputType = getTypeFromHandle(
      edge.sourceHandle,
      sourceNodeDefinition,
      'output'
    );
    const rightInputType = getTypeFromHandle(
      edge.targetHandle,
      targetNodeDefinition,
      'input'
    );

    if (!leftOutputType || !rightInputType) {
      return {
        leftOutputType: null as IoType | null,
        rightInputType: null as IoType | null,
        message: 'Не удалось определить типы хэндлов выбранного соединения.',
      };
    }

    return {
      leftOutputType,
      rightInputType,
      message: null,
    };
  }, [context, store]);

  const handleNodeSelect = useCallback(
    async (nodeDefinition: NodeDefinition) => {
      setError(null);

      if (!compatibility.leftOutputType || !compatibility.rightInputType) {
        setError(
          compatibility.message ??
            'Не удалось определить совместимость для выбранного соединения.'
        );
        return;
      }

      const handles = findCompatibleHandles(
        nodeDefinition,
        compatibility.leftOutputType,
        compatibility.rightInputType
      );

      if (!handles) {
        setError(
          'Нода не подходит для вставки: нет совместимой пары входа и выхода.'
        );
        return;
      }

      try {
        await insertNodeBetweenEdge(nodeDefinition, context, handles);
      } catch (err) {
        console.error('Failed to insert node between edge', err);
        setError('Не удалось добавить ноду. Попробуйте ещё раз.');
      }
    },
    [compatibility, context]
  );

  return (
    <Box
      sx={{
        width: 340,
        maxHeight: 420,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
      }}
    >
      {compatibility.leftOutputType && compatibility.rightInputType ? (
        <NodeLibraryContextMenu
          embedded
          onClose={context.closeMenu}
          onSelectNode={handleNodeSelect}
          requiredInputType={compatibility.leftOutputType}
          requiredOutputType={compatibility.rightInputType}
        />
      ) : (
        <Box sx={{ p: 1.5 }}>
          <Typography variant='caption' color='error'>
            {compatibility.message}
          </Typography>
        </Box>
      )}
      {error && (
        <Typography variant='caption' color='error' sx={{ px: 1.5, pb: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

const EdgeAddNodeExtension: EdgeContextMenuExtension = {
  id: 'edge-context-menu/add-node',
  name: 'Добавить ноду',
  type: 'context_menu',
  order: 10,
  condition: edge => Boolean(edge),
  getItems: context => {
    const canInsert = Boolean(
      context.edge.sourceHandle && context.edge.targetHandle
    );

    return [
      {
        id: 'edge-context-menu/add-node-item',
        type: 'submenu',
        label: 'Добавить ноду',
        disabled: !canInsert,
        ...(canInsert
          ? {}
          : {
              tooltip: 'У соединения отсутствуют хэндлы для вставки ноды.',
            }),
        renderContent: () => <EdgeAddNodePanel context={context} />,
        width: 340,
        disableListPadding: true,
      },
    ];
  },
};

export default EdgeAddNodeExtension;
