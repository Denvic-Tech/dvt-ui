import { configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { errorListenerMiddleware } from '@/app/errors/error-journal';
import {
  alertsPersistTransform,
  initGatewayAlertHandler,
} from '@/app/notifications';
import { websocketMiddleware } from '@/app/realtime/websocket';

import { syncGraphMiddleware } from '@/features/project-editor/sync-graph';

import { dbCatalogApi } from '@/entities/data/db-connection';
import { nodeExecutionStatusListenerMiddleware } from '@/entities/node/node-execution-status';
import { taskExecutionStatusListenerMiddleware } from '@/entities/project/task-execution-status';
import { initGatewaySystemUpdatingHandler } from '@/entities/system-availability';

import { wsMessageActions } from '@/shared/wsMessageActions';

import { rootReducer } from './rootReducer';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['nodeProcessor', 'uiLayout', 'uiPreferences', 'alerts'],
  blacklist: ['websocket', 'nodeDrawer', 'nodesApi', 'edgesApi'],
  transforms: [alertsPersistTransform],
};

const persistedReducer = persistReducer(
  persistConfig as never,
  rootReducer
) as unknown as typeof rootReducer;
const websocketEventActionTypes = Object.values(wsMessageActions).map(
  actionCreator => actionCreator.type
);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        warnAfter: 128,
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
          ...websocketEventActionTypes,
        ],
        ignoredActionPaths: ['payload.actions', 'payload.icon'],
        ignoredPaths: ['alerts'],
      },
      immutableCheck: {
        warnAfter: 128,
        ignoredPaths: ['nodeEditor.persistedNodes'],
      },
    })
      .concat(dbCatalogApi.middleware)
      .concat(websocketMiddleware)
      .prepend(syncGraphMiddleware)
      .prepend(taskExecutionStatusListenerMiddleware)
      .prepend(nodeExecutionStatusListenerMiddleware)
      .prepend(errorListenerMiddleware),
});
export const persistor = persistStore(store);

initGatewayAlertHandler(store.dispatch);
initGatewaySystemUpdatingHandler(store.dispatch);
