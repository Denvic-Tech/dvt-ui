import React from 'react';

import type { ExpressionsConfig } from '@/shared/gatewayClient';

export type ExpressionsConfigContextValue = {
  expressionsConfig: ExpressionsConfig | null;
};

export const ExpressionsConfigContext =
  React.createContext<ExpressionsConfigContextValue>({
    expressionsConfig: null,
  });
