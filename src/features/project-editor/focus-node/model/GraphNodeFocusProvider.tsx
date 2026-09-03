import React, { useCallback, useRef, useState } from 'react';

import {
  type GraphNodeFocusRequest,
  GraphNodeFocusRequestContext,
  RequestGraphNodeFocusContext,
} from './context';

interface GraphNodeFocusProviderProps {
  children: React.ReactNode;
}

export const GraphNodeFocusProvider: React.FC<GraphNodeFocusProviderProps> = ({
  children,
}) => {
  const nextRequestIDRef = useRef(0);
  const [request, setRequest] = useState<GraphNodeFocusRequest | null>(null);

  const requestGraphNodeFocus = useCallback((nodeID: string) => {
    nextRequestIDRef.current += 1;
    setRequest({
      nodeID,
      requestID: nextRequestIDRef.current,
    });
  }, []);

  return (
    <RequestGraphNodeFocusContext.Provider value={requestGraphNodeFocus}>
      <GraphNodeFocusRequestContext.Provider value={request}>
        {children}
      </GraphNodeFocusRequestContext.Provider>
    </RequestGraphNodeFocusContext.Provider>
  );
};
