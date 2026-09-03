import { createTransform } from 'redux-persist';

import type { AlertsState } from './types.ts';

export const alertsPersistTransform = createTransform<unknown, unknown>(
  inboundState => {
    const alertsState = inboundState as AlertsState;

    return {
      ...alertsState,
      notificationsById: Object.fromEntries(
        Object.entries(alertsState.notificationsById).map(
          ([id, { actions: _actions, icon: _icon, ...notification }]) => [
            id,
            notification,
          ]
        )
      ),
      groupsByKey: Object.fromEntries(
        Object.entries(alertsState.groupsByKey).map(
          ([
            key,
            { lastActions: _lastActions, lastIcon: _lastIcon, ...group },
          ]) => [key, group]
        )
      ),
    };
  },
  outboundState => outboundState,
  { whitelist: ['alerts'] }
);
