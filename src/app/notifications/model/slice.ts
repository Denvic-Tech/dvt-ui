import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuid4 } from 'uuid';

import {
  AlertCreate,
  AlertGroup,
  AlertsState,
  DEFAULT_ANCHOR,
  deriveGroupKey,
  isLegacyAlertCreate,
  MAX_HISTORY,
  normalizeLegacyAlert,
  Notification,
  NotificationCreate,
  posKey,
} from './types.ts';

const initialState: AlertsState = {
  notificationsById: {},
  groupsByKey: {},
  orderByPosition: {},
  history: [],
};

const unshiftUnique = (arr: string[], key: string) => {
  const idx = arr.indexOf(key);
  if (idx === 0) return arr;
  if (idx > 0) arr.splice(idx, 1);
  arr.unshift(key);
  return arr;
};

const collectActiveIds = (
  groupsByKey: Record<string, { alertIDs: string[] }>
) => {
  const ids = new Set<string>();
  for (const g of Object.values(groupsByKey)) {
    for (const id of g.alertIDs) ids.add(id);
  }
  return ids;
};

const pushToHistory = (state: AlertsState, id: string) => {
  state.history.push(id);
  if (state.history.length > MAX_HISTORY) {
    const evicted = state.history.splice(0, state.history.length - MAX_HISTORY);
    const activeIds = collectActiveIds(state.groupsByKey);
    for (const eid of evicted) {
      if (!activeIds.has(eid)) {
        delete state.notificationsById[eid];
      }
    }
  }
};

const addNotificationToState = (
  state: AlertsState,
  payload: NotificationCreate
) => {
  const id = uuid4();
  const now = Date.now();
  const position = payload.position ?? DEFAULT_ANCHOR;

  const gKey = deriveGroupKey({
    group: payload.group,
    type: payload.type,
    title: payload.title,
  });

  const notification: Notification = {
    id,
    visible: payload.visible ?? true,
    priority: payload.priority ?? 0,
    position,
    paused: false,
    exiting: false,
    dismissed: false,
    createdAt: now,
    lastBumpedAt: now,
    ...payload,
  };
  state.notificationsById[id] = notification;

  pushToHistory(state, id);

  const existing = state.groupsByKey[gKey];
  if (existing) {
    existing.alertIDs.push(id);
    existing.count += 1;
    existing.lastTitle = notification.title;
    existing.lastDescription = notification.description;
    existing.lastDetail = notification.detail;
    existing.lastActions = notification.actions;
    existing.lastIcon = notification.icon;
    existing.type = notification.type;
    existing.visible = true;
    existing.exiting = false;
    existing.lastBumpedAt = now;

    const pk = posKey(existing.position);
    state.orderByPosition[pk] = state.orderByPosition[pk] || [];
    unshiftUnique(state.orderByPosition[pk], gKey);
  } else {
    const group: AlertGroup = {
      key: gKey,
      alertIDs: [id],
      lastTitle: notification.title,
      lastDescription: notification.description,
      lastDetail: notification.detail,
      lastActions: notification.actions,
      lastIcon: notification.icon,
      type: notification.type,
      position,
      visible: true,
      expanded: false,
      paused: false,
      exiting: false,
      count: 1,
      lastBumpedAt: now,
    };
    state.groupsByKey[gKey] = group;

    const pk = posKey(position);
    state.orderByPosition[pk] = state.orderByPosition[pk] || [];
    unshiftUnique(state.orderByPosition[pk], gKey);
  }
};

export const alertSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    addAlert: (state, action: PayloadAction<AlertCreate>) => {
      const raw = action.payload;
      const normalized: NotificationCreate = isLegacyAlertCreate(raw)
        ? normalizeLegacyAlert(raw)
        : raw;
      addNotificationToState(state, normalized);
    },

    setPaused: (
      state,
      action: PayloadAction<{ groupKey: string; paused: boolean }>
    ) => {
      const g = state.groupsByKey[action.payload.groupKey];
      if (g) g.paused = action.payload.paused;
    },

    startExitAnimation: (
      state,
      action: PayloadAction<{ groupKey: string }>
    ) => {
      const g = state.groupsByKey[action.payload.groupKey];
      if (g) g.exiting = true;
    },

    setAlertVisibility: (
      state,
      action: PayloadAction<{ id: string; visibility: boolean }>
    ) => {
      const { id, visibility } = action.payload;
      const a = state.notificationsById[id];
      if (!a) return;
      a.visible = visibility;
    },

    hideGroup: (state, action: PayloadAction<{ groupKey: string }>) => {
      const { groupKey } = action.payload;
      const g = state.groupsByKey[groupKey];
      if (!g) return;
      g.visible = false;
      g.alertIDs.forEach(id => {
        const a = state.notificationsById[id];
        if (a) a.visible = false;
      });
    },

    hideAll: state => {
      Object.values(state.groupsByKey).forEach(g => (g.visible = false));
      Object.values(state.notificationsById).forEach(a => (a.visible = false));
    },

    purgeGroup: (state, action: PayloadAction<{ groupKey: string }>) => {
      const { groupKey } = action.payload;
      const g = state.groupsByKey[groupKey];
      if (!g) return;
      // Keep notification objects alive for history — only remove group/order data
      delete state.groupsByKey[groupKey];
      const pk = posKey(g.position);
      state.orderByPosition[pk] = (state.orderByPosition[pk] || []).filter(
        k => k !== groupKey
      );
    },

    dismissGroup: (state, action: PayloadAction<{ groupKey: string }>) => {
      const { groupKey } = action.payload;
      const g = state.groupsByKey[groupKey];
      if (!g) return;
      // Mark all notifications in this group as dismissed (won't show in history)
      g.alertIDs.forEach(id => {
        const n = state.notificationsById[id];
        if (n) n.dismissed = true;
      });
    },

    purgeAll: state => {
      state.notificationsById = {};
      state.groupsByKey = {};
      state.orderByPosition = {};
    },

    clearHistory: state => {
      const activeIds = collectActiveIds(state.groupsByKey);
      for (const id of state.history) {
        if (!activeIds.has(id)) {
          delete state.notificationsById[id];
        }
      }
      state.history = [];
    },

    setGroupExpanded: (
      state,
      action: PayloadAction<{ groupKey: string; expanded: boolean }>
    ) => {
      const g = state.groupsByKey[action.payload.groupKey];
      if (g) g.expanded = action.payload.expanded;
    },
  },
});

export const {
  addAlert,
  setPaused,
  startExitAnimation,
  setAlertVisibility,
  hideGroup,
  hideAll,
  purgeAll,
  purgeGroup,
  dismissGroup,
  clearHistory,
  setGroupExpanded,
} = alertSlice.actions;

export const addNotification = addAlert;

export default alertSlice.reducer;
