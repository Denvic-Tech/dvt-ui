export interface NodeDocumentationViewerPayload {
  nodeName: string;
  nodeTitle: string;
}

export interface NodeDocumentationViewerState {
  nodeName: string | null;
  nodeTitle: string | null;
  open: boolean;
}
