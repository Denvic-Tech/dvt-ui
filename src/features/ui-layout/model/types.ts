export interface GraphViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface UILayoutState {
  sidebar: {
    expanded: boolean;
    categoriesWidth: number;
    categoriesContentWidth: number;
  };

  console: {
    open: boolean;
    height: number;
  };

  nodeDataModal: {
    open: boolean;
  };

  graphViewports: Record<string, GraphViewport>;
}
