import { ActionCreatorWithPayload, createAction } from '@reduxjs/toolkit';

import { type Event, type EventType, zEventType } from '@/shared/gatewayClient';

type PayloadByType<T extends EventType> = Extract<Event, { type: T }>;

type WebSocketEventType<T extends EventType = EventType> =
  `WebSocketEvent/${T}`;

const WS_TYPES = zEventType.options as readonly EventType[];

export const wsMessageActions = WS_TYPES.reduce(
  (acc, t) => {
    (acc as any)[t] = createAction(
      `WebSocketEvent/${t}`
    ) as ActionCreatorWithPayload<
      PayloadByType<typeof t>,
      WebSocketEventType<typeof t>
    >;
    return acc;
  },
  {} as {
    [T in EventType]: ActionCreatorWithPayload<
      PayloadByType<T>,
      WebSocketEventType<T>
    >;
  }
);

export type WebSocketActionsMap = typeof wsMessageActions;
export type WebSocketAction = ReturnType<
  WebSocketActionsMap[keyof WebSocketActionsMap]
>;
