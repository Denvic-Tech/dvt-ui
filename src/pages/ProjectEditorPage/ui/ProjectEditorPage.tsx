import React, { memo, useEffect } from 'react';
import { Box } from '@mui/material';
import { EdgeTypes, NodeTypes, ReactFlowProvider } from '@xyflow/react';

import { EdgeExtensionsProvider } from '@/app/providers/edge-extensions';
import { NodeExtensionsProvider } from '@/app/providers/node-extensions';
import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import { AIAnalysisBanner } from '@/widgets/ai-analysis-banner';
import { AIAnalysisResultModal } from '@/widgets/ai-analysis-result-modal';
import { Console } from '@/widgets/project-editor/console';
import { CustomEdge } from '@/widgets/project-editor/custom-edge';
import { CustomNode } from '@/widgets/project-editor/custom-node';
import { WidgetNode } from '@/widgets/project-editor/custom-node-widget/ui';
import { FileStorageManagerViewer } from '@/widgets/project-editor/file-storage-manager-viewer/ui';
import { GraphEditor } from '@/widgets/project-editor/graph-editor';
import { NodeDataModal } from '@/widgets/project-editor/node-data-modal';
import { NodeDataFrameViewer } from '@/widgets/project-editor/node-dataframe-viewer';
import { NodeDocumentationViewer } from '@/widgets/project-editor/node-documentation-viewer';
import { NodeJsonViewer } from '@/widgets/project-editor/node-json-viewer';
import { NodeMetaViewer } from '@/widgets/project-editor/node-metadata-viewer';
import { Sidebar } from '@/widgets/project-editor/sidebar';

import { GraphNodeFocusProvider } from '@/features/project-editor/focus-node';
import { useProjectEditorSetup } from '@/features/project-editor/setup-project-editor';
import { GraphSyncStatusIndicator } from '@/features/project-editor/sync-graph';

import {
  loadAIAnalysisHistory,
  useAIAnalysisCompletionAlert,
  useAIAnalysisPolling,
} from '@/entities/ai-analysis';
import { selectIsAIAnalysisEnabled } from '@/entities/config/runtime-config';
import { NodePayloadViewer } from '@/entities/node/node-payload-viewer/ui/NodePayloadViewer';
import { useCurrentProject } from '@/entities/project/projects';

const nodeTypes: NodeTypes = {
  custom: CustomNode as any,
  widget: WidgetNode as any,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge as any,
};

const ProjectEditorPage_ = () => {
  useProjectEditorSetup();
  const dispatch = useAppDispatch();
  const { currentProject } = useCurrentProject();
  const projectId = currentProject?.id;
  const isAIAnalysisEnabled = useAppSelector(selectIsAIAnalysisEnabled);
  const aiAnalysisProjectId = isAIAnalysisEnabled ? projectId : undefined;

  useAIAnalysisPolling(aiAnalysisProjectId);
  useAIAnalysisCompletionAlert(aiAnalysisProjectId);

  useEffect(() => {
    if (!aiAnalysisProjectId) {
      return;
    }

    void dispatch(loadAIAnalysisHistory({ projectId: aiAnalysisProjectId }));
  }, [aiAnalysisProjectId, dispatch]);

  return (
    <GraphNodeFocusProvider>
      <Box
        sx={{
          display: 'flex',
          height: '100%',
          gap: 1.5,
          overflow: 'visible',
        }}
      >
        <Sidebar />
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            height: '100%',
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          <EdgeExtensionsProvider>
            <NodeExtensionsProvider>
              <NodeDataFrameViewer />
              <FileStorageManagerViewer />
              <ReactFlowProvider>
                <Box
                  sx={{
                    position: 'relative',
                    flex: 1,
                    minWidth: 0,
                    height: '100%',
                  }}
                >
                  <NodeMetaViewer />
                  <NodePayloadViewer />
                  <NodeJsonViewer />
                  <NodeDocumentationViewer />
                  <GraphSyncStatusIndicator />
                  <GraphEditor nodeTypes={nodeTypes} edgeTypes={edgeTypes} />
                  <Console />
                  {isAIAnalysisEnabled ? (
                    <>
                      <AIAnalysisBanner />
                      <AIAnalysisResultModal />
                    </>
                  ) : null}
                </Box>
                <NodeDataModal />
              </ReactFlowProvider>
            </NodeExtensionsProvider>
          </EdgeExtensionsProvider>
        </Box>
      </Box>
    </GraphNodeFocusProvider>
  );
};

export const ProjectEditorPage = memo(ProjectEditorPage_);
