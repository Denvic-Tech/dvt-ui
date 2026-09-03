import React, { memo, useMemo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Box, Divider } from '@mui/material';

import { useNodeData } from '@/features/node/manage-node-data';
import { useNodeDefinition } from '@/features/node/get-node-definition';
import {
  useNodeContentExtensions,
  useNodeVariables,
} from '@/app/providers/node-extensions';
import { TextWidget } from '@/widgets/project-editor/custom-node-widget/widgets/text';
import { WidgetToolbar } from '@/widgets/project-editor/custom-node-widget/ui/WidgetToolBar.tsx';

const ExtensionsList = memo(
  ({ extensions, props, nodeDefinition, nodeData, variables }: any) => {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: -45,
          left: 0,
          zIndex: 10,
          minWidth: '100%',
          bgcolor: 'background.paper',
          borderRadius: 1,
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
        }}
      >
        {extensions.map((ext: any, extIndex: number) => (
          <Box key={ext.id}>
            <ext.component
              {...props}
              nodeDefinition={nodeDefinition}
              data={nodeData}
              variables={variables}
            />
            {extIndex !== extensions.length - 1 && <Divider />}
          </Box>
        ))}
      </Box>
    );
  }
);

// --- Основная Нода ---
const WidgetNodeComponent = (props: NodeProps<any>) => {
  const { id: nodeID, selected } = props;

  const { nodeData, updateInputValue } = useNodeData(nodeID);
  const nodeName = nodeData?.name;
  const nodeDefinition = useNodeDefinition(nodeName);
  const variables = useNodeVariables(nodeID);

  const contentTopExtensions = useNodeContentExtensions(
    'node_content_top',
    nodeDefinition
  );

  const renderedExtensions = useMemo(() => {
    if (!selected || contentTopExtensions.length === 0) return null;

    return (
      <ExtensionsList
        extensions={contentTopExtensions}
        props={props}
        nodeDefinition={nodeDefinition}
        nodeData={nodeData}
        variables={variables}
      />
    );
  }, [
    selected,
    contentTopExtensions,
    nodeDefinition,
    nodeData,
    props,
    variables,
  ]);

  if (!nodeData) return null;

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <WidgetToolbar nodeID={nodeID} isVisible={selected} />

      {renderedExtensions}

      {nodeName === 'Text' && (
        <TextWidget
          id={nodeID}
          data={nodeData}
          selected={selected}
          updateData={updateInputValue}
        />
      )}
    </Box>
  );
};

function arePropsEqual(prev: NodeProps, next: NodeProps) {
  return (
    prev.id === next.id &&
    prev.selected === next.selected &&
    prev.data === next.data
  );
}
ExtensionsList.displayName = 'ExtensionsList';

export const WidgetNode = memo(WidgetNodeComponent, arePropsEqual);
WidgetNode.displayName = 'WidgetNode';
