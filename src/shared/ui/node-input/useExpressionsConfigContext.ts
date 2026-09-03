import React from 'react';

import { ExpressionsConfigContext } from './expressionsConfigContextValue';

export const useExpressionsConfigContext = () =>
  React.useContext(ExpressionsConfigContext);
