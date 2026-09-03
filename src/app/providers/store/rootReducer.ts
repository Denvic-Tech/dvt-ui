import { combineReducers } from '@reduxjs/toolkit';

import { errorJournalReducer } from '@/app/errors/error-journal';
import { languageReducer } from '@/app/i18n';
import { alertSlice } from '@/app/notifications';
import { websocketReducer } from '@/app/realtime/websocket';
import { setupReducer } from '@/app/setup';

import { buildVersionReducer } from '@/features/profile/build-version-info';
import { servicesStatusReducer } from '@/features/profile/services-status';
import { systemUpdateReducer } from '@/features/profile/system-update';
import { selectNodeReducer } from '@/features/project-editor/select-node';
import { syncGraphReducer } from '@/features/project-editor/sync-graph';
import { uiLayoutReducer } from '@/features/ui-layout';

import { adminReducer } from '@/entities/admin/admin';
import { apiKeyReducer } from '@/entities/admin/api-key';
import { mcpTokenReducer } from '@/entities/admin/mcp-token';
import { organizationsReducer } from '@/entities/admin/organizations';
import { aiAnalysisReducer } from '@/entities/ai-analysis';
import { appSettingsReducer } from '@/entities/config/app-settings';
import { expressionsConfigReducer } from '@/entities/config/expressions-config';
import { runtimeConfigReducer } from '@/entities/config/runtime-config';
import { dataframeReducer } from '@/entities/data/dataframe';
import {
  dbCatalogApi,
  dbConnectionsReducer,
} from '@/entities/data/db-connection';
import { jsonDataReducer } from '@/entities/data/json-data';
import { storageReducer } from '@/entities/data/storage';
import { logsReducer } from '@/entities/log';
import { fileStorageManagerViewerReducer } from '@/entities/node/file-storage-manager-viewer';
import { nodeDataFrameViewerReducer } from '@/entities/node/node-dataframe-viewer';
import { nodeDefinitionReducer } from '@/entities/node/node-definition';
import { nodeDocumentationReducer } from '@/entities/node/node-documentation';
import { nodeDocumentationViewerReducer } from '@/entities/node/node-documentation-viewer';
import { nodeExecutionStatusReducer } from '@/entities/node/node-execution-status';
import { nodeJsonViewerReducer } from '@/entities/node/node-json-viewer';
import { nodeMetaViewerReducer } from '@/entities/node/node-meta-viewer';
import { nodeMetadataReducer } from '@/entities/node/node-metadata';
import { nodePayloadViewerReducer } from '@/entities/node/node-payload-viewer/ui/slice';
import { projectTaskReducer } from '@/entities/project/project-task';
import { projectsReducer } from '@/entities/project/projects';
import { queueReducer } from '@/entities/project/queue';
import { queueTopicReducer } from '@/entities/project/queue-topic/model/slice';
import { taskExecutionStatusReducer } from '@/entities/project/task-execution-status';
import { taskLogsReducer } from '@/entities/project/task-logs';
import { edgeContextMenuReducer } from '@/entities/project-editor/edge-context-menu';
import { graphReducer } from '@/entities/project-editor/graph';
import { multiNodeContextMenuReducer } from '@/entities/project-editor/multi-node-context-menu';
import { nodeContextMenuReducer } from '@/entities/project-editor/node-context-menu';
import { systemAvailabilityReducer } from '@/entities/system-availability';
import { uiPreferencesReducer } from '@/entities/ui-preferences';

import { apiUtilsReducer } from '@/shared/api/utils';

export const rootReducer = combineReducers({
  websocket: websocketReducer,
  aiAnalysis: aiAnalysisReducer,
  expressionsConfig: expressionsConfigReducer,
  runtimeConfig: runtimeConfigReducer,
  storage: storageReducer,
  apiKeys: apiKeyReducer,
  mcpTokens: mcpTokenReducer,
  apiUtils: apiUtilsReducer,
  appSettings: appSettingsReducer,
  setup: setupReducer,
  nodeDefinition: nodeDefinitionReducer,
  nodeDocumentation: nodeDocumentationReducer,
  nodeDocumentationViewer: nodeDocumentationViewerReducer,
  language: languageReducer,
  alerts: alertSlice.reducer,
  projects: projectsReducer,
  queue: queueReducer,
  taskLogs: taskLogsReducer,
  dataframe: dataframeReducer,
  jsonData: jsonDataReducer,
  dbConnections: dbConnectionsReducer,
  [dbCatalogApi.reducerPath]: dbCatalogApi.reducer,
  logs: logsReducer,
  graph: graphReducer,
  syncGraph: syncGraphReducer,
  nodeExecutionStatus: nodeExecutionStatusReducer,
  nodeContextMenu: nodeContextMenuReducer,
  edgeContextMenu: edgeContextMenuReducer,
  multiNodeContextMenu: multiNodeContextMenuReducer,
  taskExecutionStatus: taskExecutionStatusReducer,
  nodeMetadata: nodeMetadataReducer,
  projectTask: projectTaskReducer,
  uiLayout: uiLayoutReducer,
  uiPreferences: uiPreferencesReducer,
  nodeMetaViewer: nodeMetaViewerReducer,
  nodeDataFrameViewer: nodeDataFrameViewerReducer,
  nodeJsonViewer: nodeJsonViewerReducer,
  selectNode: selectNodeReducer,
  errorJournal: errorJournalReducer,
  admin: adminReducer,
  organizations: organizationsReducer,
  servicesStatus: servicesStatusReducer,
  systemUpdate: systemUpdateReducer,
  systemAvailability: systemAvailabilityReducer,
  buildVersion: buildVersionReducer,
  nodePayloadViewer: nodePayloadViewerReducer,
  queueTopic: queueTopicReducer,
  fileStorageManagerViewer: fileStorageManagerViewerReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
