import React from 'react';

import type { ExpressionsConfig } from '@/shared/gatewayClient';

import { ExpressionsConfigContext } from './expressionsConfigContextValue';

type ExpressionsConfigContextProviderProps = {
  expressionsConfig: ExpressionsConfig | null;
  children: React.ReactNode;
};

export const ExpressionsConfigContextProvider: React.FC<
  ExpressionsConfigContextProviderProps
> = ({ expressionsConfig, children }) => {
  const value = React.useMemo(
    () => ({ expressionsConfig }),
    [expressionsConfig]
  );

  return (
    <ExpressionsConfigContext.Provider value={value}>
      {children}
    </ExpressionsConfigContext.Provider>
  );
};
