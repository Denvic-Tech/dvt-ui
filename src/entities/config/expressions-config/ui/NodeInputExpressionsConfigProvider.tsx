import React from 'react';

import { ExpressionsConfigContextProvider } from '@/shared/ui/node-input/ExpressionsConfigContext';

import { useExpressionsConfig } from '../model/hooks';

type NodeInputExpressionsConfigProviderProps = {
  children: React.ReactNode;
};

export const NodeInputExpressionsConfigProvider: React.FC<
  NodeInputExpressionsConfigProviderProps
> = ({ children }) => {
  const { expressionsConfig } = useExpressionsConfig();

  return (
    <ExpressionsConfigContextProvider expressionsConfig={expressionsConfig}>
      {children}
    </ExpressionsConfigContextProvider>
  );
};
