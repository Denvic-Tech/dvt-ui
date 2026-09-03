import { createContext, useContext } from 'react';

export interface GraphNodeFocusRequest {
  nodeID: string;
  requestID: number;
}

export type RequestGraphNodeFocus = (nodeID: string) => void;

export const GraphNodeFocusRequestContext =
  createContext<GraphNodeFocusRequest | null>(null);
export const RequestGraphNodeFocusContext =
  createContext<RequestGraphNodeFocus>(() => undefined);

export const useGraphNodeFocusRequest = (): GraphNodeFocusRequest | null =>
  useContext(GraphNodeFocusRequestContext);

export const useRequestGraphNodeFocus = (): RequestGraphNodeFocus =>
  useContext(RequestGraphNodeFocusContext);
