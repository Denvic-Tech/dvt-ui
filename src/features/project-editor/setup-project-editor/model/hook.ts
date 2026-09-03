import { useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

import { useWebSocketConnection } from '@/app/realtime/websocket';

import { useNodeDefinitions } from '@/entities/node/node-definition';
import { useProjectTask } from '@/entities/project/project-task';
import { graphApi } from '@/entities/project-editor/graph';

export const useProjectEditorSetup = () => {
  const { projectID } = useParams<{ projectID: string }>();

  const { status: nodeDefinitionsStatus, loadNodeDefinitions } =
    useNodeDefinitions();
  const {
    status: websocketStatus,
    connectWs,
    disconnectWs,
  } = useWebSocketConnection();
  const { createProjectTask, lastProjectTaskID } = useProjectTask();
  const metadataTaskStartedForProjectRef = useRef<string | null>(null);

  const loadProject = useCallback(async () => {
    if (!projectID) throw new Error('Project ID is missing');

    if (nodeDefinitionsStatus === 'idle') {
      const nodeDefinitions = await loadNodeDefinitions();
      console.info(
        `Loaded ${Object.keys(nodeDefinitions).length} node definitions`
      );
    }
  }, [loadNodeDefinitions, nodeDefinitionsStatus, projectID]);

  const createInitialMetadataTask = useCallback(async () => {
    if (!projectID || websocketStatus !== 'connected') return;
    if (lastProjectTaskID) return;
    if (metadataTaskStartedForProjectRef.current === projectID) return;

    metadataTaskStartedForProjectRef.current = projectID;

    try {
      const graph = await graphApi.getGraph(projectID);
      if (graph.nodes.length === 0) {
        console.info(
          `Skip metadata task creation for empty project ID=${projectID}`
        );
        return;
      }

      const firstTaskResponse = await createProjectTask(
        projectID,
        'metadata_only',
        true
      );
      console.info(
        `Created metadata task with ID=${firstTaskResponse.task_id}`
      );
    } catch (error) {
      if (metadataTaskStartedForProjectRef.current === projectID) {
        metadataTaskStartedForProjectRef.current = null;
      }
      throw error;
    }
  }, [createProjectTask, lastProjectTaskID, projectID, websocketStatus]);

  useEffect(() => {
    if (!projectID) return;

    connectWs(projectID);

    return () => {
      disconnectWs(projectID);
    };
  }, [connectWs, disconnectWs, projectID]);

  useEffect(() => {
    loadProject()
      .then(() => {
        console.info(`Project ID=${projectID} loaded`);
      })
      .catch(error => {
        console.error(`Failed to load project ID=${projectID}`, error);
      });
  }, [loadProject, projectID]);

  useEffect(() => {
    createInitialMetadataTask().catch(error => {
      console.error(
        `Failed to create initial metadata task for project ID=${projectID}`,
        error
      );
    });
  }, [createInitialMetadataTask, projectID]);
};
